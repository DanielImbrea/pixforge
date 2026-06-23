import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const locale = body.locale === 'ro' ? 'ro' : 'en';

  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('*').eq('id', authUser.id).single();

  if (!profile || !profile.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found.' }, { status: 404 });
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/${locale}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
