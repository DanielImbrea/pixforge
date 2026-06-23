import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { priceIdFromPlan } from '@/lib/stripe/plan-mapping';
import { checkoutRequestSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const parsed = checkoutRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { plan, locale } = parsed.data;

  const priceId = priceIdFromPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: 'Plan price not configured.' }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', authUser.id).single();

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
  }

  let customerId = profile.stripe_customer_id as string | null;

  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_user_id: authUser.id },
    });
    customerId = customer.id;
    await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', authUser.id);
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/${locale}/billing?checkout=success`,
    cancel_url: `${appUrl}/${locale}/pricing?checkout=cancelled`,
    metadata: { supabase_user_id: authUser.id, plan },
    subscription_data: {
      metadata: { supabase_user_id: authUser.id, plan },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
