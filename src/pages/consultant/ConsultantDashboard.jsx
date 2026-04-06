import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { DASHBOARD } from "../../services/api";
import { Chart, registerables } from "chart.js";
import "../css/ConsultantDashboard.css";

Chart.register(...registerables);

function DonutChart({ data, labels, colors, title }) {
  const ref = useRef();
  const inst = useRef();
  useEffect(() => {
    if (!ref.current) return;
    inst.current?.destroy();
    inst.current = new Chart(ref.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { font: { family: "Inter", size: 12 }, padding: 10 } },
          title: { display: true, text: title, font: { family: "Inter", size: 14, weight: "600" }, color: "#0b1a30" }
        },
        cutout: "68%"
      }
    });
    return () => inst.current?.destroy();
  }, [data]);
  return <canvas ref={ref} />;
}

function BarChart({ labels, datasets, title }) {
  const ref = useRef();
  const inst = useRef();
  useEffect(() => {
    if (!ref.current) return;
    inst.current?.destroy();
    inst.current = new Chart(ref.current, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: title, font: { family: "Inter", size: 14, weight: "600" }, color: "#0b1a30" }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "#edf3fa" }, ticks: { font: { family: "Inter" } } },
          x: { grid: { display: false }, ticks: { font: { family: "Inter" } } }
        }
      }
    });
    return () => inst.current?.destroy();
  }, [datasets]);
  return <canvas ref={ref} />;
}

export default function ConsultantDashboard() {
  const { authFetch } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await authFetch(DASHBOARD.consultant);
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="cd-loading">Loading…</div>;
  if (!stats)  return <div className="cd-loading">Failed to load.</div>;

  const total = stats.total || 1;

  return (
    <div className="cd-page">
      <div className="cd-header">
        <div className="cd-title">Dashboard</div>
        <div className="cd-sub">{stats.total || 0} total demandes</div>
      </div>

      {/* Stat cards */}
      <div className="cd-cards">
        {[
          { key: "new",        label: "New",         color: "#005fa3" },
          { key: "inProgress", label: "In Progress", color: "#b45309" },
          { key: "resolved",   label: "Resolved",    color: "#16a34a" },
          { key: "closed",     label: "Closed",      color: "#999"    },
        ].map(s => (
          <div className="cd-card" key={s.key} style={{ borderTopColor: s.color }}>
            <div className="cd-card-label">{s.label}</div>
            <div className="cd-card-value" style={{ color: s.color }}>{stats[s.key] || 0}</div>
            <div className="cd-card-pct">
              {Math.round(((stats[s.key] || 0) / total) * 100)}% of total
            </div>
          </div>
        ))}
      </div>

      <div className="cd-charts-row">
        <div className="cd-chart-box cd-chart-sm">
          <DonutChart
            title="Status Distribution"
            labels={["New", "In Progress", "Resolved", "Closed"]}
            data={[stats.new || 0, stats.inProgress || 0, stats.resolved || 0, stats.closed || 0]}
            colors={["#005fa3", "#b45309", "#16a34a", "#999"]}
          />
        </div>

        <div className="cd-chart-box cd-chart-lg">
          <BarChart
            title="Demandes by Priority"
            labels={["Low", "Medium", "High", "Critical"]}
            datasets={[{
              label: "Count",
              data: [stats.lowPriority || 0, stats.mediumPriority || 0,
                     stats.highPriority || 0, stats.criticalPriority || 0],
              backgroundColor: ["#16a34acc", "#005fa3cc", "#b45309cc", "#c0392bcc"],
              borderColor:     ["#16a34a",   "#005fa3",   "#b45309",   "#c0392b"],
              borderWidth: 2,
              borderRadius: 6,
            }]}
          />
        </div>
      </div>
    </div>
  );
}