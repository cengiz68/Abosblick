import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";

export async function POST(req: Request) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const user = await currentUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`, 303);
  if (!stripeEnabled()) return new NextResponse("Stripe nicht konfiguriert", { status: 503 });

  const interval = (await req.formData()).get("interval") === "year" ? "year" : "month";
  const price = interval === "year" ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  if (!price) return new NextResponse("Preis-ID fehlt", { status: 503 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/pricing`,
    allow_promotion_codes: true,
  });
  return NextResponse.redirect(session.url!, 303);
}
