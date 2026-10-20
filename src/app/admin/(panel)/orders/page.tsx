import { and, desc, eq, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { DollarSign, ExternalLink, Receipt, ShoppingCart, Undo2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { checkoutMode, livePaymentsBlocked } from "@/lib/payments";
import { agentsForOrders } from "@/lib/sales/stats";
import { getBusinessTimezone } from "@/lib/scheduling";
import { stripeDashboardUrl, stripeTestMode } from "@/lib/stripe";
import { cn, formatDateTime, formatMoney, pluralize } from "@/lib/utils";
import { RefundOrderForm } from "./refund-form";

export const metadata: Metadata = { title: "Orders" };

const STATUS_FILTERS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "refunded", label: "Refunded" },
  { key: "expired", label: "Expired" },
  { key: "failed", label: "Failed" },
];

const STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  paid: "green",
  pending: "amber",
  refunded: "red",
  expired: "neutral",
  failed: "red",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  expired: "Expired",
  failed: "Failed",
};

const ROW_LIMIT = 200;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3_600_000);
}

function filterHref(status: string, type: string) {
  const p = new URLSearchParams();
  if (status !== "all") p.set("status", status);
  if (type !== "all") p.set("type", type);
  const q = p.toString();
  return q ? `/admin/orders?${q}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUS_FILTERS.some((f) => f.key === sp.status) ? (sp.status as "all" | OrderStatus) : "all";
  const type = sp.type === "course" || sp.type === "booking" ? sp.type : "all";

  const db = await getDb();
  const where: SQL[] = [];
  if (status !== "all") where.push(eq(schema.orders.status, status));
  if (type !== "all") where.push(eq(schema.orders.itemType, type));

  const abandonedCutoff = hoursAgo(1);
  const [orders, [kpi], [abandoned], tz] = await Promise.all([
    db
      .select()
      .from(schema.orders)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(schema.orders.createdAt))
      .limit(ROW_LIMIT),
    db
      .select({
        revenue: sql<number>`coalesce(sum(case when ${schema.orders.status} = 'paid' and not ${schema.orders.isTest} then ${schema.orders.amountCents} else 0 end), 0)`.mapWith(Number),
        testRevenue: sql<number>`coalesce(sum(case when ${schema.orders.status} = 'paid' and ${schema.orders.isTest} then ${schema.orders.amountCents} else 0 end), 0)`.mapWith(Number),
        paid: sql<number>`count(*) filter (where ${schema.orders.status} = 'paid')`.mapWith(Number),
        total: sql<number>`count(*)`.mapWith(Number),
        refunds: sql<number>`count(*) filter (where ${schema.orders.status} = 'refunded')`.mapWith(Number),
        refunded: sql<number>`coalesce(sum(case when ${schema.orders.status} = 'refunded' then ${schema.orders.amountCents} else 0 end), 0)`.mapWith(Number),
      })
      .from(schema.orders),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.orders)
      .where(or(eq(schema.orders.status, "expired"), and(eq(schema.orders.status, "pending"), lt(schema.orders.createdAt, abandonedCutoff)))),
    getBusinessTimezone(),
  ]);

  const contactIds = [...new Set(orders.map((o) => o.contactId).filter((id): id is string => Boolean(id)))];
  const contacts = contactIds.length
    ? await db.select({ id: schema.contacts.id, name: schema.contacts.name }).from(schema.contacts).where(inArray(schema.contacts.id, contactIds))
    : [];
  const contactName = new Map(contacts.map((c) => [c.id, c.name]));
  // Paid sessions whose booking was cancelled since: the owner may still owe the buyer a refund.
  const paidBookingIds = [
    ...new Set(orders.filter((o) => o.status === "paid" && o.itemType === "booking" && o.bookingId).map((o) => o.bookingId as string)),
  ];
  const cancelledBookings = new Set(
    paidBookingIds.length
      ? (
          await db
            .select({ id: schema.bookings.id })
            .from(schema.bookings)
            .where(and(inArray(schema.bookings.id, paidBookingIds), eq(schema.bookings.status, "cancelled")))
        ).map((b) => b.id)
      : [],
  );
  // Which sales agent each course sale is credited to.
  const agentByOrder = await agentsForOrders(orders.map((o) => o.id));
  const mode = checkoutMode();
  // Stripe test-mode payments are flagged isTest; with test keys configured, every payment lives in test mode.
  const testKeys = stripeTestMode();

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          mode === "stripe"
            ? "Every course and paid-session checkout, synced from Stripe."
            : mode === "test"
              ? "Stripe isn't connected, so purchases run through the built-in test checkout (marked “Test”)."
              : livePaymentsBlocked()
                ? "Checkout is off: a live Stripe key is turned off in demo mode, since orders would be lost. Connect a database, or use a test key (sk_test_…) to try payments."
                : "Payments aren't configured. Add STRIPE_SECRET_KEY to start selling."
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatMoney(kpi?.revenue ?? 0)}
          icon={DollarSign}
          hint={kpi?.testRevenue ? `+ ${formatMoney(kpi.testRevenue)} in test orders` : "Paid orders, excluding tests"}
        />
        <StatCard label="Paid orders" value={kpi?.paid ?? 0} icon={Receipt} hint={`of ${pluralize(kpi?.total ?? 0, "checkout")} started`} />
        <StatCard
          label="Refunds"
          value={kpi?.refunds ?? 0}
          icon={Undo2}
          hint={kpi?.refunded ? `${formatMoney(kpi.refunded)} refunded` : "No refunds"}
        />
        <StatCard label="Abandoned checkouts" value={abandoned?.n ?? 0} icon={ShoppingCart} hint="Expired or unpaid for 1h+ — they're in your CRM" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={filterHref(f.key, type)}
              aria-current={status === f.key ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                status === f.key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Filter by item" className="flex gap-1 text-sm">
          {(["all", "course", "booking"] as const).map((t) => (
            <Link
              key={t}
              href={filterHref(status, t)}
              aria-current={type === t ? "page" : undefined}
              className={cn("rounded-lg px-2.5 py-1.5 font-medium", type === t ? "bg-brand-50 text-brand-700" : "text-zinc-500 hover:text-zinc-900")}
            >
              {t === "all" ? "All items" : t === "course" ? "Courses" : "Sessions"}
            </Link>
          ))}
        </nav>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={status === "all" && type === "all" ? "No orders yet" : "No orders match this filter"}
          description={
            status === "all" && type === "all"
              ? "When someone starts a checkout for a course or a paid session, it appears here."
              : "Try a different status or item filter."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Customer</TH>
                <TH>Item</TH>
                <TH className="text-right">Amount</TH>
                <TH>Status</TH>
                <TH>
                  <span className="sr-only">Actions</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {orders.map((o) => {
                const name = (o.contactId && contactName.get(o.contactId)) || o.name;
                return (
                  <TR key={o.id}>
                    <TD className="whitespace-nowrap text-zinc-500">
                      {formatDateTime(o.createdAt, tz)}
                      {o.paidAt && o.status === "paid" && <span className="block text-xs">Paid {formatDateTime(o.paidAt, tz)}</span>}
                    </TD>
                    <TD>
                      {o.contactId ? (
                        <Link href={`/admin/contacts/${o.contactId}`} className="font-medium text-zinc-900 hover:text-brand-700">
                          {name || o.email}
                        </Link>
                      ) : (
                        <span className="font-medium text-zinc-900">{name || o.email}</span>
                      )}
                      {name && <span className="block text-xs text-zinc-500">{o.email}</span>}
                    </TD>
                    <TD className="max-w-xs">
                      <span className="line-clamp-2 text-zinc-800">{o.description}</span>
                      <span className="text-xs text-zinc-500">{o.itemType === "course" ? "Course" : "Paid session"}</span>
                      {agentByOrder.get(o.id) && (
                        <span className="block text-xs text-zinc-500">
                          Sold by{" "}
                          <Link href={`/admin/sales/${agentByOrder.get(o.id)!.agentId}`} className="font-medium text-brand-700 hover:underline">
                            {agentByOrder.get(o.id)!.name}
                          </Link>
                          {agentByOrder.get(o.id)!.status === "void" && " (commission cancelled)"}
                        </span>
                      )}
                    </TD>
                    <TD className="text-right font-medium whitespace-nowrap text-zinc-900 tabular-nums">{formatMoney(o.amountCents, o.currency)}</TD>
                    <TD>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={STATUS_TONES[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                        {o.isTest && <Badge tone="amber">Test</Badge>}
                        {o.status === "paid" && o.bookingId && cancelledBookings.has(o.bookingId) && <Badge tone="red">Session cancelled</Badge>}
                        {o.stripePaymentIntentId && (
                          <a
                            href={stripeDashboardUrl(o.stripePaymentIntentId, o.isTest || testKeys)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-700 hover:underline"
                          >
                            Stripe <ExternalLink className="size-3" aria-hidden />
                            <span className="sr-only">(opens payment in Stripe)</span>
                          </a>
                        )}
                      </div>
                    </TD>
                    <TD className="text-right">{o.status === "paid" && <RefundOrderForm orderId={o.id} isCourse={o.itemType === "course"} />}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          {orders.length === ROW_LIMIT && (
            <p className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">Showing the {ROW_LIMIT} most recent orders. Use the filters to narrow down.</p>
          )}
        </Card>
      )}
    </>
  );
}
