import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { ADMIN } from "../../services/api";
import "./css/UsersPage.css";

const ROLES = ["ADMIN", "CONSULTANT", "TECHNICIAN"];

function UserDrawer({ user, onClose, onSaved }) {
  const { authFetch } = useAuth();
  const isEdit = !!user?.id;

  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "CONSULTANT",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.username || !form.email || (!isEdit && !form.password)) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await authFetch(ADMIN.userById(user.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await authFetch(ADMIN.userRegister, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      onSaved();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span>{isEdit ? "Edit User" : "Add User"}</span>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="drawer-error">{error}</div>}

        <div className="drawer-body">
          <div className="dfield">
            <label>Username {!isEdit && <span className="req">*</span>}</label>
            <input
              value={form.username}
              onChange={e => set("username", e.target.value)}
              disabled={isEdit}
              placeholder="john.doe"
            />
          </div>
          <div className="dfield">
            <label>Email <span className="req">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="john@netops.int"
            />
          </div>
          <div className="dfield">
            <label>Password {isEdit ? "(leave blank to keep)" : <span className="req">*</span>}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set("password", e.target.value)}
              placeholder={isEdit ? "••••••••" : "Min. 8 characters"}
            />
          </div>
          <div className="dfield">
            <label>Role <span className="req">*</span></label>
            <select value={form.role} onChange={e => set("role", e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="dbtn-cancel" onClick={onClose}>Cancel</button>
          <button className="dbtn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authFetch(ADMIN.users);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try {
      await authFetch(ADMIN.userToggle(id), { method: "PATCH" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await authFetch(ADMIN.userById(id), { method: "DELETE" });
      load();
    } catch (e) { console.error(e); }
    finally { setDeleting(null); }
  };

  const roleColor = r => ({ ADMIN: "role-admin", CONSULTANT: "role-consultant", TECHNICIAN: "role-tech" }[r] || "");

  return (
    <div className="users-page">
      <div className="up-header">
        <div>
          <div className="up-title">User Management</div>
          <div className="up-sub">{users.length} account{users.length !== 1 ? "s" : ""} registered</div>
        </div>
        <button className="up-add" onClick={() => setDrawer({ user: null })}>
          + Add User
        </button>
      </div>

      {loading ? (
        <div className="up-loading">Loading users…</div>
      ) : (
        <div className="up-table-wrap">
          <table className="up-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="td-user">
                    <div className="td-avatar">{u.username[0].toUpperCase()}</div>
                    <span>{u.username}</span>
                  </td>
                  <td className="td-muted">{u.email}</td>
                  <td><span className={`role-badge ${roleColor(u.role)}`}>{u.role}</span></td>
                  <td>
                    <span className={`status-badge ${u.enabled ? "st-on" : "st-off"}`}>
                      {u.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="act-btn edit" onClick={() => setDrawer({ user: u })}>Edit</button>
                    <button className="act-btn toggle" onClick={() => handleToggle(u.id)}>
                      {u.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="act-btn del"
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                    >
                      {deleting === u.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawer !== null && (
        <UserDrawer
          user={drawer.user}
          onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); load(); }}
        />
      )}
    </div>
  );
}