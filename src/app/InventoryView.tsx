import { useState } from "react";
import { Search, Package, Plus } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

const fmt = (n: number | string) => `KES ${Number(n).toLocaleString("en-KE")}`;

interface InventoryItem {
  id: string;
  quantity: number;
  minStock: number;
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    purchasePrice: number;
  };
}

export function InventoryView() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<InventoryItem[]>(
    () => api.get(`/inventory?page=1&limit=200${lowStockOnly ? "&lowStock=true" : ""}`),
    [lowStockOnly]
  );

  const items = data || [];
  const filtered = items.filter((i) =>
    i.product.name.toLowerCase().includes(search.toLowerCase()) ||
    i.product.sku.toLowerCase().includes(search.toLowerCase())
  );
  const lowStockCount = items.filter((i) => i.quantity <= i.minStock).length;

  const handleAdjust = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      await api.post("/inventory/adjust", form);
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
          <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} products tracked · {lowStockCount} low stock
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Adjust Stock
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 max-w-xs relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search inventory…"
          />
        </div>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs text-muted-foreground cursor-pointer hover:bg-muted transition-colors">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={() => setLowStockOnly(!lowStockOnly)}
            className="rounded border-border"
          />
          Low stock only
        </label>
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
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Sell Price</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No inventory items found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-slate-400" />
                        </div>
                        <div className="text-sm font-medium text-foreground">{item.product.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.product.sku}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">{fmt(item.product.sellingPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      {item.quantity <= 0 ? (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium border border-red-200">Out of Stock</span>
                      ) : item.quantity <= item.minStock ? (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium border border-amber-200">Low Stock</span>
                      ) : (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">In Stock</span>
                      )}
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
        onSave={handleAdjust}
        title="Adjust Stock"
        saving={saving}
        fields={[
          { name: "productId", label: "Product ID", required: true },
          { name: "type", label: "Adjustment Type", type: "select", required: true,
            options: [
              { value: "STOCK_IN", label: "Stock In" },
              { value: "STOCK_OUT", label: "Stock Out" },
              { value: "ADJUSTMENT", label: "Adjustment" },
            ]
          },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "reason", label: "Reason", type: "textarea" },
        ]}
      />
    </div>
  );
}
