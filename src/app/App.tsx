import { useState, lazy, Suspense } from "react";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../components/LoginPage";

const DashboardView = lazy(() => import("./DashboardView").then(m => ({ default: m.DashboardView })));
const NewSaleView = lazy(() => import("./NewSaleView").then(m => ({ default: m.NewSaleView })));
const ETimsView = lazy(() => import("./ETimsView").then(m => ({ default: m.ETimsView })));
const ReportsView = lazy(() => import("./ReportsView").then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import("./SettingsView").then(m => ({ default: m.SettingsView })));
const InventoryView = lazy(() => import("./InventoryView").then(m => ({ default: m.InventoryView })));
const SuppliersView = lazy(() => import("./SuppliersView").then(m => ({ default: m.SuppliersView })));
const PurchasesView = lazy(() => import("./PurchasesView").then(m => ({ default: m.PurchasesView })));
const ReturnsView = lazy(() => import("./ReturnsView").then(m => ({ default: m.ReturnsView })));
const InvoicesView = lazy(() => import("./InvoicesView").then(m => ({ default: m.InvoicesView })));
const QuotationsView = lazy(() => import("./QuotationsView").then(m => ({ default: m.QuotationsView })));
const PaymentsView = lazy(() => import("./PaymentsView").then(m => ({ default: m.PaymentsView })));
const ExpensesView = lazy(() => import("./ExpensesView").then(m => ({ default: m.ExpensesView })));
const UsersView = lazy(() => import("./UsersView").then(m => ({ default: m.UsersView })));
const ProductsView = lazy(() => import("./ProductsView").then(m => ({ default: m.ProductsView })));
const CustomersView = lazy(() => import("./CustomersView").then(m => ({ default: m.CustomersView })));
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, ShoppingBag,
  Truck, Users, FileText, RotateCcw, CreditCard, Banknote,
  BarChart3, Settings, Shield, UserCheck, Receipt,
  Bell, Search, ChevronDown, Plus, Zap, Store,
  Circle, LogOut, RefreshCw,
} from "lucide-react";

type ViewId =
  | "dashboard" | "new-sale" | "products" | "inventory" | "customers"
  | "suppliers" | "purchases" | "returns" | "invoices" | "quotations"
  | "payments" | "expenses" | "reports" | "etims" | "users" | "settings";

const navGroups = [
  {
    label: "Operations",
    items: [
      { id: "dashboard" as ViewId, icon: LayoutDashboard, label: "Dashboard" },
      { id: "new-sale" as ViewId, icon: ShoppingCart, label: "New Sale", badge: "POS" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { id: "products" as ViewId, icon: Package, label: "Products" },
      { id: "inventory" as ViewId, icon: Boxes, label: "Inventory" },
      { id: "suppliers" as ViewId, icon: Truck, label: "Suppliers" },
      { id: "purchases" as ViewId, icon: ShoppingBag, label: "Purchases" },
    ],
  },
  {
    label: "Sales",
    items: [
      { id: "customers" as ViewId, icon: Users, label: "Customers" },
      { id: "invoices" as ViewId, icon: FileText, label: "Invoices" },
      { id: "quotations" as ViewId, icon: Receipt, label: "Quotations" },
      { id: "returns" as ViewId, icon: RotateCcw, label: "Returns" },
      { id: "payments" as ViewId, icon: CreditCard, label: "Payments" },
      { id: "expenses" as ViewId, icon: Banknote, label: "Expenses" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { id: "reports" as ViewId, icon: BarChart3, label: "Reports" },
      { id: "etims" as ViewId, icon: Shield, label: "eTIMS", badge: "KRA" },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users" as ViewId, icon: UserCheck, label: "Users & Roles" },
      { id: "settings" as ViewId, icon: Settings, label: "Settings" },
    ],
  },
];

function Sidebar({ active, setActive, user, onLogout }: { active: ViewId; setActive: (v: ViewId) => void; user: any; onLogout: () => void }) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: "var(--sidebar)" }}>
      <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">SwiftPOS</div>
          <div className="text-xs" style={{ color: "var(--sidebar-foreground)" }}>Kenya Edition</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group ${
                      isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/7"
                    }`}
                  >
                    <item.icon size={15} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--sidebar-border)" }}>
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

function TopNav({ setActive, user }: { setActive: (v: ViewId) => void; user: any }) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center gap-4 px-6 flex-shrink-0">
      <div className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full pl-8 pr-4 py-1.5 bg-muted rounded-lg text-sm text-foreground placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search products, customers, invoices…"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors border border-border">
          <Store size={13} />
          <span>Westlands Branch</span>
          <ChevronDown size={12} />
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <Circle size={8} className="fill-emerald-500 text-emerald-500" />
          <span>Register Open</span>
        </button>

        <button
          onClick={() => setActive("new-sale")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} />
          New Sale
        </button>

        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <Bell size={15} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          {user?.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}

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
    const view = (() => {
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
    })();
    return <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>{view}</Suspense>;
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
