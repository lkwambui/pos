import { useState } from "react";
import { Search, Plus, Mail, Phone, Edit3 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CrudModal } from "./CrudModal";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string };
  branch: { id: string; name: string } | null;
  createdAt: string;
}

export function UsersView() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refetch } = useApi<User[]>(
    () => api.get(`/users?page=1&limit=200&search=${search}`),
    [search]
  );

  const users = data || [];
  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form: Record<string, string>) => {
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/users/${editItem.id}`, form);
      } else {
        await api.post("/users", form);
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
          <h1 className="text-xl font-semibold text-foreground">Users & Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} users</p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-white hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card rounded-lg text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search users…"
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Branch</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="flex items-center gap-1"><Mail size={10} />{u.email}</span>
                            {u.phone && <span className="flex items-center gap-1"><Phone size={10} />{u.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">{u.role.name}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.branch?.name || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(u); setModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600" title="Edit">
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
        title={editItem ? "Edit User" : "Add User"}
        saving={saving}
        initialData={editItem ? {
          firstName: editItem.firstName,
          lastName: editItem.lastName,
          email: editItem.email,
          phone: editItem.phone || "",
          roleId: editItem.roleId,
        } : undefined}
        fields={[
          { name: "firstName", label: "First Name", required: true },
          { name: "lastName", label: "Last Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone" },
          { name: "password", label: "Password", type: "text", required: !editItem },
        ]}
      />
    </div>
  );
}
