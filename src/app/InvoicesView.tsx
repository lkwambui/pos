import { useState } from "react";
import { Search, Plus, Edit3 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  status: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    UNPAID: "bg-amber-50 text-amber-700 border border-amber-200",
    PARTIALLY_PAID: "bg-blue-50 text-blue-700 border border-blue-200",
    OVERDUE: "bg-red-50 text-red-600 border border-red-200",
    CANCELLED: "bg-slate-100 text-slate-500 border border-slate-200",
    REFUNDED: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  const labels: Record<string, string> = {
    PAID: "Paid", UNPAID: "Unpaid", PARTIALLY_PAID: "Partial",
    OVERDUE: "Overdue", CANCELLED: "Cancelled", REFUNDED: "Refunded",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.UNPAID}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "PAID" ? "bg-emerald-500" : status === "OVERDUE" ? "bg-red-500" : status === "PARTIALLY_PAID" ? "bg-blue-500" : status === "REFUNDED" ? "bg-purple-500" : "bg-amber-500"}`} />
      {labels[status] || status}
    </span>
  );
}

export function InvoicesView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<Invoice[]>(
    () => api.get(`/invoices?page=1&limit=200&search=${search}`),
    [search]
  );

  const invoices = data || [];

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/invoices/${editItem.id}`, form);
      }
      refetch();
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{invoices.length} invoices</p>
        </div>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search invoices…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Paid</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Due</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">No invoices found</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3 text-sm font-mono font-medium text-foreground">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{inv.customer?.name || "Walk-in"}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(inv.total)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">{fmt(inv.amountPaid)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-red-500">{fmt(Math.max(0, inv.total - inv.amountPaid))}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("en-KE")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(inv); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Edit Invoice"
        saving={saving}
        initialData={editItem ? { notes: editItem.notes || "" } : undefined}
        fields={[
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
