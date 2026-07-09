import { useState } from "react";
import { Search, Edit3 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface ReturnRecord {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { id: string; name: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "APPROVED" ? "bg-emerald-500" : status === "REJECTED" ? "bg-red-500" : "bg-amber-500"}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function ReturnsView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ReturnRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<ReturnRecord[]>(
    () => api.get(`/returns?page=1&limit=200&search=${search}`),
    [search]
  );

  const returns = data || [];

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/returns/${editItem.id}`, form);
      } else {
        await api.post("/returns", form);
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
          <h1 className="text-xl font-semibold text-foreground">Returns & Refunds</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{returns.length} returns processed</p>
        </div>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search returns…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Return #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Reason</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {returns.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No returns found</td></tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3 text-sm font-mono font-medium text-foreground">{r.returnNumber}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.customer?.name || "Walk-in"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(r.total)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-KE")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(r); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
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
        title={editItem ? "Edit Return" : "Create Return"}
        saving={saving}
        fields={[
          { name: "customerId", label: "Customer ID" },
          { name: "reason", label: "Reason", type: "textarea", required: true },
        ]}
      />
    </div>
  );
}
