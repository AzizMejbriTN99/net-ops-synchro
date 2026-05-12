import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { CONSULTANT } from "../../services/api";
import ToastContainer from "../../components/general/ToastContainer";
import useToast from "../../hooks/useToast";
import useSortableTable from "../../hooks/useSortableTable";
import "../css/DemandesPage.css";

const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const formatLabel = s => s
    ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ")
    : "";

const formatDate = iso => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const statusClass = s => ({ NEW: "s-new", IN_PROGRESS: "s-progress", RESOLVED: "s-resolved", CLOSED: "s-closed" }[s] || "");
const priorityClass = p => ({ LOW: "p-low", MEDIUM: "p-medium", HIGH: "p-high", CRITICAL: "p-critical" }[p] || "");

const PAGE_SIZE = 10;

// ── Drawer ────────────────────────────────────────────────
function DemandeDrawer({ demande, technicians, onClose, onSaved }) {
    const { authFetch } = useAuth();

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
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title || !form.clientName) { setError("Title and client name are required."); return; }
        setSaving(true);
        setError("");
        try {
            await authFetch(CONSULTANT.demandeById(demande.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, technicianId: form.technicianId || null }),
            });
            onSaved();
        } catch (e) { setError(e.message || "Something went wrong."); }
        finally { setSaving(false); }
    };

    return (
        <div className="drawer-backdrop" onClick={onClose}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <span>Edit Demande</span>
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
                        <div className="dfield">
                            <label>Status</label>
                            <select value={form.status} onChange={e => set("status", e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
                            </select>
                        </div>
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
    const { toasts, addToast, removeToast } = useToast();
    const [counts, setCounts] = useState({});

    const [demandes, setDemandes] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawer, setDrawer] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [filter, setFilter] = useState("ALL");

    // ── Pagination + search state ──
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search,
                page,
                size: PAGE_SIZE,
                sort: "createdAt,desc",
            });

            if (filter !== "ALL") {
                params.append("status", filter);
            }
            const [pageData, t] = await Promise.all([
                authFetch(`${CONSULTANT.demandes}?${params}`),
                authFetch(CONSULTANT.technicians),
            ]);
            setDemandes(pageData.content ?? []);
            setTotalPages(pageData.totalPages ?? 0);
            setTotalElements(pageData.totalElements ?? 0);
            setCounts(pageData.counts ?? {});
            setTechnicians(Array.isArray(t) ? t : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search, page, filter, authFetch]);

    useEffect(() => { load(); }, [load]);

    // reset to page 0 when search or filter changes
    useEffect(() => { setPage(0); }, [search, filter]);

    const handleSearchSubmit = e => {
        e.preventDefault();
        setSearch(searchInput.trim());
    };

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


    const {
        sorted: sortedDemandes,
        requestSort,
        getSortIcon
    } = useSortableTable(demandes, "createdAt");

    const statusCounts = counts;

    return (
        <div className="demandes-page">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            {/* Header */}
            <div className="dp-header">
                <div>
                    <div className="dp-title">Demandes</div>
                    <div className="dp-sub">{totalElements} total</div>
                </div>

                {/* Search bar */}
                <form className="dp-search-form" onSubmit={handleSearchSubmit}>
                    <div className="dp-search-wrap">
                        <img src="/assets/icons/traffic.svg" alt="" className="dp-search-icon" />
                        <input
                            className="dp-search-input"
                            placeholder="Search by title or client..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <button type="button" className="dp-search-clear"
                                onClick={() => { setSearchInput(""); setSearch(""); }}>
                                <img src="/assets/icons/close.svg" alt="clear" style={{ width: 12 }} />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="dp-search-btn">Search</button>
                </form>
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
                            {s === "ALL" ? demandes.length : (statusCounts[s] ?? 0)}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="dp-loading">Loading demandes…</div>
            ) : sortedDemandes.length === 0 ? (
                <div className="dp-empty">
                    {search ? `No results for "${search}"` : "No demandes found."}
                </div>
            ) : (
                <>
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
                                {sortedDemandes.map(d => (
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
                                            <span className={`status-badge-dp ${statusClass(d.status)}`}>
                                                {formatLabel(d.status)}
                                            </span>
                                        </td>
                                        <td className="td-muted">{d.technicianUsername || <span className="td-unassigned">Unassigned</span>}</td>
                                        <td className="td-muted td-date">{formatDate(d.createdAt)}</td>
                                        <td className="td-actions">
                                            <button className="act-btn edit" onClick={() => setDrawer({ demande: d })}>Edit</button>
                                            <button className="act-btn del"
                                                onClick={() => handleDelete(d.id)}
                                                disabled={deleting === d.id}>
                                                {deleting === d.id ? "…" : "Delete"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="dp-pagination">
                            <button className="dp-page-btn"
                                disabled={page === 0}
                                onClick={() => setPage(0)}>
                                «
                            </button>
                            <button className="dp-page-btn"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}>
                                ‹
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i)
                                .filter(i => Math.abs(i - page) <= 2)
                                .map(i => (
                                    <button key={i}
                                        className={`dp-page-btn ${i === page ? "active" : ""}`}
                                        onClick={() => setPage(i)}>
                                        {i + 1}
                                    </button>
                                ))
                            }

                            <button className="dp-page-btn"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}>
                                ›
                            </button>
                            <button className="dp-page-btn"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(totalPages - 1)}>
                                »
                            </button>

                            <span className="dp-page-info">
                                Page {page + 1} of {totalPages} · {totalElements} total
                            </span>
                        </div>
                    )}
                </>
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