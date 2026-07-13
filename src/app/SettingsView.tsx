import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import {
  Building2, Percent, CreditCard, Receipt, Users, Globe,
  Banknote, Phone, Settings,
} from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: any;
  group: string;
}

export function SettingsView() {
  const [activeSection, setActiveSection] = useState("business");
  const { data: allSettings, refetch } = useApi(() => api.get<Setting[]>("/settings"));

  const getSetting = (key: string, fallback = "") => {
    if (!allSettings) return fallback;
    const s = allSettings.find(x => x.key === key);
    return s?.value ?? fallback;
  };

  const sections = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "tax", label: "Tax Settings", icon: Percent },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "receipt", label: "Receipt", icon: Receipt },
    { id: "users", label: "Users & Roles", icon: Users },
    { id: "integrations", label: "Integrations", icon: Globe },
  ];

  const [formData, setFormData] = useState<Record<string, string>>({});

  const saveSettings = async (pairs: { key: string; value: string; group: string }[]) => {
    try {
      await api.put("/settings", pairs);
      refetch();
      alert("Settings saved");
    } catch (err: any) {
      alert(err.message || "Failed to save");
    }
  };

  const Save = ({ size, className }: { size: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your business configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-3 space-y-1 h-fit">
          {sections.map(s => (
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
                  { key: "business_name", label: "Business Name", value: getSetting("business_name", "SwiftPOS") },
                  { key: "business_kra_pin", label: "KRA PIN", value: getSetting("business_kra_pin", "P051234567A") },
                  { key: "business_phone", label: "Phone", value: getSetting("business_phone", "+254 700 123 456") },
                  { key: "business_email", label: "Email", value: getSetting("business_email", "info@swiftpos.co.ke") },
                  { key: "business_address", label: "Address", value: getSetting("business_address", "Westlands, Nairobi") },
                  { key: "business_vat_reg", label: "VAT Registration", value: getSetting("business_vat_reg", "0123456789") },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{f.label}</label>
                    <input
                      defaultValue={f.value}
                      onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-muted rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Receipt Footer Message</label>
                <textarea
                  defaultValue={getSetting("receipt_footer", "Thank you for shopping with us!")}
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
                  { name: "Standard VAT", rate: getSetting("tax_vat_standard", "16"), desc: "Applied to most goods and services", active: true },
                  { name: "Zero Rate", rate: "0", desc: "Basic food items, medical supplies", active: true },
                  { name: "Exempt", rate: "N/A", desc: "Financial services, educational fees", active: true },
                ].map(tax => (
                  <div key={tax.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <div className="text-sm font-medium text-foreground">{tax.name}</div>
                      <div className="text-xs text-muted-foreground">{tax.desc}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-foreground">{tax.rate}{tax.rate !== "N/A" ? "%" : ""}</span>
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
                ].map(pm => (
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
            <button
              onClick={() => {
                const keys = Object.keys(formData);
                if (keys.length === 0) return;
                const pairs = keys.filter(k => formData[k]).map(k => ({ key: k, value: formData[k], group: "business" }));
                saveSettings(pairs);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
