import { useState, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Field {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface CrudModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => Promise<void>;
  title: string;
  fields: Field[];
  initialData?: Record<string, string>;
  saving?: boolean;
}

export function CrudModal({ open, onClose, onSave, title, fields, initialData, saving }: CrudModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        initial[f.name] = initialData?.[f.name] || "";
      });
      setForm(initial);
    }
  }, [open, fields, initialData]);

  if (!open) return null;

  const handleSave = async () => {
    await onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {f.type === "select" ? (
                <select
                  value={form[f.name] || ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  required={f.required}
                >
                  <option value="">Select...</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={form[f.name] || ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                  required={f.required}
                />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.name] || ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  required={f.required}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
