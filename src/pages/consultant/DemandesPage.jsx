import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { CONSULTANT } from "../../services/api";
import ToastContainer from "../../components/general/ToastContainer";
import useToast from "../../hooks/useToast";
import "../css/DemandesPage.css";

const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const formatLabel = s => s
    ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace("_", " ")
    : "";

const formatDate = iso => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const statusClass = s => ({ NEW: "s-new", IN_PROGRESS: "s-progress", RESOLVED: "s-resolved", CLOSED: "s-closed" }[s] || "");
const priorityClass = p => ({ LOW: "p-low", MEDIUM: "p-medium", HIGH: "p-high", CRITICAL: "p-critical" }[p] || "");

// ── Drawer ────────────────────────────────────────────────
function DemandeDrawer({ demande, technicians, onClose, onSaved }) {
    const { authFetch } = useAuth();
    const isEdit = !!demande?.id;

    const [form, setForm] = useState({
        title: demande?.title || "",
        description: demande?.description || "",
        priority: demande?.priority || "MEDIUM",
        status: demande?.status || "NEW",
        clientName: demande?.clientName || "",
        clientContact: demande?.clientContact || "",
        clientLocation: demande?.clientLocation || "",
        technicianId: demande?.technicianId || "",
    });
    const [error, setSaving_error] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title || !form.clientName) {
            setSaving_error("Title and client name are required.");
            return;
        }
        setSaving(true);
        setSaving_error("");
        try {
            const body = { ...form, technicianId: form.technicianId || null };
            if (isEdit) {
                await authFetch(CONSULTANT.demandeById(demande.id), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                await authFetch(CONSULTANT.demandes, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }
            onSaved();
        } catch (e) {
            setSaving_error(e.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="drawer-backdrop" onClick={onClose}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <span>{isEdit ? "Edit Demande" : "New Demande"}</span>
                    <button className="drawer-close" onClick={onClose}>
                        <img src="/assets/icons/close.svg" alt="close" style={{ width: 14, height: 14 }} />
                    </button>
                </div>

                {error && <div className="drawer-error">{error}</div>}

                <div className="drawer-body">
                    <div className="drawer-section-title">Request Info</div>

                    <div className="dfield">
                        <label>Title <span className="req">*</span></label>
                        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Brief description of the issue" />
                    </div>
                    <div className="dfield">
                        <label>Description</label>
                        <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detailed description..." rows={3} />
                    </div>
                    <div className="dfield-row">
                        <div className="dfield">
                            <label>Priority</label>
                            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
                                {PRIORITIES.map(p => <option key={p} value={p}>{formatLabel(p)}</option>)}
                            </select>
                        </div>
                        {isEdit && (
                            <div className="dfield">
                                <label>Status</label>
                                <select value={form.status} onChange={e => set("status", e.target.value)}>
                                    {STATUSES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="drawer-section-title">Client Info</div>

                    <div className="dfield">
                        <label>Client Name <span className="req">*</span></label>
                        <input value={form.clientName} onChange={e => set("clientName", e.target.value)} placeholder="Full name or company" />
                    </div>
                    <div className="dfield-row">
                        <div className="dfield">
                            <label>Contact</label>
                            <input value={form.clientContact} onChange={e => set("clientContact", e.target.value)} placeholder="+216 XX XXX XXX" />
                        </div>
                        <div className="dfield">
                            <label>Location</label>
                            <input value={form.clientLocation} onChange={e => set("clientLocation", e.target.value)} placeholder="City or address" />
                        </div>
                    </div>

                    <div className="drawer-section-title">Assignment</div>

                    <div className="dfield">
                        <label>Assign Technician</label>
                        <select value={form.technicianId} onChange={e => set("technicianId", e.target.value)}>
                            <option value="">— Unassigned —</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.username}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="drawer-footer">
                    <button className="dbtn-cancel" onClick={onClose}>Cancel</button>
                    <button className="dbtn-save" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Demande"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function DemandesPage() {
    const { authFetch } = useAuth();
    const [demandes, setDemandes] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawer, setDrawer] = useState(null);
    const [filter, setFilter] = useState("ALL");
    const [deleting, setDeleting] = useState(null);
    const { toasts, addToast, removeToast } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [d, t] = await Promise.all([
                authFetch(CONSULTANT.demandes),
                authFetch(CONSULTANT.technicians),
            ]);
            setDemandes(d);
            setTechnicians(t);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await authFetch(CONSULTANT.demandeById(id), { method: "DELETE" });
            addToast("Demande deleted");
            load();
        } catch (e) {
            addToast(e.message || "Delete failed", "error");
        } finally {
            setDeleting(null);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await authFetch(CONSULTANT.demandeStatus(id), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            addToast(`Status updated to ${formatLabel(status)}`);
            load();
        } catch (e) {
            addToast(e.message || "Update failed", "error");
        }
    };

    const filtered = filter === "ALL" ? demandes : demandes.filter(d => d.status === filter);

    return (
        <div className="demandes-page">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <div className="dp-header">
                <div>
                    <div className="dp-title">Demandes</div>
                    <div className="dp-sub">{demandes.length} total · {demandes.filter(d => d.status === "NEW").length} new</div>
                </div>
                <button className="dp-add" onClick={() => setDrawer({ demande: null })}>
                    + New Demande
                </button>
            </div>

            {/* Filter tabs */}
            <div className="dp-tabs">
                {["ALL", ...STATUSES].map(s => (
                    <button
                        key={s}
                        className={`dp-tab ${filter === s ? "active" : ""}`}
                        onClick={() => setFilter(s)}
                    >
                        {s === "ALL" ? "All" : formatLabel(s)}
                        <span className="dp-tab-count">
                            {s === "ALL" ? demandes.length : demandes.filter(d => d.status === s).length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="dp-loading">Loading demandes…</div>
            ) : filtered.length === 0 ? (
                <div className="dp-empty">No demandes found.</div>
            ) : (
                <div className="dp-table-wrap">
                    <table className="dp-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Client</th>
                                <th>Location</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Technician</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(d => (
                                <tr key={d.id}>
                                    <td className="td-title">
                                        <div className="td-title-text">{d.title}</div>
                                        {d.description && (
                                            <div className="td-desc">{d.description.slice(0, 60)}{d.description.length > 60 ? "…" : ""}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="td-client-name">{d.clientName}</div>
                                        {d.clientContact && <div className="td-muted">{d.clientContact}</div>}
                                    </td>
                                    <td className="td-muted">{d.clientLocation || "—"}</td>
                                    <td><span className={`priority-badge ${priorityClass(d.priority)}`}>{formatLabel(d.priority)}</span></td>
                                    <td>
                                        <select
                                            className={`status-select ${statusClass(d.status)}`}
                                            value={d.status}
                                            onChange={e => handleStatusChange(d.id, e.target.value)}
                                        >
                                            {STATUSES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
                                        </select>
                                    </td>
                                    <td className="td-muted">{d.technicianUsername || <span className="td-unassigned">Unassigned</span>}</td>
                                    <td className="td-muted td-date">{formatDate(d.createdAt)}</td>
                                    <td className="td-actions">
                                        <button className="act-btn edit" onClick={() => setDrawer({ demande: d })}>Edit</button>
                                        <button
                                            className="act-btn del"
                                            onClick={() => handleDelete(d.id)}
                                            disabled={deleting === d.id}
                                        >
                                            {deleting === d.id ? "…" : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {drawer !== null && (
                <DemandeDrawer
                    demande={drawer.demande}
                    technicians={technicians}
                    onClose={() => setDrawer(null)}
                    onSaved={() => {
                        setDrawer(null);
                        load();
                        addToast(drawer.demande ? "Demande updated" : "Demande created");
                    }}
                />
            )}
        </div>
    );
}