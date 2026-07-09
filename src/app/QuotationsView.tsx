import { useState } from "react";
import { Search, Plus, Edit3 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface Quotation {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border border-slate-200",
    SENT: "bg-blue-50 text-blue-700 border border-blue-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border border-red-200",
    EXPIRED: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ACCEPTED" ? "bg-emerald-500" : status === "REJECTED" ? "bg-red-500" : status === "SENT" ? "bg-blue-500" : status === "EXPIRED" ? "bg-amber-500" : "bg-slate-400"}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function QuotationsView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Quotation | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<Quotation[]>(
    () => api.get(`/quotations?page=1&limit=200&search=${search}`),
    [search]
  );

  const quotations = data || [];

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/quotations/${editItem.id}`, form);
      } else {
        await api.post("/quotations", form);
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
          <h1 className="text-xl font-semibold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{quotations.length} quotations</p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> New Quotation
        </button>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search quotations…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Quote #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Valid Until</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotations.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No quotations found</td></tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3 text-sm font-mono font-medium text-foreground">{q.quoteNumber}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{q.customer?.name || "Walk-in"}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(q.total)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-KE") : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(q); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
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
        title={editItem ? "Edit Quotation" : "New Quotation"}
        saving={saving}
        fields={[
          { name: "customerId", label: "Customer ID" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
