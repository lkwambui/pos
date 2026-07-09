import { useState } from "react";
import { Search, Banknote, Plus, Edit3, Trash2 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface Expense {
  id: string;
  amount: number;
  description: string;
  reference: string | null;
  date: string;
  categoryId: string;
  category: { id: string; name: string };
  user: { id: string; firstName: string; lastName: string };
}

export function ExpensesView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<Expense[]>(
    () => api.get(`/expenses?page=1&limit=200`),
    []
  );

  const { data: categories } = useApi<Array<{ id: string; name: string }>>(
    () => api.get("/expenses/categories"),
    []
  );

  const expenses = data || [];
  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/expenses/${editItem.id}`, form);
      } else {
        await api.post("/expenses", form);
      }
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    refetch();
  };

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{expenses.length} expense records</p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Expense
        </button>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search expenses…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No expenses found</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Banknote size={14} className="text-amber-600" />
                        </div>
                        <div className="text-sm font-medium text-foreground">{e.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">{e.category.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-KE")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(e); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500" title="Delete">
                          <Trash2 size={13} />
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
        title={editItem ? "Edit Expense" : "Add Expense"}
        saving={saving}
        initialData={editItem ? {
          description: editItem.description,
          amount: String(editItem.amount),
          categoryId: editItem.categoryId,
          reference: editItem.reference || "",
          date: editItem.date.split("T")[0],
        } : undefined}
        fields={[
          { name: "description", label: "Description", required: true },
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "categoryId", label: "Category", type: "select", required: true,
            options: (categories || []).map((c) => ({ value: c.id, label: c.name }))
          },
          { name: "reference", label: "Reference" },
          { name: "date", label: "Date", type: "text" },
        ]}
      />
    </div>
  );
}
