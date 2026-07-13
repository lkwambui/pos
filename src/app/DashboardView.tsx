import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import {
  ShoppingCart, TrendingUp, BarChart2, Percent, Shield, Clock,
  Boxes, AlertCircle, Star, Calendar, Download, ChevronDown,
  Receipt, User, Package,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
} from "recharts";

interface DashboardSummary {
  salesCount: number;
  revenue: number;
  expenses: number;
  lowStockCount: number;
}

interface SalesChartData {
  date: string;
  total: number;
}

interface TopProduct {
  product: { id: string; name: string; sku: string; sellingPrice: number } | null;
  totalQuantity: number;
}

interface RecentSale {
  id: string;
  saleNumber: string;
  total: number;
  taxAmount: number;
  createdAt: string;
  customer: { id: string; name: string } | null;
  user: { id: string; firstName: string; lastName: string };
}

const fmt = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const fmtShort = (n: number) => {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `KES ${(n / 1000).toFixed(0)}K`;
  return `KES ${n}`;
};

function MetricCard({
  label, value, sub, trend, trendUp, icon: Icon, accent, small,
}: {
  label: string; value: string; sub?: string; trend?: string;
  trendUp?: boolean; icon: any; accent: string; small?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={16} className="text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendUp ? "#059669" : "#EF4444" }}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div className={`font-bold text-foreground ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5 opacity-70">{sub}</div>}
    </div>
  );
}

const TrendingDown = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
);

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    FAILED: "bg-red-50 text-red-700 border border-red-200",
  };
  const labels: Record<string, string> = { SUCCESS: "Synced", PENDING: "Pending", FAILED: "Failed" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "SUCCESS" ? "bg-emerald-500" : status === "FAILED" ? "bg-red-500" : "bg-amber-500"}`} />
      {labels[status] || status}
    </span>
  );
}

export function DashboardView() {
  const { data: summary } = useApi(() => api.get<DashboardSummary>("/dashboard/summary"));
  const { data: salesChart } = useApi(() => api.get<SalesChartData[]>("/dashboard/sales-chart"));
  const { data: topProducts } = useApi(() => api.get<TopProduct[]>("/dashboard/top-products"));
  const { data: recentSales } = useApi(() => api.get<RecentSale[]>("/dashboard/recent-sales"));

  const s = summary || { salesCount: 0, revenue: 0, expenses: 0, lowStockCount: 0 };
  const chartData = (salesChart || []).map(d => ({
    date: new Date(d.date).toLocaleDateString("en-KE", { weekday: "short" }),
    total: d.total,
  }));
  const topItems = (topProducts || []).slice(0, 5);
  const recent = (recentSales || []).slice(0, 10);

  const totalTax = recent.reduce((sum, s) => sum + Number(s.taxAmount), 0);
  const etimsSuccess = recent.filter(s => s.saleNumber).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground bg-card border border-border hover:bg-muted transition-colors">
            <Calendar size={14} /> Today <ChevronDown size={13} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground bg-card border border-border hover:bg-muted transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Today's Sales" value={fmtShort(s.revenue)} trend="Live" trendUp icon={ShoppingCart} accent="bg-blue-600" />
        <MetricCard label="Today's Transactions" value={String(s.salesCount)} icon={BarChart2} accent="bg-violet-600" />
        <MetricCard label="Expenses" value={fmtShort(s.expenses)} icon={TrendingUp} accent="bg-emerald-600" />
        <MetricCard label="Tax Collected" value={fmtShort(totalTax)} sub="16% VAT" icon={Percent} accent="bg-amber-500" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="eTIMS Synced" value={recent.length > 0 ? `${Math.round((etimsSuccess / recent.length) * 100)}%` : "100%"} sub="Last sync recently" icon={Shield} accent="bg-emerald-600" small />
        <MetricCard label="Pending Sync" value={String(recent.length - etimsSuccess)} icon={Clock} accent="bg-amber-500" small />
        <MetricCard label="Net Revenue" value={fmtShort(s.revenue - s.expenses)} icon={Boxes} accent="bg-slate-600" small />
        <MetricCard label="Low Stock Items" value={String(s.lowStockCount)} sub="Need reorder" icon={AlertCircle} accent="bg-red-500" small />
      </div>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Sales Trend</h3>
                <p className="text-xs text-muted-foreground">Daily revenue</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [fmt(v), ""]} />
                <Area type="monotone" dataKey="total" stroke="#1D4ED8" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground text-sm">Quick Stats</h3>
              <p className="text-xs text-muted-foreground">Today's overview</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-muted-foreground flex-1">Sales</span>
                <span className="font-semibold text-foreground">{s.salesCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground flex-1">Revenue</span>
                <span className="font-semibold text-foreground">{fmtShort(s.revenue)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-muted-foreground flex-1">Expenses</span>
                <span className="font-semibold text-foreground">{fmtShort(s.expenses)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground flex-1">Low Stock</span>
                <span className="font-semibold text-foreground">{s.lowStockCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No transactions yet today</div>
            )}
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Receipt size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {tx.customer?.name || "Walk-in Customer"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.saleNumber} · {new Date(tx.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{fmt(Number(tx.total))}</div>
                  <div className="text-xs text-muted-foreground">{tx.user.firstName}</div>
                </div>
                <StatusBadge status="SUCCESS" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Best Sellers</h3>
            <Star size={14} className="text-amber-400" />
          </div>
          <div className="divide-y divide-border">
            {topItems.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No sales data yet</div>
            )}
            {topItems.map((item, i) => (
              <div key={item.product?.id || i} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{item.product?.name || "Unknown"}</div>
                  <div className="text-[10px] text-muted-foreground">{item.totalQuantity} sold</div>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {item.product ? fmt(Number(item.product.sellingPrice)) : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
