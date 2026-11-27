import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripeWebhook";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new NextResponse("Webhook nicht konfiguriert", { status: 400 });

  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new NextResponse("Ungültige Signatur", { status: 400 });
  }
  await handleStripeEvent(db, event, (id) => stripe().subscriptions.retrieve(id));
  return NextResponse.json({ received: true });
}
