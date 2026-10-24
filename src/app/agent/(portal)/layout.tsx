import { LogOut } from "lucide-react";
import Link from "next/link";
import { Avatar, Logo } from "@/components/ui/misc";
import { currentAgent } from "@/lib/sales/agents";
import { agentLogoutAction } from "../actions";
import { AgentNav } from "./agent-nav";

/**
 * Agent portal shell. Each page checks currentAgent() itself (a client-side navigation re-renders only the page);
 * this only shows who is signed in.
 */
export default async function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  const agent = await currentAgent();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-white px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-6 sm:px-6 lg:px-8">
          <Link href="/agent" className="shrink-0" aria-label="Agent dashboard">
            <Logo className="hidden sm:flex" />
            <Logo className="sm:hidden [&>span:last-child]:hidden" />
          </Link>
          <AgentNav />
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {agent && (
              <>
                <span className="hidden max-w-56 truncate text-sm text-zinc-500 md:block" title={agent.email}>
                  {agent.name}
                </span>
                <Avatar name={agent.name} email={agent.email} className="hidden size-8 sm:inline-flex" />
              </>
            )}
            <form action={agentLogoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 sm:min-h-10"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
