import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/AuthContext";
import { CONSULTANT } from "../../services/api";
import ToastContainer from "../../components/general/ToastContainer";
import useToast from "../../hooks/useToast";
import useSortableTable from "../../hooks/useSortableTable";
import "../css/DemandesPage.css";
import { useNavigate, useLocation } from "react-router-dom";

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
            await authFetch(CONSULTANT.demandeById(demande.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, technicianId: form.technicianId || null }),
            });
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
                        {saving ? "Saving…" : "Save Changes"}
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
    const navigate = useNavigate();
    const location = useLocation();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const ITEMS_PER_PAGE = 10;


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

    const drawerCity = drawer?.demande?.clientLocation
        ? null : null;

    const loadTechnicians = async (city) => {
        try {
            const params = city ? `?city=${city}` : "";
            const data = await authFetch(`${CONSULTANT.technicians}${params}`);
            setTechnicians(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        load();

        const interval = setInterval(() => {
            load();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get("search");

        if (q) {
            setSearch(q);
        }
    }, [location.search]);

    const filtered = demandes.filter(d => {

        const matchesStatus =
            filter === "ALL" || d.status === filter;

        const matchesSearch =
            !search ||
            d.id?.toString().includes(search.toLowerCase()) ||
            d.title?.toLowerCase().includes(search.toLowerCase()) ||
            d.clientName?.toLowerCase().includes(search.toLowerCase()) ||
            d.clientLocation?.toLowerCase().includes(search.toLowerCase()) ||
            d.technicianUsername?.toLowerCase().includes(search.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const { sorted: sortedDemandes, requestSort, getSortIcon } =
        useSortableTable(filtered, "createdAt");

    const paginatedDemandes = useMemo(() => {

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;

        return sortedDemandes.slice(start, end);

    }, [sortedDemandes, page]);

    const totalPages = Math.ceil(sortedDemandes.length / ITEMS_PER_PAGE);



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

    return (
        <div className="demandes-page">
            <ToastContainer toasts={toasts} onClose={removeToast} />

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

            <div className="dp-search-wrap">
                <input
                    type="text"
                    placeholder="Search demande..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="dp-search"
                />
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
                                {[
                                    { key: "title", label: "Title" },
                                    { key: "clientName", label: "Client" },
                                    { key: "clientLocation", label: "Location" },
                                    { key: "priority", label: "Priority" },
                                    { key: "status", label: "Status" },
                                    { key: "technicianUsername", label: "Technician" },
                                    { key: "createdAt", label: "Created" },
                                ].map(col => (
                                    <th key={col.key} onClick={() => requestSort(col.key)}
                                        style={{ cursor: "pointer", userSelect: "none" }}>
                                        {col.label}{getSortIcon(col.key)}
                                    </th>
                                ))}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDemandes.map(d => (
                                <tr
                                    key={d.id}
                                    className={`
        ${search &&
                                            d.id?.toString() === search
                                            ? "highlight-row"
                                            : ""
                                        }

        priority-row-${d.priority?.toLowerCase()}
    `}
                                >
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
                                        <span className={`status-badge-dp ${statusClass(d.status)}`}>
                                            {formatLabel(d.status)}
                                        </span>
                                    </td>
                                    <td className="td-muted">{d.technicianUsername || <span className="td-unassigned">Unassigned</span>}</td>
                                    <td className="td-muted td-date">{formatDate(d.createdAt)}</td>
                                    <td className="td-actions">

                                        {(d.status === "NEW" || d.status === "IN_PROGRESS") && (
                                            <button
                                                className="act-btn map"
                                                onClick={() => navigate(`/consultant/map?demande=${d.id}`)}
                                            >
                                                Map
                                            </button>
                                        )}

                                        <button
                                            className="act-btn edit"
                                            onClick={() => setDrawer({ demande: d })}
                                        >
                                            Edit
                                        </button>

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
                    <div className="dp-pagination">

                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Prev
                        </button>

                        <span>
                            Page {page} / {totalPages || 1}
                        </span>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>

                    </div>
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
                        addToast("Demande updated successfully");
                    }}
                />
            )}
        </div>
    );
}