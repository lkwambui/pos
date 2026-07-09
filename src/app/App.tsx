import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../components/LoginPage";
import { InventoryView } from "./InventoryView";
import { SuppliersView } from "./SuppliersView";
import { PurchasesView } from "./PurchasesView";
import { ReturnsView } from "./ReturnsView";
import { InvoicesView } from "./InvoicesView";
import { QuotationsView } from "./QuotationsView";
import { PaymentsView } from "./PaymentsView";
import { ExpensesView } from "./ExpensesView";
import { UsersView } from "./UsersView";
import { ProductsView } from "./ProductsView";
import { CustomersView } from "./CustomersView";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, FileText,
  RotateCcw, CreditCard, Banknote, BarChart3, Settings, Shield,
  Bell, Search, ChevronDown, Plus, Minus, Trash2, Scan, Star,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock,
  RefreshCw, Download, Upload, Eye, X, Menu, Zap, Store,
  ArrowUpRight, ArrowDownRight, Filter, Calendar, MoreHorizontal,
  Printer, Mail, MessageSquare, FileDown, Wifi, WifiOff,
  Tag, Hash, Layers, PieChart, DollarSign, Receipt, UserCheck,
  ShoppingBag, Boxes, BarChart2, Send, Circle, ChevronRight,
  LogOut, User, Building2, Phone, MapPin, Globe, Lock,
  ToggleLeft, Percent, QrCode, Info,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RPieChart,
  Pie, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewId =
  | "dashboard" | "new-sale" | "products" | "inventory" | "customers"
  | "suppliers" | "purchases" | "returns" | "invoices" | "quotations"
  | "payments" | "expenses" | "reports" | "etims" | "users" | "settings";

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  qty: number;
  vatRate: number;
  discount: number;
  category: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const salesTrendData = [
  { day: "Mon", sales: 142000, revenue: 168000 },
  { day: "Tue", sales: 189000, revenue: 221000 },
  { day: "Wed", sales: 163000, revenue: 194000 },
  { day: "Thu", sales: 221000, revenue: 265000 },
  { day: "Fri", sales: 287000, revenue: 342000 },
  { day: "Sat", sales: 334000, revenue: 401000 },
  { day: "Sun", sales: 198000, revenue: 237000 },
];

const monthlyData = [
  { month: "Jan", revenue: 2840000, expenses: 1920000 },
  { month: "Feb", revenue: 3120000, expenses: 2100000 },
  { month: "Mar", revenue: 2780000, expenses: 1880000 },
  { month: "Apr", revenue: 3450000, expenses: 2340000 },
  { month: "May", revenue: 3890000, expenses: 2560000 },
  { month: "Jun", revenue: 4210000, expenses: 2780000 },
];

const paymentMixData = [
  { name: "M-Pesa", value: 54, color: "#10B981" },
  { name: "Cash", value: 28, color: "#1D4ED8" },
  { name: "Card", value: 13, color: "#8B5CF6" },
  { name: "Credit", value: 5, color: "#F59E0B" },
];

const recentTransactions = [
  { id: "INV-2024-08741", customer: "Wanjiku Enterprises", amount: 45600, vat: 5935, method: "M-Pesa", status: "completed", time: "2 min ago", etims: "success" },
  { id: "INV-2024-08740", customer: "John Kamau", amount: 12300, vat: 1600, method: "Cash", status: "completed", time: "8 min ago", etims: "success" },
  { id: "INV-2024-08739", customer: "Nairobi Hardware Ltd", amount: 189500, vat: 24670, method: "Card", status: "completed", time: "15 min ago", etims: "pending" },
  { id: "INV-2024-08738", customer: "Grace Muthoni", amount: 8750, vat: 1139, method: "M-Pesa", status: "completed", time: "23 min ago", etims: "success" },
  { id: "INV-2024-08737", customer: "Otieno & Sons", amount: 67200, vat: 8748, method: "Credit", status: "pending", time: "31 min ago", etims: "failed" },
];

const etimsInvoices = [
  { id: "KRA-2024-441892", invoice: "INV-2024-08741", customer: "Wanjiku Enterprises", amount: 45600, vat: 5935, status: "success", time: "09:14 AM" },
  { id: "KRA-2024-441891", invoice: "INV-2024-08740", customer: "John Kamau", amount: 12300, vat: 1600, status: "success", time: "09:08 AM" },
  { id: "KRA-2024-441890", invoice: "INV-2024-08739", customer: "Nairobi Hardware Ltd", amount: 189500, vat: 24670, status: "pending", time: "09:01 AM" },
  { id: "KRA-2024-441889", invoice: "INV-2024-08737", customer: "Otieno & Sons", amount: 67200, vat: 8748, status: "failed", time: "08:45 AM" },
  { id: "KRA-2024-441888", invoice: "INV-2024-08736", customer: "Amina Traders", amount: 33400, vat: 4348, status: "success", time: "08:32 AM" },
  { id: "KRA-2024-441887", invoice: "INV-2024-08735", customer: "Kipchoge Suppliers", amount: 78900, vat: 10270, status: "processing", time: "08:19 AM" },
];

const products = [
  { id: 1, name: "Equity Bank Maize Flour 2kg", sku: "MF-EQ-2KG", price: 285, category: "Groceries", stock: 142, vatRate: 16, barcode: "6001234567890", brand: "Jogoo" },
  { id: 2, name: "Brookside Fresh Milk 500ml", sku: "BRK-FM-500", price: 75, category: "Dairy", stock: 88, vatRate: 0, barcode: "6009876543210", brand: "Brookside" },
  { id: 3, name: "Safaricom Airtime KES 100", sku: "SAF-AIR-100", price: 100, category: "Airtime", stock: 999, vatRate: 16, barcode: "6007654321098", brand: "Safaricom" },
  { id: 4, name: "Omo Washing Powder 1kg", sku: "OMO-WP-1KG", price: 420, category: "Household", stock: 67, vatRate: 16, barcode: "6002345678901", brand: "Unilever" },
  { id: 5, name: "Sensodyne Toothpaste 100g", sku: "SEN-TP-100", price: 380, category: "Personal Care", stock: 23, vatRate: 16, barcode: "6003456789012", brand: "GSK" },
  { id: 6, name: "Ketepa Pride Tea Bags 50s", sku: "KET-TB-050", price: 195, category: "Beverages", stock: 115, vatRate: 16, barcode: "6004567890123", brand: "Ketepa" },
  { id: 7, name: "Indomie Noodles Chicken 70g", sku: "IND-NC-070", price: 35, category: "Groceries", stock: 340, vatRate: 16, barcode: "6005678901234", brand: "Indomie" },
  { id: 8, name: "Dettol Antibacterial Soap", sku: "DET-AS-125", price: 165, category: "Personal Care", stock: 78, vatRate: 16, barcode: "6006789012345", brand: "RB" },
  { id: 9, name: "Tusker Malt Lager 500ml", sku: "TUS-ML-500", price: 250, category: "Beverages", stock: 0, vatRate: 16, barcode: "6007890123456", brand: "EABL" },
  { id: 10, name: "Cadbury Dairy Milk 90g", sku: "CAD-DM-090", price: 195, category: "Confectionery", stock: 56, vatRate: 16, barcode: "6008901234567", brand: "Cadbury" },
  { id: 11, name: "Pishori Rice 2kg", sku: "PSH-RI-2KG", price: 650, category: "Groceries", stock: 92, vatRate: 0, barcode: "6009012345678", brand: "Generic" },
  { id: 12, name: "Ariel Liquid Detergent 1L", sku: "ARI-LD-1LT", price: 510, category: "Household", stock: 44, vatRate: 16, barcode: "6000123456789", brand: "P&G" },
];

const productCategories = ["All", "Groceries", "Dairy", "Beverages", "Household", "Personal Care", "Airtime", "Confectionery"];

const customers = [
  { id: 1, name: "Wanjiku Enterprises", phone: "+254 712 345 678", email: "wanjiku@enterprises.co.ke", kraPin: "A001234567B", credit: 45000, loyalty: 2340, purchases: 89, totalSpent: 1240000 },
  { id: 2, name: "John Kamau", phone: "+254 722 987 654", email: "jkamau@gmail.com", kraPin: "A009876543C", credit: 0, loyalty: 890, purchases: 34, totalSpent: 187600 },
  { id: 3, name: "Nairobi Hardware Ltd", phone: "+254 733 456 789", email: "info@nairobihard.co.ke", kraPin: "P002345678D", credit: 250000, loyalty: 12400, purchases: 156, totalSpent: 4890000 },
  { id: 4, name: "Grace Muthoni", phone: "+254 741 234 567", email: "grace.m@yahoo.com", kraPin: "A003456789E", credit: 0, loyalty: 450, purchases: 22, totalSpent: 89400 },
  { id: 5, name: "Otieno & Sons Suppliers", phone: "+254 756 789 012", email: "otieno@sons.co.ke", kraPin: "P004567890F", credit: 120000, loyalty: 5670, purchases: 78, totalSpent: 2340000 },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const fmtShort = (n: number) => {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `KES ${(n / 1000).toFixed(0)}K`;
  return `KES ${n}`;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    processing: "bg-blue-50 text-blue-700 border border-blue-200",
    failed: "bg-red-50 text-red-700 border border-red-200",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  const labels: Record<string, string> = {
    success: "Synced", pending: "Pending", processing: "Processing",
    failed: "Failed", completed: "Paid",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "success" || status === "completed" ? "bg-emerald-500" : status === "failed" ? "bg-red-500" : status === "processing" ? "bg-blue-500" : "bg-amber-500"}`} />
      {labels[status] || status}
    </span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "Operations",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { id: "new-sale", icon: ShoppingCart, label: "New Sale", badge: "POS" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { id: "products", icon: Package, label: "Products" },
      { id: "inventory", icon: Boxes, label: "Inventory" },
      { id: "suppliers", icon: Truck, label: "Suppliers" },
      { id: "purchases", icon: ShoppingBag, label: "Purchases" },
    ],
  },
  {
    label: "Sales",
    items: [
      { id: "customers", icon: Users, label: "Customers" },
      { id: "invoices", icon: FileText, label: "Invoices" },
      { id: "quotations", icon: Receipt, label: "Quotations" },
      { id: "returns", icon: RotateCcw, label: "Returns" },
      { id: "payments", icon: CreditCard, label: "Payments" },
      { id: "expenses", icon: Banknote, label: "Expenses" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { id: "reports", icon: BarChart3, label: "Reports" },
      { id: "etims", icon: Shield, label: "eTIMS", badge: "KRA", indicator: "green" },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users", icon: UserCheck, label: "Users & Roles" },
      { id: "settings", icon: Settings, label: "Settings" },
    ],
  },
];

function Sidebar({ active, setActive, user, onLogout }: { active: ViewId; setActive: (v: ViewId) => void; user: any; onLogout: () => void }) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: "var(--sidebar)" }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">SwiftPOS</div>
          <div className="text-xs" style={{ color: "var(--sidebar-foreground)" }}>Kenya Edition</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id as ViewId)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/7"
                    }`}
                    style={isActive ? {} : { "&:hover": { background: "var(--sidebar-accent)" } }}
                  >
                    <item.icon size={15} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.id === "etims" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.indicator && !item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--sidebar-border)" }}>
        {/* eTIMS sync status */}
        <div className="mx-1 mb-2 flex items-center gap-2 px-2 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">eTIMS Connected</span>
          <RefreshCw size={11} className="text-emerald-400 ml-auto" />
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-xs font-medium leading-none">{user?.name || "User"}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">{user?.role || "User"}</div>
          </div>
          <LogOut size={13} className="text-slate-600" />
        </button>
      </div>
    </aside>
  );
}

// ─── Top Navigation ───────────────────────────────────────────────────────────

function TopNav({ setActive, user }: { setActive: (v: ViewId) => void; user: any }) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center gap-4 px-6 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full pl-8 pr-4 py-1.5 bg-muted rounded-lg text-sm text-foreground placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search products, customers, invoices… (⌘K)"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Outlet */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors border border-border">
          <Store size={13} />
          <span>Westlands Branch</span>
          <ChevronDown size={12} />
        </button>

        {/* Register */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <Circle size={8} className="fill-emerald-500 text-emerald-500" />
          <span>Register Open</span>
        </button>

        {/* Quick Sale */}
        <button
          onClick={() => setActive("new-sale")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} />
          New Sale
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <Bell size={15} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          {user?.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

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
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
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

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tuesday, July 1, 2025 · Westlands Branch</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground bg-card border border-border hover:bg-muted transition-colors">
            <Calendar size={14} />
            Today
            <ChevronDown size={13} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground bg-card border border-border hover:bg-muted transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Today's Sales" value={fmtShort(334200)} trend="+18.4%" trendUp icon={ShoppingCart} accent="bg-blue-600" />
        <MetricCard label="Weekly Revenue" value={fmtShort(1534000)} trend="+12.1%" trendUp icon={TrendingUp} accent="bg-violet-600" />
        <MetricCard label="Monthly Revenue" value={fmtShort(4210000)} trend="+8.6%" trendUp icon={BarChart2} accent="bg-emerald-600" />
        <MetricCard label="Tax Collected" value={fmtShort(548300)} sub="16% VAT" trend="+8.6%" trendUp icon={Percent} accent="bg-amber-500" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="eTIMS Synced" value="98.2%" sub="Last sync 4 min ago" icon={Shield} accent="bg-emerald-600" small />
        <MetricCard label="Pending eTIMS" value="3" sub="Queued for upload" trend="-2" trendUp icon={Clock} accent="bg-amber-500" small />
        <MetricCard label="Inventory Value" value={fmtShort(8720000)} icon={Boxes} accent="bg-slate-600" small />
        <MetricCard label="Low Stock Items" value="14" sub="Need reorder" icon={AlertCircle} accent="bg-red-500" small />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Sales Trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" />Sales</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Revenue</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salesTrendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }}
                formatter={(v: number) => [fmt(v), ""]}
              />
              <Area type="monotone" dataKey="sales" stroke="#1D4ED8" strokeWidth={2} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Mix */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground text-sm">Payment Mix</h3>
            <p className="text-xs text-muted-foreground">Today's transactions</p>
          </div>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={140} height={140}>
              <RPieChart>
                <Pie data={paymentMixData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value" stroke="none">
                  {paymentMixData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {paymentMixData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
                <span className="text-xs font-semibold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Monthly Revenue vs Expenses</h3>
            <p className="text-xs text-muted-foreground">Jan – Jun 2025</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" />Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Expenses</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} barGap={4} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }}
              formatter={(v: number) => [fmt(v), ""]}
            />
            <Bar dataKey="revenue" fill="#1D4ED8" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expenses" fill="#FCA5A5" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Transactions */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Recent Transactions</h3>
            <button className="text-xs text-primary font-medium hover:underline">View all</button>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Receipt size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{tx.customer}</div>
                  <div className="text-xs text-muted-foreground">{tx.id} · {tx.time}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{fmt(tx.amount)}</div>
                  <div className="text-xs text-muted-foreground">{tx.method}</div>
                </div>
                <StatusBadge status={tx.etims} />
              </div>
            ))}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Best Sellers</h3>
            <Star size={14} className="text-amber-400" />
          </div>
          <div className="divide-y divide-border">
            {products.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.category}</div>
                </div>
                <div className="text-xs font-semibold text-foreground">{fmt(p.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Sale (POS) View ──────────────────────────────────────────────────────

function NewSaleView() {
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: "Equity Bank Maize Flour 2kg", sku: "MF-EQ-2KG", price: 285, qty: 2, vatRate: 16, discount: 0, category: "Groceries" },
    { id: 6, name: "Ketepa Pride Tea Bags 50s", sku: "KET-TB-050", price: 195, qty: 1, vatRate: 16, discount: 0, category: "Beverages" },
    { id: 2, name: "Brookside Fresh Milk 500ml", sku: "BRK-FM-500", price: 75, qty: 3, vatRate: 0, discount: 5, category: "Dairy" },
  ]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, sku: product.sku, price: product.price, qty: 1, vatRate: product.vatRate, discount: 0, category: product.category }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty * (1 - i.discount / 100), 0);
  const vat = cart.reduce((acc, i) => {
    const lineTotal = i.price * i.qty * (1 - i.discount / 100);
    return acc + (lineTotal * i.vatRate) / (100 + i.vatRate);
  }, 0);
  const totalDiscount = cart.reduce((acc, i) => acc + i.price * i.qty * (i.discount / 100), 0);
  const total = subtotal;
  const balance = amountPaid ? parseFloat(amountPaid.replace(/,/g, "")) - total : 0;

  const completeAndShowReceipt = () => {
    if (cart.length > 0) setShowReceipt(true);
  };

  if (showReceipt) {
    return <ReceiptView cart={cart} total={total} vat={vat} paymentMode={paymentMode || "Cash"} onClose={() => { setShowReceipt(false); setCart([]); setAmountPaid(""); setPaymentMode(null); }} />;
  }

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col border-r border-border bg-background overflow-hidden">
        {/* Search + Scanner */}
        <div className="p-4 bg-card border-b border-border space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted rounded-lg text-sm placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search product or scan barcode…"
              />
            </div>
            <button className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Scan size={16} className="text-muted-foreground" />
            </button>
          </div>
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {productCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
                className={`bg-card rounded-xl p-3 border border-border text-left transition-all hover:shadow-md hover:border-primary/30 group ${
                  p.stock === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-2.5 group-hover:from-blue-50 group-hover:to-blue-50/50 transition-colors">
                  <Package size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 mb-1">{p.name}</div>
                <div className="text-[10px] text-muted-foreground mb-1.5">{p.sku}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{fmt(p.price)}</span>
                  {p.stock === 0 ? (
                    <span className="text-[9px] text-red-500 font-medium">Out of stock</span>
                  ) : (
                    <span className="text-[9px] text-emerald-600 font-medium">{p.stock} left</span>
                  )}
                </div>
                {p.vatRate > 0 && (
                  <div className="mt-1">
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">VAT {p.vatRate}%</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-80 xl:w-96 flex flex-col bg-card">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Cart</span>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {cart.reduce((a, i) => a + i.qty, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded transition-colors">Hold</button>
            <button className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded transition-colors" onClick={() => setCart([])}>Clear</button>
          </div>
        </div>

        {/* Cart Customer */}
        <div className="px-4 py-2 border-b border-border">
          <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground hover:bg-slate-100 transition-colors">
            <User size={13} />
            <span className="text-xs">Walk-in Customer</span>
            <ChevronDown size={12} className="ml-auto" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ShoppingCart size={32} className="text-slate-200 mb-3" />
              <p className="text-sm text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Click a product to add it</p>
            </div>
          ) : (
            cart.map((item) => {
              const lineTotal = item.price * item.qty * (1 - item.discount / 100);
              return (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package size={12} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground leading-tight truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.sku}</div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-foreground">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors">
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.vatRate > 0 && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">VAT</span>
                      )}
                      <span className="text-xs font-bold text-foreground">{fmt(lineTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-border px-4 py-3 space-y-1.5 bg-muted/30">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal (excl. VAT)</span>
            <span>{fmt(subtotal - vat)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount</span>
              <span>-{fmt(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VAT (16%)</span>
            <span>{fmt(vat)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{fmt(total)}</span>
          </div>
        </div>

        {/* Amount Paid Input */}
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">KES</span>
              <input
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-muted rounded-lg text-sm font-semibold placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
              />
            </div>
            {balance > 0 && (
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Change</div>
                <div className="text-xs font-bold text-emerald-600">{fmt(balance)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
              { id: "mpesa", label: "M-Pesa", icon: Phone, color: "bg-green-600 hover:bg-green-700 text-white" },
              { id: "card", label: "Card", icon: CreditCard, color: "bg-violet-600 hover:bg-violet-700 text-white" },
              { id: "split", label: "Split", icon: Layers, color: "bg-amber-500 hover:bg-amber-600 text-white" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setPaymentMode(btn.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${btn.color} ${paymentMode === btn.id ? "ring-2 ring-offset-1 ring-current scale-[0.98]" : ""}`}
              >
                <btn.icon size={13} />
                {btn.label}
              </button>
            ))}
          </div>
          <button
            onClick={completeAndShowReceipt}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Complete Sale · {fmt(total)}
          </button>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:bg-slate-200 transition-colors">Credit Sale</button>
            <button className="flex-1 py-2 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:bg-slate-200 transition-colors">Suspend</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt View ─────────────────────────────────────────────────────────────

function ReceiptView({ cart, total, vat, paymentMode, onClose }: {
  cart: CartItem[]; total: number; vat: number; paymentMode: string; onClose: () => void;
}) {
  const invoiceNum = "INV-2025-08742";
  const kraNum = "KRA-2025-441893";

  return (
    <div className="flex h-full items-center justify-center bg-muted p-8">
      <div className="max-w-sm w-full">
        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground">Receipt</h2>
          <div className="flex gap-2">
            {[
              { icon: Printer, label: "Print" },
              { icon: Mail, label: "Email" },
              { icon: MessageSquare, label: "WhatsApp" },
              { icon: FileDown, label: "PDF" },
            ].map((a) => (
              <button key={a.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-muted-foreground">
                <a.icon size={12} />
                {a.label}
              </button>
            ))}
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-blue-700 transition-colors">
              New Sale
            </button>
          </div>
        </div>

        {/* Receipt Paper */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-2">
              <Zap size={18} className="text-white" />
            </div>
            <div className="font-bold text-base text-slate-900">SwiftPOS Store</div>
            <div className="text-xs text-slate-500">Westlands, Nairobi · Tel: +254 700 123 456</div>
            <div className="text-xs text-slate-500">KRA PIN: P051234567A</div>
            <div className="text-[10px] text-slate-400 mt-1">VAT REG: 0123456789</div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          {/* Invoice Info */}
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-semibold text-slate-900">{invoiceNum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">eTIMS Ref:</span>
              <span className="font-semibold text-emerald-600">{kraNum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="text-slate-700">01/07/2025 09:22 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span className="text-slate-700">James Mwangi</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          {/* Items */}
          <div className="space-y-2 mb-3">
            {cart.map((item) => {
              const lineTotal = item.price * item.qty * (1 - item.discount / 100);
              return (
                <div key={item.id}>
                  <div className="text-[11px] text-slate-700 font-medium leading-tight">{item.name}</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">{item.qty} × KES {item.price}{item.vatRate > 0 ? " *" : ""}</span>
                    <span className="font-semibold text-slate-900">KES {lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (excl. VAT)</span>
              <span>KES {(total - vat).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT 16%</span>
              <span>KES {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 mt-1 pt-1 border-t border-slate-200">
              <span>TOTAL</span>
              <span>KES {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Payment ({paymentMode.toUpperCase()})</span>
              <span>KES {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          {/* QR Code placeholder */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
              <QrCode size={40} className="text-slate-400" />
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 space-y-0.5">
            <div>* VAT-able items</div>
            <div className="font-semibold text-slate-600">Thank you for shopping with us!</div>
            <div>Verify this receipt at itax.kra.go.ke</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── eTIMS View ───────────────────────────────────────────────────────────────

function ETimsView() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "settings">("overview");

  const statusCards = [
    { label: "Connection", value: "Connected", icon: Wifi, color: "bg-emerald-50 border-emerald-200 text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
    { label: "Pending Upload", value: "3", icon: Clock, color: "bg-amber-50 border-amber-200 text-amber-700", badge: "bg-amber-100 text-amber-700" },
    { label: "Failed Uploads", value: "1", icon: AlertCircle, color: "bg-red-50 border-red-200 text-red-700", badge: "bg-red-100 text-red-700" },
    { label: "Successful Today", value: "127", icon: CheckCircle2, color: "bg-blue-50 border-blue-200 text-blue-700", badge: "bg-blue-100 text-blue-700" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">eTIMS Compliance</h1>
            <p className="text-sm text-muted-foreground">Kenya Revenue Authority · Real-time Tax Invoice Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw size={14} /> Sync Now
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live · Last sync 4 min ago
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(["overview", "invoices", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "overview" ? "Overview" : tab === "invoices" ? "Invoice Log" : "Settings"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Submission Stats */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Submission Rate — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesTrendData.map((d, i) => ({ ...d, success: 95 + i, failed: i < 3 ? 1 : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="success" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} name="Success" />
                <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={24} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Device Info */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-4">Device & Connection Info</h3>
            {[
              { label: "Device Serial", value: "KRA-SDC-WL-00142", icon: Hash },
              { label: "Branch Code", value: "NBI-WL-001", icon: Building2 },
              { label: "Certificate Status", value: "Valid · Expires Dec 2025", icon: Shield },
              { label: "API Environment", value: "Production", icon: Globe },
              { label: "Sync Interval", value: "Every 5 minutes", icon: Clock },
              { label: "Business PIN", value: "P051234567A", icon: Lock },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <row.icon size={13} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{row.label}</span>
                <span className="text-xs font-medium text-foreground font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">eTIMS Invoice Log</span>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted rounded-lg text-muted-foreground hover:bg-slate-200 transition-colors">
                <Filter size={12} /> Filter
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted rounded-lg text-muted-foreground hover:bg-slate-200 transition-colors">
                <Download size={12} /> Export
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["eTIMS Ref", "Invoice No.", "Customer", "Amount", "VAT", "Status", "Submitted", "Actions"].map((h) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground ${h === "Amount" || h === "VAT" ? "text-right" : h === "Status" || h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {etimsInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-3 text-xs font-mono text-emerald-600 font-medium">{inv.id}</td>
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{inv.invoice}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{inv.customer}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-foreground">{fmt(inv.amount)}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{fmt(inv.vat)}</td>
                  <td className="px-5 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{inv.time}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {inv.status === "failed" && (
                        <button className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Retry</button>
                      )}
                      <button className="px-2 py-1 text-[10px] font-medium bg-muted text-muted-foreground rounded hover:bg-slate-200 transition-colors">
                        <Eye size={11} />
                      </button>
                      <button className="px-2 py-1 text-[10px] font-medium bg-muted text-muted-foreground rounded hover:bg-slate-200 transition-colors">
                        <Download size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">KRA Integration Settings</h3>
            {[
              { label: "Device Serial Number", value: "KRA-SDC-WL-00142", type: "text" },
              { label: "Branch Code", value: "NBI-WL-001", type: "text" },
              { label: "KRA PIN", value: "P051234567A", type: "text" },
              { label: "API Base URL", value: "https://etims-api.kra.go.ke", type: "text" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                <input
                  defaultValue={f.value}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm font-mono border-0 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <button className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <Save size={14} /> Save & Test Connection
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Sync Configuration</h3>
            {[
              { label: "Auto Sync", sub: "Automatically submit invoices to KRA", enabled: true },
              { label: "Offline Queue", sub: "Queue invoices when offline and sync later", enabled: true },
              { label: "Retry Failed", sub: "Auto-retry failed submissions", enabled: true },
              { label: "Email Alerts", sub: "Notify on submission failures", enabled: false },
            ].map((toggle) => (
              <div key={toggle.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="text-sm font-medium text-foreground">{toggle.label}</div>
                  <div className="text-xs text-muted-foreground">{toggle.sub}</div>
                </div>
                <div className={`w-10 h-5 rounded-full flex items-center transition-colors ${toggle.enabled ? "bg-emerald-500" : "bg-slate-300"} cursor-pointer`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${toggle.enabled ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────

function ReportsView() {
  const [activeReport, setActiveReport] = useState("sales");

  const reportTypes = [
    { id: "sales", label: "Sales Report", icon: ShoppingCart },
    { id: "vat", label: "VAT Report", icon: Percent },
    { id: "pl", label: "Profit & Loss", icon: TrendingUp },
    { id: "inventory", label: "Inventory Report", icon: Boxes },
    { id: "customers", label: "Customer Analytics", icon: Users },
    { id: "etims", label: "eTIMS Submissions", icon: Shield },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Business intelligence and tax compliance reporting</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-muted-foreground hover:bg-muted transition-colors">
            <Calendar size={14} /> Jul 1 – Jul 31, 2025
            <ChevronDown size={13} />
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
        {/* Report Type Selector */}
        <div className="bg-card rounded-xl border border-border p-3 space-y-1">
          {reportTypes.map((r) => (
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

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Revenue", value: fmtShort(4210000), trend: "+8.6%", up: true },
              { label: "Total Transactions", value: "1,284", trend: "+5.2%", up: true },
              { label: "Avg Transaction", value: fmt(3278), trend: "+3.2%", up: true },
            ].map((k) => (
              <div key={k.label} className="bg-card rounded-xl p-4 border border-border">
                <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
                <div className="text-xl font-bold text-foreground">{k.value}</div>
                <div className={`text-xs mt-1 flex items-center gap-1 ${k.up ? "text-emerald-600" : "text-red-500"}`}>
                  {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {k.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">
              {reportTypes.find((r) => r.id === activeReport)?.label} — Monthly Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [fmt(v), ""]} />
                <Area type="monotone" dataKey="revenue" stroke="#1D4ED8" strokeWidth={2.5} fill="url(#rGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* VAT Summary Table for VAT report */}
          {activeReport === "vat" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border font-semibold text-sm text-foreground">VAT Summary by Rate</div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["VAT Rate", "Taxable Sales", "VAT Amount", "Invoices"].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-muted-foreground text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { rate: "Standard Rate (16%)", taxable: 3620000, vat: 578400, invoices: 1089 },
                    { rate: "Zero Rate (0%)", taxable: 590000, vat: 0, invoices: 195 },
                    { rate: "Exempt", taxable: 0, vat: 0, invoices: 0 },
                  ].map((row) => (
                    <tr key={row.rate} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{row.rate}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{fmt(row.taxable)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-blue-600">{fmt(row.vat)}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{row.invoices.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold">
                    <td className="px-5 py-3 text-sm text-foreground">Total</td>
                    <td className="px-5 py-3 text-sm text-foreground">{fmt(4210000)}</td>
                    <td className="px-5 py-3 text-sm text-blue-700">{fmt(578400)}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">1,284</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────

// Fake "Save" icon since it's not imported
const Save = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

function SettingsView() {
  const [activeSection, setActiveSection] = useState("business");

  const sections = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "tax", label: "Tax Settings", icon: Percent },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "receipt", label: "Receipt", icon: Receipt },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "integrations", label: "Integrations", icon: Globe },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your business configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-3 space-y-1 h-fit">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${activeSection === s.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
            >
              <s.icon size={14} />
              {s.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-card rounded-xl border border-border p-6 space-y-5">
          {activeSection === "business" && (
            <>
              <h2 className="font-semibold text-foreground">Business Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Business Name", value: "SwiftPOS Westlands" },
                  { label: "KRA PIN", value: "P051234567A" },
                  { label: "Phone", value: "+254 700 123 456" },
                  { label: "Email", value: "info@swiftpos.co.ke" },
                  { label: "Address", value: "Westlands, Nairobi" },
                  { label: "VAT Registration", value: "0123456789" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{f.label}</label>
                    <input
                      defaultValue={f.value}
                      className="w-full px-3 py-2 bg-muted rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Receipt Footer Message</label>
                <textarea
                  defaultValue="Thank you for shopping with us! For inquiries, call +254 700 123 456. All prices are VAT inclusive."
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </>
          )}

          {activeSection === "tax" && (
            <>
              <h2 className="font-semibold text-foreground">Tax Configuration</h2>
              <div className="space-y-3">
                {[
                  { name: "Standard VAT", rate: "16%", desc: "Applied to most goods and services", active: true },
                  { name: "Zero Rate", rate: "0%", desc: "Basic food items, medical supplies", active: true },
                  { name: "Exempt", rate: "N/A", desc: "Financial services, educational fees", active: true },
                  { name: "Special Excise", rate: "20%", desc: "Alcoholic beverages, tobacco", active: false },
                ].map((tax) => (
                  <div key={tax.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <div className="text-sm font-medium text-foreground">{tax.name}</div>
                      <div className="text-xs text-muted-foreground">{tax.desc}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-foreground">{tax.rate}</span>
                      <div className={`w-10 h-5 rounded-full flex items-center transition-colors ${tax.active ? "bg-emerald-500" : "bg-slate-300"} cursor-pointer`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${tax.active ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === "payments" && (
            <>
              <h2 className="font-semibold text-foreground">Payment Methods</h2>
              <div className="space-y-3">
                {[
                  { name: "Cash", icon: Banknote, color: "text-emerald-600", enabled: true, desc: "Accept cash payments at counter" },
                  { name: "M-Pesa", icon: Phone, color: "text-green-600", enabled: true, desc: "Till: 123456 · Pay Bill: 400222" },
                  { name: "Card (Visa/Mastercard)", icon: CreditCard, color: "text-blue-600", enabled: true, desc: "Via KCB POS Terminal" },
                  { name: "Bank Transfer", icon: Building2, color: "text-violet-600", enabled: false, desc: "Equity Bank · Acc: 0012345678" },
                ].map((pm) => (
                  <div key={pm.name} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                    <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${pm.color}`}>
                      <pm.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{pm.name}</div>
                      <div className="text-xs text-muted-foreground">{pm.desc}</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full flex items-center transition-colors ${pm.enabled ? "bg-emerald-500" : "bg-slate-300"} cursor-pointer`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${pm.enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(activeSection === "receipt" || activeSection === "users" || activeSection === "integrations") && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Settings size={32} className="text-slate-200 mb-3" />
              <p className="text-sm text-muted-foreground">
                {activeSection === "receipt" ? "Receipt customization" : activeSection === "users" ? "User management & role permissions" : "Third-party integrations"} coming soon
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState<ViewId>("dashboard");
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderView = () => {
    switch (active) {
      case "dashboard": return <DashboardView />;
      case "new-sale": return <NewSaleView />;
      case "products": return <ProductsView />;
      case "customers": return <CustomersView />;
      case "etims": return <ETimsView />;
      case "reports": return <ReportsView />;
      case "settings": return <SettingsView />;
      case "inventory": return <InventoryView />;
      case "suppliers": return <SuppliersView />;
      case "purchases": return <PurchasesView />;
      case "returns": return <ReturnsView />;
      case "invoices": return <InvoicesView />;
      case "quotations": return <QuotationsView />;
      case "payments": return <PaymentsView />;
      case "expenses": return <ExpensesView />;
      case "users": return <UsersView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav setActive={setActive} user={user} />
        <main className="flex-1 overflow-auto">{renderView()}</main>
      </div>
    </div>
  );
}
