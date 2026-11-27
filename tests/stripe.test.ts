import { describe, it, expect, beforeEach } from "vitest";
import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/stripeWebhook";
import { testDb, reset, makeUser } from "./helpers";

const periodEnd = Math.floor(new Date("2027-01-01").getTime() / 1000);
const sub = (status: string) => ({ id: "sub_1", customer: "cus_1", status, items: { data: [{ current_period_end: periodEnd }] } }) as unknown as Stripe.Subscription;
const ev = (type: string, object: unknown) => ({ type, data: { object } }) as unknown as Stripe.Event;

describe("Stripe-Webhook", () => {
  beforeEach(reset);

  it("checkout.session.completed schaltet Pro frei", async () => {
    const u = await makeUser();
    await handleStripeEvent(testDb, ev("checkout.session.completed", { subscription: "sub_1", client_reference_id: u.id, customer: "cus_1" }), async () => sub("active"));
    const after = await testDb.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(after.plan).toBe("PRO");
    expect(after.proUntil?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(after.stripeCustomerId).toBe("cus_1");
  });

  it("subscription.deleted setzt auf Free zurück", async () => {
    const u = await makeUser("c@example.ch", { plan: "PRO", stripeCustomerId: "cus_1" });
    await handleStripeEvent(testDb, ev("customer.subscription.deleted", sub("active")), async () => sub("active"));
    expect((await testDb.user.findUniqueOrThrow({ where: { id: u.id } })).plan).toBe("FREE");
  });
});
