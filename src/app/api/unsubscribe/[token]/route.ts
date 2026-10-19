import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { setMarketingSubscription, UNSUBSCRIBE_TOKEN_RE } from "@/lib/crm";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const Token = z.string().regex(UNSUBSCRIBE_TOKEN_RE);

/**
 * RFC 8058 one-click unsubscribe: the target of marketing emails' `List-Unsubscribe` header.
 * Mailbox providers (Gmail, Yahoo…) POST `List-Unsubscribe=One-Click` here when the recipient
 * presses their built-in Unsubscribe button. The token is the credential; the reply never says
 * whether it matched a contact.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const token = Token.safeParse((await params).token);
  // Providers send these from shared mail servers, so the per-IP budget is generous.
  const limit = await rateLimitByIp("unsubscribe-one-click", 120, 10 * 60);
  if (!limit.ok) return new NextResponse(null, { status: 429, headers: { "Retry-After": "600" } });
  if (token.success) {
    try {
      await setMarketingSubscription(token.data, false, "one_click");
    } catch (err) {
      console.error("[unsubscribe] one-click failed", err);
      return new NextResponse(null, { status: 500 });
    }
  }
  return new NextResponse(null, { status: 200 });
}

/** A client that opens the header link in a browser gets the normal confirmation page (GET never unsubscribes). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return NextResponse.redirect(new URL(`/unsubscribe/${encodeURIComponent(token)}`, request.url), 303);
}
