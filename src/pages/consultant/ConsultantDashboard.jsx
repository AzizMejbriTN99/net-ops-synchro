import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { DASHBOARD } from "../../services/api";
import "../css/ConsultantDashboard.css";

const STAT_CONFIG = [
    { key: "new", label: "New", color: "#005fa3", bg: "#f0f7ff" },
    { key: "inProgress", label: "In Progress", color: "#b45309", bg: "#fff8ed" },
    { key: "resolved", label: "Resolved", color: "#16a34a", bg: "#f0fff8" },
    { key: "closed", label: "Closed", color: "#999", bg: "#f5f5f5" },
];

export default function ConsultantDashboard() {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const data = await authFetch(DASHBOARD.consultant);
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, []);

    if (loading) return <div className="cd-loading">Loading stats…</div>;
    if (!stats) return <div className="cd-loading">Failed to load stats.</div>;

    const total = stats.total || 0;

    return (
        <div className="cd-page">
            <div className="cd-header">
                <div className="cd-title">Dashboard</div>
                <div className="cd-sub">{total} total demande{total !== 1 ? "s" : ""}</div>
            </div>

            <div className="cd-grid">
                {STAT_CONFIG.map(s => {
                    const val = stats[s.key] || 0;
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                    return (
                        <div className="cd-card" key={s.key} style={{ borderTop: `3px solid ${s.color}` }}>
                            <div className="cd-card-label">{s.label}</div>
                            <div className="cd-card-value" style={{ color: s.color }}>{val}</div>
                            <div className="cd-card-bar-wrap">
                                <div className="cd-card-bar"
                                    style={{ width: `${pct}%`, background: s.color }} />
                            </div>
                            <div className="cd-card-pct">{pct}% of total</div>
                        </div>
                    );
                })}
            </div>

            <div className="cd-total-card">
                <div className="cd-total-label">Total Demandes</div>
                <div className="cd-total-value">{total}</div>
            </div>
        </div>
    );
}