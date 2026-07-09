import { useState } from "react";
import { Search, Users, Plus, Mail, Phone, Shield, CreditCard, Star, Edit3, ChevronRight } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;
const fmtShort = (n: number) => {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `KES ${(n / 1000).toFixed(0)}K`;
  return `KES ${n}`;
};

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  kraPin: string | null;
  address: string | null;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
  _count?: { purchases: number; sales: number };
}

export function CustomersView() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<Customer[]>(
    () => api.get(`/customers?page=1&limit=200&search=${search}`),
    [search]
  );

  const customers = data || [];

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : undefined,
      };
      if (editItem) {
        await api.put(`/customers/${editItem.id}`, payload);
      } else {
        await api.post("/customers", payload);
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
          <h1 className="text-xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} customers registered</p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-muted rounded-lg text-sm border-0 outline-none" placeholder="Search customers…" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
          ) : (
            <div className="divide-y divide-border">
              {customers.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">No customers found</div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-muted/40 ${selected?.id === c.id ? "bg-blue-50/50 border-l-2 border-primary" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.phone || c.email || "-"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditItem(c); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
                        <Edit3 size={13} />
                      </button>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selected ? (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {selected.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="font-semibold text-foreground">{selected.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{selected.phone || "-"}</div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Email", value: selected.email || "-", icon: Mail },
                { label: "KRA PIN", value: selected.kraPin || "-", icon: Shield },
                { label: "Credit Limit", value: fmt(selected.creditLimit), icon: CreditCard },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <row.icon size={13} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-20">{row.label}</span>
                  <span className="text-xs font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-700">{selected._count?.sales || 0}</div>
                <div className="text-[10px] text-blue-600">Purchases</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-700">{fmtShort(selected.creditLimit)}</div>
                <div className="text-[10px] text-emerald-600">Credit Limit</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-center">
            <div className="text-center">
              <Users size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a customer</p>
            </div>
          </div>
        )}
      </div>

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title={editItem ? "Edit Customer" : "Add Customer"}
        saving={saving}
        initialData={editItem ? {
          name: editItem.name,
          phone: editItem.phone || "",
          email: editItem.email || "",
          kraPin: editItem.kraPin || "",
          address: editItem.address || "",
          creditLimit: String(editItem.creditLimit || 0),
        } : undefined}
        fields={[
          { name: "name", label: "Customer Name", required: true },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email", type: "email" },
          { name: "kraPin", label: "KRA PIN" },
          { name: "address", label: "Address", type: "textarea" },
          { name: "creditLimit", label: "Credit Limit (KES)", type: "number" },
        ]}
      />
    </div>
  );
}
