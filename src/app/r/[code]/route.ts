import { approvedAgentByCode, AGENT_COOKIE } from "@/lib/sales/referrals";
import { safeRedirectPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ATTRIBUTION_TTL = 60 * 60 * 24 * 90;

/**
 * A sales agent's short link, `/r/<CODE>` (optionally `?to=/courses/some-course`): remembers the agent like `?ref=CODE`
 * does, then opens the site. An unknown or inactive code still opens the site, just without the referral.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const to = safeRedirectPath(new URL(request.url).searchParams.get("to"), "/");
  const target = to.startsWith("/admin") || to.startsWith("/agent") || to.startsWith("/r/") ? "/" : to;
  const headers = new Headers({ Location: new URL(target, request.url).toString(), "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  const agent = code.length <= 32 ? await approvedAgentByCode(code) : null;
  if (agent?.code) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    headers.append("Set-Cookie", `${AGENT_COOKIE}=${agent.code}; Path=/; Max-Age=${ATTRIBUTION_TTL}; HttpOnly; SameSite=Lax${secure}`);
  }
  return new Response(null, { status: 307, headers });
}
