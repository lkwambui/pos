import { useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  createdAt: string;
  invoice: { id: string; invoiceNumber: string } | null;
  sale: { id: string; saleNumber: string } | null;
}

const methodStyles: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-700",
  CARD: "bg-violet-100 text-violet-700",
  MPESA: "bg-green-100 text-green-700",
  BANK_TRANSFER: "bg-blue-100 text-blue-700",
  SPLIT: "bg-amber-100 text-amber-700",
  CREDIT: "bg-slate-100 text-slate-700",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    PARTIALLY_PAID: "bg-blue-50 text-blue-700 border border-blue-200",
    REFUNDED: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PAID}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "PAID" ? "bg-emerald-500" : status === "REFUNDED" ? "bg-red-500" : status === "PENDING" ? "bg-amber-500" : "bg-blue-500"}`} />
      {status === "PARTIALLY_PAID" ? "Partial" : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PaymentsView() {
  const [search, setSearch] = useState("");

  const { data, loading, error } = useApi<Payment[]>(
    () => api.get(`/payments?page=1&limit=200`),
    []
  );

  const payments = data || [];
  const filtered = payments.filter((p) =>
    p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.sale?.saleNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{payments.length} payment records</p>
        </div>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search payments…"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Method</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No payments found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3 text-sm font-mono text-foreground">
                      {p.invoice?.invoiceNumber || p.sale?.saleNumber || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${methodStyles[p.method] || "bg-slate-100 text-slate-700"}`}>
                        {p.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-KE")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
