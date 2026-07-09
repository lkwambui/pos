import { useState } from "react";
import { Search, Package, Plus, Edit3, Trash2 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: number;
  purchasePrice: number;
  vatRate: number;
  unit: string;
  isActive: boolean;
  trackStock: boolean;
  lowStockLevel: number;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

export function ProductsView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<Product[]>(
    () => api.get(`/products?page=1&limit=200&search=${search}`),
    [search]
  );

  const { data: categories } = useApi<Array<{ id: string; name: string }>>(
    () => api.get("/categories?page=1&limit=100"),
    []
  );

  const { data: brands } = useApi<Array<{ id: string; name: string }>>(
    () => api.get("/brands?page=1&limit=100"),
    []
  );

  const products = data || [];
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : undefined,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        vatRate: form.vatRate ? parseFloat(form.vatRate) : undefined,
        initialStock: form.initialStock ? parseInt(form.initialStock) : undefined,
      };
      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
      } else {
        await api.post("/products", payload);
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
          <h1 className="text-xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} products</p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search products…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">VAT</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          {p.brand && <div className="text-xs text-muted-foreground">{p.brand.name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">{p.category?.name || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.vatRate > 0 ? (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{p.vatRate}%</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Exempt</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(p); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
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
        title={editItem ? "Edit Product" : "Add Product"}
        saving={saving}
        initialData={editItem ? {
          name: editItem.name,
          sellingPrice: String(editItem.sellingPrice),
          purchasePrice: String(editItem.purchasePrice),
          vatRate: String(editItem.vatRate),
          unit: editItem.unit,
          categoryId: editItem.category?.id || "",
          brandId: editItem.brand?.id || "",
        } : undefined}
        fields={[
          { name: "name", label: "Product Name", required: true },
          { name: "sellingPrice", label: "Selling Price", type: "number" },
          { name: "purchasePrice", label: "Purchase Price", type: "number" },
          { name: "vatRate", label: "VAT Rate (%)", type: "number" },
          { name: "unit", label: "Unit (e.g. pcs, kg)" },
          { name: "categoryId", label: "Category", type: "select",
            options: (categories || []).map((c) => ({ value: c.id, label: c.name }))
          },
          { name: "brandId", label: "Brand", type: "select",
            options: (brands || []).map((b) => ({ value: b.id, label: b.name }))
          },
          { name: "initialStock", label: "Initial Stock", type: "number" },
        ]}
      />
    </div>
  );
}
