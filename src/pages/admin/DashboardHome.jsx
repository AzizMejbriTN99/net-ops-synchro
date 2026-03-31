import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { DASHBOARD } from "../../services/api";
import "./css/DashboardHome.css";

const DEMANDE_STATS = [
  { key: "newDemandes", label: "New",         color: "#005fa3" },
  { key: "inProgress",  label: "In Progress", color: "#b45309" },
  { key: "resolved",    label: "Resolved",    color: "#16a34a" },
];

export default function DashboardHome() {
  const { authFetch } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await authFetch(DASHBOARD.admin);
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

  if (loading) return <div className="adh-loading">Loading stats…</div>;
  if (!stats)  return <div className="adh-loading">Failed to load stats.</div>;

  return (
    <div className="adh-page">
      <div className="adh-header">
        <div className="adh-title">Admin Dashboard</div>
        <div className="adh-sub">Refreshes every 30 seconds</div>
      </div>

      {/* Top row — users */}
      <div className="adh-section-label">Users</div>
      <div className="adh-grid">
        <div className="adh-card adh-card-blue">
          <div className="adh-card-label">Daily Logins</div>
          <div className="adh-card-value">{stats.dailyLogins}</div>
          <div className="adh-card-sub">Today</div>
        </div>
        <div className="adh-card adh-card-green">
          <div className="adh-card-label">Active Users</div>
          <div className="adh-card-value">{stats.activeUsers}</div>
          <div className="adh-card-sub">Last 30 minutes</div>
        </div>
        <div className="adh-card adh-card-neutral">
          <div className="adh-card-label">Total Users</div>
          <div className="adh-card-value">{stats.totalUsers}</div>
          <div className="adh-card-sub">All accounts</div>
        </div>
      </div>

      {/* Bottom row — demandes */}
      <div className="adh-section-label">Demandes</div>
      <div className="adh-grid">
        <div className="adh-card adh-card-neutral">
          <div className="adh-card-label">Total</div>
          <div className="adh-card-value">{stats.totalDemandes}</div>
          <div className="adh-card-sub">All time</div>
        </div>
        {DEMANDE_STATS.map(s => (
          <div className="adh-card" key={s.key}
            style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="adh-card-label">{s.label}</div>
            <div className="adh-card-value" style={{ color: s.color }}>
              {stats[s.key] || 0}
            </div>
            <div className="adh-card-bar-wrap">
              <div className="adh-card-bar" style={{
                width: stats.totalDemandes > 0
                  ? `${Math.round(((stats[s.key] || 0) / stats.totalDemandes) * 100)}%`
                  : "0%",
                background: s.color
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}