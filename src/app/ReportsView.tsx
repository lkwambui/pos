import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import {
  ShoppingCart, Percent, TrendingUp, Boxes, Users, Shield,
  Calendar, Download, FileDown, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const fmt = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const fmtShort = (n: number) => {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `KES ${(n / 1000).toFixed(0)}K`;
  return `KES ${n}`;
};

const reportTypes = [
  { id: "sales", label: "Sales Report", icon: ShoppingCart },
  { id: "vat", label: "VAT Report", icon: Percent },
  { id: "pl", label: "Profit & Loss", icon: TrendingUp },
  { id: "inventory", label: "Inventory Report", icon: Boxes },
  { id: "customers", label: "Customer Analytics", icon: Users },
  { id: "etims", label: "eTIMS Submissions", icon: Shield },
];

interface SalesReport {
  sales: number;
  totalRevenue: number;
  dailySummary: { date: string; count: number; revenue: number; tax: number; discount: number }[];
}

interface ProfitReport {
  totalRevenue: number;
  totalCOGS: number;
  totalDiscount: number;
  totalTax: number;
  grossProfit: number;
  netProfit: number;
  salesCount: number;
  profitMargin: number;
}

interface TaxReport {
  totalSales: number;
  totalVATCollected: number;
  byBranch: { branch: string; count: number; vatCollected: number }[];
}

interface InventoryReport {
  totalProducts: number;
  totalStockItems: number;
  stockValue: number;
  retailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function ReportsView() {
  const [activeReport, setActiveReport] = useState("sales");

  const { data: salesReport } = useApi(
    () => api.get<SalesReport>("/reports/sales"),
    [activeReport === "sales"],
  );
  const { data: profitReport } = useApi(
    () => api.get<ProfitReport>("/reports/profit"),
    [activeReport === "pl"],
  );
  const { data: taxReport } = useApi(
    () => api.get<TaxReport>("/reports/tax"),
    [activeReport === "vat"],
  );
  const { data: inventoryReport } = useApi(
    () => api.get<InventoryReport>("/reports/inventory"),
    [activeReport === "inventory"],
  );

  const sr = salesReport || { sales: 0, totalRevenue: 0, dailySummary: [] };
  const pr = profitReport || { totalRevenue: 0, totalCOGS: 0, totalDiscount: 0, totalTax: 0, grossProfit: 0, netProfit: 0, salesCount: 0, profitMargin: 0 };
  const tr = taxReport || { totalSales: 0, totalVATCollected: 0, byBranch: [] };
  const ir = inventoryReport || { totalProducts: 0, totalStockItems: 0, stockValue: 0, retailValue: 0, lowStockCount: 0, outOfStockCount: 0 };

  const summaryMetrics = activeReport === "sales" ? [
    { label: "Total Revenue", value: fmtShort(sr.totalRevenue) },
    { label: "Total Transactions", value: String(sr.sales) },
    { label: "Avg Transaction", value: sr.sales > 0 ? fmt(Math.round(sr.totalRevenue / sr.sales)) : fmt(0) },
  ] : activeReport === "pl" ? [
    { label: "Gross Profit", value: fmtShort(pr.grossProfit) },
    { label: "Net Profit", value: fmtShort(pr.netProfit) },
    { label: "Margin", value: `${pr.profitMargin}%` },
  ] : activeReport === "vat" ? [
    { label: "Total VAT Collected", value: fmtShort(tr.totalVATCollected) },
    { label: "Taxable Invoices", value: String(tr.totalSales) },
  ] : activeReport === "inventory" ? [
    { label: "Total Products", value: String(ir.totalProducts) },
    { label: "Stock Value", value: fmtShort(ir.stockValue) },
    { label: "Low Stock", value: String(ir.lowStockCount) },
    { label: "Out of Stock", value: String(ir.outOfStockCount) },
  ] : [
    { label: "Total Revenue", value: fmtShort(sr.totalRevenue) },
    { label: "Total Transactions", value: String(sr.sales) },
  ];

  const chartData = sr.dailySummary?.map(d => ({
    date: d.date,
    revenue: d.revenue,
  })) || [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Business intelligence and tax compliance reporting</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-colors">
            <Calendar size={14} /> Date Range <ChevronDown size={13} />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-colors">
            <Download size={14} /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-colors">
            <FileDown size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-3 space-y-1">
          {reportTypes.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeReport === r.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
            >
              <r.icon size={14} />
              {r.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {summaryMetrics.map(k => (
              <div key={k.label} className="bg-card rounded-xl p-4 border border-border">
                <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
                <div className="text-xl font-bold text-foreground">{k.value}</div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">Daily Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [fmt(v), ""]} />
                  <Area type="monotone" dataKey="revenue" stroke="#1D4ED8" strokeWidth={2.5} fill="url(#rg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeReport === "vat" && tr.byBranch.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border font-semibold text-sm text-foreground">VAT Summary by Branch</div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Branch", "Transactions", "VAT Collected"].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-muted-foreground text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tr.byBranch.map(b => (
                    <tr key={b.branch} className="hover:bg-muted/30">
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{b.branch}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{b.count}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-blue-600">{fmt(b.vatCollected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === "inventory" && ir.totalProducts > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border font-semibold text-sm text-foreground">Inventory Summary</div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Metric", "Value"].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-muted-foreground text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { label: "Total Products", value: String(ir.totalProducts) },
                    { label: "Stock Items", value: String(ir.totalStockItems) },
                    { label: "Stock Value (Cost)", value: fmt(ir.stockValue) },
                    { label: "Retail Value", value: fmt(ir.retailValue) },
                    { label: "Low Stock Items", value: String(ir.lowStockCount) },
                    { label: "Out of Stock", value: String(ir.outOfStockCount) },
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-muted/30">
                      <td className="px-5 py-3 text-sm text-muted-foreground">{row.label}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-foreground">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
