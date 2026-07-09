import { useState } from "react";
import { Search, Truck, Phone, Mail, Plus, Edit3, Trash2 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  kraPin: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  address: string | null;
  outstandingBalance: number;
  isActive: boolean;
}

export function SuppliersView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<Supplier[]>(
    () => api.get(`/suppliers?page=1&limit=200&search=${search}`),
    [search]
  );

  const suppliers = data || [];

  const openCreate = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setModalOpen(true);
  };

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/suppliers/${editItem.id}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this supplier?")) return;
    await api.delete(`/suppliers/${id}`);
    refetch();
  };

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{suppliers.length} suppliers</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search suppliers…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Contact</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Balance</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No suppliers found</td></tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Truck size={14} className="text-violet-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{s.name}</div>
                          {s.contactPerson && <div className="text-xs text-muted-foreground">Contact: {s.contactPerson}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} />{s.phone}</span>}
                      {s.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} />{s.email}</span>}
                      {!s.phone && !s.email && <span className="text-xs text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(s.outstandingBalance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500" title="Delete">
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
        title={editItem ? "Edit Supplier" : "Add Supplier"}
        saving={saving}
        initialData={editItem ? {
          name: editItem.name,
          phone: editItem.phone || "",
          email: editItem.email || "",
          kraPin: editItem.kraPin || "",
          contactPerson: editItem.contactPerson || "",
          contactPhone: editItem.contactPhone || "",
          address: editItem.address || "",
        } : undefined}
        fields={[
          { name: "name", label: "Supplier Name", required: true },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email", type: "email" },
          { name: "kraPin", label: "KRA PIN" },
          { name: "contactPerson", label: "Contact Person" },
          { name: "contactPhone", label: "Contact Phone" },
          { name: "address", label: "Address", type: "textarea" },
        ]}
      />
    </div>
  );
}
