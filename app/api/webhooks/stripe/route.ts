import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { planFromPriceId } from '@/lib/stripe/plan-mapping';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.customer) {
        await admin
          .from('users')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? planFromPriceId(priceId) : null;

      if (!userId || !plan) break;

      await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan,
          status: mapStripeStatus(subscription.status),
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        { onConflict: 'stripe_subscription_id' }
      );

      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await admin.from('users').update({ plan }).eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;

      await admin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);

      if (userId) {
        await admin.from('users').update({ plan: 'free' }).eq('id', userId);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await resolveUserIdFromInvoice(admin, invoice);

      if (userId) {
        await admin.from('payments').insert({
          user_id: userId,
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id:
            typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          amount_cents: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = await resolveUserIdFromInvoice(admin, invoice);

      if (userId) {
        await admin.from('payments').insert({
          user_id: userId,
          stripe_invoice_id: invoice.id,
          amount_cents: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  if (status === 'active' || status === 'trialing' || status === 'past_due' || status === 'canceled') {
    return status;
  }
  return 'incomplete';
}

async function resolveUserIdFromInvoice(
  admin: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
): Promise<string | null> {
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription && 'id' in invoice.subscription
        ? invoice.subscription.id
        : null;

  if (!subscriptionId) return null;

  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  return data?.user_id ?? null;
}
