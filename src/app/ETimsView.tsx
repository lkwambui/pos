import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import {
  Shield, Wifi, Clock, AlertCircle, CheckCircle2, RefreshCw,
  Hash, Building2, Globe, Lock, Filter, Download, Eye,
  BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Bar,
} from "lucide-react";
import {
  BarChart as ReBarChart,
} from "recharts";

const fmt = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

interface EtimsOverview {
  stats: {
    totalInvoices: number;
    pendingCount: number;
    failedCount: number;
    successToday: number;
    successRate: number;
  };
  lastSync: { createdAt: string; status: string } | null;
  deviceInfo: {
    deviceSerial: string;
    branchCode: string;
    kraPin: string;
    apiBaseUrl: string;
    certificateStatus: string;
    certificateExpiry: string;
    apiEnvironment: string;
    syncInterval: string;
  };
}

interface EtimsInvoice {
  id: string;
  kraInvoiceNo: string | null;
  receiptNo: string | null;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
  retryCount: number;
}

interface EtimsInvoicesResult {
  invoices: EtimsInvoice[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    SUBMITTED: "bg-blue-50 text-blue-700 border border-blue-200",
    FAILED: "bg-red-50 text-red-700 border border-red-200",
  };
  const labels: Record<string, string> = {
    SUCCESS: "Synced", PENDING: "Pending", SUBMITTED: "Submitted", FAILED: "Failed",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "SUCCESS" ? "bg-emerald-500" : status === "FAILED" ? "bg-red-500" : status === "SUBMITTED" ? "bg-blue-500" : "bg-amber-500"}`} />
      {labels[status] || status}
    </span>
  );
}

export function ETimsView() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "settings">("overview");

  const { data: overview } = useApi(() => api.get<EtimsOverview>("/etims/overview"));
  const { data: invoicesResult, refetch: refetchInvoices } = useApi(
    () => api.get<EtimsInvoicesResult>("/etims/invoices?limit=50"),
    [activeTab === "invoices"],
  );

  const ov = overview || {
    stats: { totalInvoices: 0, pendingCount: 0, failedCount: 0, successToday: 0, successRate: 100 },
    lastSync: null,
    deviceInfo: {
      deviceSerial: "KRA-SDC-WL-00142", branchCode: "NBI-WL-001", kraPin: "P051234567A",
      apiBaseUrl: "https://etims-api.kra.go.ke", certificateStatus: "Valid",
      certificateExpiry: "Dec 2025", apiEnvironment: "Sandbox", syncInterval: "Every 5 minutes",
    },
  };

  const statusCards = [
    { label: "Connection", value: "Connected", icon: Wifi, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { label: "Pending Upload", value: String(ov.stats.pendingCount), icon: Clock, color: "bg-amber-50 border-amber-200 text-amber-700" },
    { label: "Failed Uploads", value: String(ov.stats.failedCount), icon: AlertCircle, color: "bg-red-50 border-red-200 text-red-700" },
    { label: "Successful Today", value: String(ov.stats.successToday), icon: CheckCircle2, color: "bg-blue-50 border-blue-200 text-blue-700" },
  ];

  const retryInvoice = async (id: string) => {
    try {
      await api.post(`/etims/${id}/retry`);
      refetchInvoices();
    } catch (err: any) {
      alert(err.message || "Failed to retry");
    }
  };

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
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {ov.lastSync ? `Last sync ${new Date(ov.lastSync.createdAt).toLocaleTimeString()}` : "Connected"}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(["overview", "invoices", "settings"] as const).map(tab => (
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
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Submission Stats</h3>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-foreground">{ov.stats.successRate}%</div>
              <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
              <div className="mt-4 space-y-2 text-left max-w-xs mx-auto">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-semibold">{ov.stats.totalInvoices}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Successful</span><span className="font-semibold text-emerald-600">{ov.stats.totalInvoices - ov.stats.pendingCount - ov.stats.failedCount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pending</span><span className="font-semibold text-amber-600">{ov.stats.pendingCount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Failed</span><span className="font-semibold text-red-600">{ov.stats.failedCount}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm mb-4">Device & Connection Info</h3>
            {[
              { label: "Device Serial", value: ov.deviceInfo.deviceSerial, icon: Hash },
              { label: "Branch Code", value: ov.deviceInfo.branchCode, icon: Building2 },
              { label: "Certificate Status", value: `${ov.deviceInfo.certificateStatus} · Expires ${ov.deviceInfo.certificateExpiry}`, icon: Shield },
              { label: "API Environment", value: ov.deviceInfo.apiEnvironment, icon: Globe },
              { label: "Sync Interval", value: ov.deviceInfo.syncInterval, icon: Clock },
              { label: "Business PIN", value: ov.deviceInfo.kraPin, icon: Lock },
            ].map(row => (
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
                {["eTIMS Ref", "Invoice No.", "Customer", "Amount", "Status", "Submitted", "Actions"].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground ${h === "Amount" ? "text-right" : h === "Status" || h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(invoicesResult?.invoices || []).length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">No invoices submitted yet</td></tr>
              )}
              {(invoicesResult?.invoices || []).map(inv => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-3 text-xs font-mono font-medium" style={{ color: inv.status === "SUCCESS" ? "#059669" : inv.status === "FAILED" ? "#DC2626" : "#D97706" }}>
                    {inv.kraInvoiceNo || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{inv.customerName}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-foreground">{fmt(inv.amount)}</td>
                  <td className="px-5 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {inv.submittedAt ? new Date(inv.submittedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {inv.status === "FAILED" && (
                        <button onClick={() => retryInvoice(inv.id)} className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">Retry</button>
                      )}
                      <button className="px-2 py-1 text-[10px] font-medium bg-muted text-muted-foreground rounded hover:bg-slate-200 transition-colors">
                        <Eye size={11} />
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
              { label: "Device Serial Number", value: ov.deviceInfo.deviceSerial, key: "deviceSerial" },
              { label: "Branch Code", value: ov.deviceInfo.branchCode, key: "branchCode" },
              { label: "KRA PIN", value: ov.deviceInfo.kraPin, key: "kraPin" },
              { label: "API Base URL", value: ov.deviceInfo.apiBaseUrl, key: "apiBaseUrl" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                <input defaultValue={f.value} className="w-full px-3 py-2 bg-muted rounded-lg text-sm font-mono border-0 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            <button className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Save & Test Connection
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Sync Configuration</h3>
            {[
              { label: "Auto Sync", sub: "Automatically submit invoices to KRA", enabled: true },
              { label: "Offline Queue", sub: "Queue invoices when offline and sync later", enabled: true },
              { label: "Retry Failed", sub: "Auto-retry failed submissions", enabled: true },
              { label: "Email Alerts", sub: "Notify on submission failures", enabled: false },
            ].map(toggle => (
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
