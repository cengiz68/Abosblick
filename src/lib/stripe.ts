import Stripe from "stripe";

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY fehlt");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Wendet ein Stripe-Subscription-Objekt auf den Nutzer an (reine Abbildung, testbar). */
export function planFromSubscription(sub: Pick<Stripe.Subscription, "status" | "items"> & { current_period_end?: number }) {
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return {
    plan: active ? "PRO" : "FREE",
    proUntil: active && end ? new Date(end * 1000) : null,
  };
}
