import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { DASHBOARD } from "../../services/api";
import { Chart, registerables } from "chart.js";
import "./css/DashboardHome.css";

Chart.register(...registerables);

// ── Chart components ──────────────────────────────────────
function useChart(ref, config, deps) {
  const inst = useRef();
  useEffect(() => {
    if (!ref.current) return;
    inst.current?.destroy();
    inst.current = new Chart(ref.current, config);
    return () => inst.current?.destroy();
  }, deps);
}

function HorizontalBar({ labels, data, colors, title }) {
  const ref = useRef();
  useChart(ref, {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
    options: {
      indexAxis: "y",
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: !!title, text: title, font: { family: "Inter", size: 13, weight: "600" }, color: "#0b1a30", padding: { bottom: 12 } }
      },
      scales: {
        x: { beginAtZero: true, grid: { color: "#edf3fa" }, ticks: { font: { family: "Inter", size: 11 } } },
        y: { grid: { display: false }, ticks: { font: { family: "Inter", size: 12 } } }
      }
    }
  }, [data]);
  return <canvas ref={ref} />;
}

function LineChart({ labels, datasets, title }) {
  const ref = useRef();
  useChart(ref, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { family: "Inter", size: 12 }, usePointStyle: true, pointStyleWidth: 8 } },
        title: { display: !!title, text: title, font: { family: "Inter", size: 13, weight: "600" }, color: "#0b1a30", padding: { bottom: 12 } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#edf3fa" }, ticks: { font: { family: "Inter", size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { family: "Inter", size: 11 } } }
      },
      elements: { line: { tension: 0.4 }, point: { radius: 5, hoverRadius: 7 } }
    }
  }, [datasets]);
  return <canvas ref={ref} />;
}

function PolarChart({ labels, data, colors, title }) {
  const ref = useRef();
  useChart(ref, {
    type: "polarArea",
    data: { labels, datasets: [{ data, backgroundColor: colors.map(c => c + "bb"), borderColor: colors, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { font: { family: "Inter", size: 12 }, usePointStyle: true } },
        title: { display: !!title, text: title, font: { family: "Inter", size: 13, weight: "600" }, color: "#0b1a30", padding: { bottom: 12 } }
      },
      scales: { r: { ticks: { display: false }, grid: { color: "#edf3fa" } } }
    }
  }, [data]);
  return <canvas ref={ref} />;
}

function RadarChart({ labels, datasets, title }) {
  const ref = useRef();
  useChart(ref, {
    type: "radar",
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { family: "Inter", size: 12 }, usePointStyle: true } },
        title: { display: !!title, text: title, font: { family: "Inter", size: 13, weight: "600" }, color: "#0b1a30", padding: { bottom: 12 } }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: { font: { family: "Inter", size: 10 }, backdropColor: "transparent" },
          grid: { color: "#edf3fa" },
          pointLabels: { font: { family: "Inter", size: 11 } }
        }
      }
    }
  }, [datasets]);
  return <canvas ref={ref} />;
}

// ── Stat card with mini sparkline ──────────────────────────
function StatCard({ label, value, sub, color, trend, pct }) {
  return (
    <div className="adh-card" style={{ borderTopColor: color }}>
      <div className="adh-card-label">{label}</div>
      <div className="adh-card-value" style={{ color }}>{value}</div>
      <div className="adh-card-sub">{sub}</div>
      {pct !== undefined && (
        <div className="adh-card-bar-wrap">
          <div className="adh-card-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
      )}
    </div>
  );
}

// ── Summary row card ───────────────────────────────────────
function SummaryRow({ items }) {
  return (
    <div className="adh-summary-row">
      {items.map(item => (
        <div key={item.label} className="adh-summary-item">
          <div className="adh-summary-dot" style={{ background: item.color }} />
          <div className="adh-summary-text">
            <span className="adh-summary-label">{item.label}</span>
            <span className="adh-summary-val" style={{ color: item.color }}>{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
};

export default function DashboardHome() {
  const { authFetch } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from,    setFrom]    = useState(monthAgo());
  const [to,      setTo]      = useState(today());

  const loadBase = async () => {
    try {
      const data = await authFetch(DASHBOARD.admin);
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadMonthly = async () => {
    try {
      const data = await authFetch(`${DASHBOARD.adminMonthly}?from=${from}&to=${to}`);
      setMonthly(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadBase();
    const id = setInterval(loadBase, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { loadMonthly(); }, [from, to]);

  if (loading) return <div className="adh-loading">Loading…</div>;
  if (!stats)  return <div className="adh-loading">Failed to load.</div>;

  const total = stats.totalDemandes || 1;
  const mTotal = monthly?.total || 1;

  // login by day data
  const loginDays = monthly?.loginByDay || {};
  const dayLabels = Object.keys(loginDays).map(d => `Day ${d}`);
  const dayValues = Object.values(loginDays);

  return (
    <div className="adh-page">
      <div className="adh-header-row">
        <div>
          <div className="adh-title">Admin Dashboard</div>
          <div className="adh-sub">Live overview · refreshes every 30s</div>
        </div>
        <div className="adh-date-filter">
          <label>From</label>
          <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} />
          <label>To</label>
          <input type="date" value={to} min={from} max={today()} onChange={e => setTo(e.target.value)} />
          <button className="adh-filter-btn" onClick={loadMonthly}>Apply</button>
        </div>
      </div>

      {/* Live cards */}
      <div className="adh-section-label">Live Stats</div>
      <div className="adh-cards">
        <StatCard label="Daily Logins"   value={stats.dailyLogins}   sub="Today"         color="#005fa3" />
        <StatCard label="Active Users"   value={stats.activeUsers}   sub="Last 30 min"   color="#16a34a" />
        <StatCard label="Total Users"    value={stats.totalUsers}    sub="All accounts"  color="#7c3aed" />
        <StatCard label="Total Demandes" value={stats.totalDemandes} sub="All time"      color="#0b1a30" />
      </div>

      {/* Summary row — user roles */}
      <div className="adh-section-label">User Roles</div>
      <SummaryRow items={[
        { label: "Admins",      value: stats.adminCount      || 0, color: "#c0392b" },
        { label: "Consultants", value: stats.consultantCount || 0, color: "#005fa3" },
        { label: "Technicians", value: stats.technicianCount || 0, color: "#16a34a" },
      ]} />

      {/* Date-filtered section */}
      <div className="adh-section-label" style={{ marginTop: 28 }}>
        Period Analysis — {from} → {to}
        {monthly && <span className="adh-period-total"> · {monthly.total} demandes</span>}
      </div>

      {monthly && (
        <>
          {/* Stat cards for period */}
          <div className="adh-cards">
            <StatCard label="New"         value={monthly.new || 0}        sub="Created, unassigned" color="#005fa3" pct={Math.round(((monthly.new || 0) / mTotal) * 100)} />
            <StatCard label="In Progress" value={monthly.inProgress || 0} sub="Being handled"       color="#b45309" pct={Math.round(((monthly.inProgress || 0) / mTotal) * 100)} />
            <StatCard label="Resolved"    value={monthly.resolved || 0}   sub="Completed"           color="#16a34a" pct={Math.round(((monthly.resolved || 0) / mTotal) * 100)} />
            <StatCard label="Closed"      value={monthly.closed || 0}     sub="Archived"            color="#999"    pct={Math.round(((monthly.closed || 0) / mTotal) * 100)} />
          </div>

          {/* Charts row 1 */}
          <div className="adh-charts-row">
            <div className="adh-chart-box" style={{ flex: "0 0 320px", height: 280 }}>
              <PolarChart
                title="Demandes by Priority"
                labels={["Critical", "High", "Medium", "Low"]}
                data={[monthly.critical || 0, monthly.high || 0, monthly.medium || 0, monthly.low || 0]}
                colors={["#c0392b", "#b45309", "#005fa3", "#16a34a"]}
              />
            </div>
            <div className="adh-chart-box" style={{ flex: 1, height: 280 }}>
              <HorizontalBar
                title="Status Breakdown"
                labels={["New", "In Progress", "Resolved", "Closed"]}
                data={[monthly.new || 0, monthly.inProgress || 0, monthly.resolved || 0, monthly.closed || 0]}
                colors={["#005fa3cc", "#b45309cc", "#16a34acc", "#99999966"]}
              />
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="adh-charts-row">
            <div className="adh-chart-box" style={{ flex: 1, height: 260 }}>
              <RadarChart
                title="Distribution Overview"
                labels={["New", "In Progress", "Resolved", "Closed", "Critical", "High"]}
                datasets={[{
                  label: "Period",
                  data: [
                    monthly.new || 0, monthly.inProgress || 0,
                    monthly.resolved || 0, monthly.closed || 0,
                    monthly.critical || 0, monthly.high || 0
                  ],
                  borderColor: "#005fa3",
                  backgroundColor: "#005fa322",
                  pointBackgroundColor: "#005fa3",
                  pointBorderColor: "#fff",
                  borderWidth: 2,
                }]}
              />
            </div>
            <div className="adh-chart-box" style={{ flex: 1, height: 260 }}>
              {dayValues.length > 0 ? (
                <LineChart
                  title="Daily Login Activity"
                  labels={dayLabels}
                  datasets={[{
                    label: "Logins",
                    data: dayValues,
                    borderColor: "#7c3aed",
                    backgroundColor: "#7c3aed22",
                    fill: true,
                    pointBackgroundColor: "#7c3aed",
                    pointBorderColor: "#fff",
                    borderWidth: 2,
                  }]}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#b0c4d8", fontSize: 13 }}>
                  No login data for selected period
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}