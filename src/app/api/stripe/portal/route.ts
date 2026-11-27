import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { stripe, stripeEnabled } from "@/lib/stripe";

export async function POST() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const user = await currentUser();
  if (!user?.stripeCustomerId || !stripeEnabled()) return NextResponse.redirect(`${appUrl}/settings`, 303);
  const portal = await stripe().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${appUrl}/settings` });
  return NextResponse.redirect(portal.url, 303);
}
