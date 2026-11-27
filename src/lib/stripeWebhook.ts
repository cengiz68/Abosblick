import type Stripe from "stripe";
import type { PrismaClient } from "@prisma/client";
import { planFromSubscription } from "./stripe";

/** Verarbeitet ein verifiziertes Stripe-Event. getSubscription wird injiziert, damit es testbar bleibt. */
export async function handleStripeEvent(
  db: PrismaClient,
  event: Stripe.Event,
  getSubscription: (id: string) => Promise<Stripe.Subscription>,
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (!s.subscription || !s.client_reference_id) return;
      const sub = await getSubscription(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
      await db.user.update({
        where: { id: s.client_reference_id },
        data: { ...planFromSubscription(sub), stripeSubscriptionId: sub.id, stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id },
      });
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await db.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { ...planFromSubscription(event.type === "customer.subscription.deleted" ? { ...sub, status: "canceled" } : sub), stripeSubscriptionId: sub.id },
      });
      return;
    }
  }
}
