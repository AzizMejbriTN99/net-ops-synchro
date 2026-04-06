import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import ToastContainer from "../../components/general/ToastContainer";
import useToast from "../../hooks/useToast";
import { SERVERS } from "../../services/api";
import "../css/ServersPage.css";

const DB_TYPES = ["MYSQL", "POSTGRESQL", "ORACLE", "MSSQL", "MONGODB"];
const CITIES   = ["TUNIS", "SOUSSE", "SFAX", "MONASTIR", "KAIROUAN"];

function formatLabel(s) {
  if (!s) return "";
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

// ── Shared Drawer Shell ───────────────────────────────────
function Drawer({ title, onClose, children, footer }) {
  return (
    <div className="srv-backdrop" onClick={onClose}>
      <div className="srv-drawer" onClick={e => e.stopPropagation()}>
        <div className="srv-drawer-header">
          <span>{title}</span>
          <button onClick={onClose}>
            <img src="/assets/icons/close.svg" style={{ width: 14 }} alt="close" />
          </button>
        </div>
        <div className="srv-drawer-body">{children}</div>
        <div className="srv-drawer-footer">{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="srv-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ── Add Server Drawer ─────────────────────────────────────
function ServerDrawer({ onClose, onSaved }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({ name: "", host: "", port: 22, username: "", password: "", city: "TUNIS" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.host || !form.username || !form.password) { setError("All fields required."); return; }
    setSaving(true);
    try {
      await authFetch(SERVERS.list, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Drawer title="Add Server" onClose={onClose} footer={
      <>
        <button className="srv-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="srv-btn-save" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add Server"}</button>
      </>
    }>
      {error && <div className="srv-error">{error}</div>}
      {[
        { k: "name",     label: "Display Name", ph: "Production Server 1"  },
        { k: "host",     label: "Host / IP",     ph: "192.168.1.100"        },
        { k: "port",     label: "SSH Port",      ph: "22", type: "number"   },
        { k: "username", label: "SSH Username",  ph: "ubuntu"               },
        { k: "password", label: "SSH Password",  ph: "••••••••", type: "password" },
      ].map(f => (
        <Field key={f.k} label={f.label}>
          <input type={f.type || "text"} value={form[f.k]}
            onChange={e => set(f.k, f.type === "number" ? Number(e.target.value) : e.target.value)}
            placeholder={f.ph} />
        </Field>
      ))}
      <Field label="City">
        <select value={form.city} onChange={e => set("city", e.target.value)}>
          {CITIES.map(c => <option key={c} value={c}>{formatLabel(c)}</option>)}
        </select>
      </Field>
    </Drawer>
  );
}

// ── Add Tomcat Drawer ─────────────────────────────────────
function TomcatDrawer({ serverId, onClose, onSaved }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({
    name: "", catalinaHome: "/opt/tomcat", webappsPath: "/opt/tomcat/webapps",
    logsPath: "/opt/tomcat/logs", startScript: "/opt/tomcat/bin/startup.sh",
    stopScript: "/opt/tomcat/bin/shutdown.sh", serverId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name) { setError("Name is required."); return; }
    setSaving(true);
    try {
      await authFetch(SERVERS.tomcat, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Drawer title="Add Tomcat Instance" onClose={onClose} footer={
      <>
        <button className="srv-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="srv-btn-save" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add Tomcat"}</button>
      </>
    }>
      {error && <div className="srv-error">{error}</div>}
      {[
        { k: "name",         label: "Instance Name",  ph: "Tomcat 9 — App1"            },
        { k: "catalinaHome", label: "CATALINA_HOME",  ph: "/opt/tomcat"                },
        { k: "webappsPath",  label: "Webapps Path",   ph: "/opt/tomcat/webapps"        },
        { k: "logsPath",     label: "Logs Path",      ph: "/opt/tomcat/logs"           },
        { k: "startScript",  label: "Start Script",   ph: "/opt/tomcat/bin/startup.sh" },
        { k: "stopScript",   label: "Stop Script",    ph: "/opt/tomcat/bin/shutdown.sh"},
      ].map(f => (
        <Field key={f.k} label={f.label}>
          <input type="text" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} />
        </Field>
      ))}
    </Drawer>
  );
}

// ── Add Database Drawer ───────────────────────────────────
function DatabaseDrawer({ onClose, onSaved }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({ name: "", type: "MYSQL", connectionString: "", dbUsername: "", dbPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.connectionString) { setError("Name and connection string required."); return; }
    setSaving(true);
    try {
      await authFetch(SERVERS.databases, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Drawer title="Add Database" onClose={onClose} footer={
      <>
        <button className="srv-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="srv-btn-save" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add Database"}</button>
      </>
    }>
      {error && <div className="srv-error">{error}</div>}
      <Field label="Display Name">
        <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Production DB" />
      </Field>
      <Field label="Type">
        <select value={form.type} onChange={e => set("type", e.target.value)}>
          {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="JDBC Connection String">
        <input value={form.connectionString} onChange={e => set("connectionString", e.target.value)}
          placeholder="jdbc:mysql://localhost:3306/mydb" />
      </Field>
      <Field label="DB Username">
        <input value={form.dbUsername} onChange={e => set("dbUsername", e.target.value)} placeholder="root" />
      </Field>
      <Field label="DB Password">
        <input type="password" value={form.dbPassword} onChange={e => set("dbPassword", e.target.value)} placeholder="••••••••" />
      </Field>
    </Drawer>
  );
}

// ── Rename Modal ──────────────────────────────────────────
function RenameModal({ current, onConfirm, onClose }) {
  const [name, setName] = useState(current);
  return (
    <div className="srv-backdrop" onClick={onClose}>
      <div className="rename-modal" onClick={e => e.stopPropagation()}>
        <div className="srv-drawer-header">
          <span>Rename</span>
          <button onClick={onClose}><img src="/assets/icons/close.svg" style={{ width: 14 }} alt="close" /></button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <Field label="New Name">
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onConfirm(name)} autoFocus />
          </Field>
        </div>
        <div className="srv-drawer-footer">
          <button className="srv-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="srv-btn-save" onClick={() => onConfirm(name)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Log Viewer Modal ──────────────────────────────────────
function LogModal({ tomcatId, serverId, filename, onClose }) {
  const { authFetch } = useAuth();
  const [content, setContent] = useState("Loading…");
  useEffect(() => {
    authFetch(`${SERVERS.tomcatLog(tomcatId, filename)}?serverId=${serverId}`)
      .then(d => setContent(d.content))
      .catch(() => setContent("Failed to load log."));
  }, []);

  return (
    <div className="srv-backdrop" onClick={onClose}>
      <div className="log-modal" onClick={e => e.stopPropagation()}>
        <div className="srv-drawer-header log-modal-header">
          <span>{filename}</span>
          <button onClick={onClose}><img src="/assets/icons/close.svg" style={{ width: 14, filter: "invert(1)" }} alt="close" /></button>
        </div>
        <pre className="log-content">{content}</pre>
      </div>
    </div>
  );
}

// ── Tomcat Card ───────────────────────────────────────────
function TomcatCard({ tc, serverId, onDelete, onControl, onLog, controlling }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tc-card">
      <div className="tc-card-main">
        <div className="tc-card-left">
          <div className="tc-card-name">{tc.name}</div>
          <div className={`tc-status-badge ${tc.running ? "running" : "stopped"}`}>
            {tc.running ? "Running" : "Stopped"}
          </div>
        </div>
        <div className="tc-card-right">
          <button className={`tc-ctrl start`} disabled={tc.running || controlling === tc.instanceId}
            onClick={() => onControl(tc.instanceId, serverId, "start")}>Start</button>
          <button className={`tc-ctrl stop`} disabled={!tc.running || controlling === tc.instanceId}
            onClick={() => onControl(tc.instanceId, serverId, "stop")}>Stop</button>
          <button className="tc-expand" onClick={() => setExpanded(e => !e)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button className="tc-delete" onClick={() => onDelete(tc.instanceId)}>
            <img src="/assets/icons/close.svg" style={{ width: 11 }} alt="delete" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="tc-card-expanded">
          <div className="tc-expanded-cols">
            <div className="tc-expanded-col">
              <div className="tc-col-label">Deployed Apps</div>
              <div className="tc-scroll-list">
                {tc.webapps?.length > 0
                  ? tc.webapps.map(w => <div key={w} className="tc-list-item tc-app-item">{w}</div>)
                  : <div className="tc-list-empty">No apps deployed</div>
                }
              </div>
            </div>
            <div className="tc-expanded-col">
              <div className="tc-col-label">Log Files</div>
              <div className="tc-scroll-list">
                {tc.logFiles?.length > 0
                  ? tc.logFiles.map(f => (
                      <div key={f} className="tc-list-item tc-log-item"
                        onClick={() => onLog(tc.instanceId, serverId, f)}>
                        {f}
                      </div>
                    ))
                  : <div className="tc-list-empty">No log files</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Database Card ─────────────────────────────────────────
function DatabaseCard({ db, onDelete, onRename }) {
  return (
    <div className="db-card">
      <div className="db-card-header">
        <div className="db-card-name">{db.name}</div>
        <div className="db-card-actions">
          <button className="sp-rename-btn" onClick={() => onRename(db.databaseId, db.name)}>Rename</button>
          <button className="sp-icon-btn" onClick={() => onDelete(db.databaseId)}>
            <img src="/assets/icons/close.svg" style={{ width: 11 }} alt="delete" />
          </button>
        </div>
      </div>
      <div className="db-type-badge">{db.type}</div>
      <div className={`tc-status-badge ${db.connected ? "running" : "stopped"}`}>
        {db.connected ? "Connected" : "Unreachable"}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ServersPage() {
  const { authFetch } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const activeServerRef = useRef(null);

  const [servers,    setServers]    = useState([]);
  const [statuses,   setStatuses]   = useState({ servers: [], tomcats: [], databases: [] });
  const [allDbs,     setAllDbs]     = useState([]);
  const [dbStatuses, setDbStatuses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("servers"); // "servers" | "databases"
  const [activeServer, setActiveServer] = useState(null);
  const [drawer,     setDrawer]     = useState(null);
  const [logModal,   setLogModal]   = useState(null);
  const [renaming,   setRenaming]   = useState(null);
  const [controlling, setCtrl]      = useState(null);

  // keep ref in sync so interval doesn't lose current value
  useEffect(() => { activeServerRef.current = activeServer; }, [activeServer]);

  const load = async (preserveActive = true) => {
    try {
      const [srvList, srvStat, tcStat, dbStat, dbList] = await Promise.all([
        authFetch(SERVERS.list),
        authFetch(SERVERS.status),
        authFetch(SERVERS.statusTomcat),
        authFetch(SERVERS.statusDatabases),
        authFetch(SERVERS.databases),
      ]);
      setServers(srvList);
      setStatuses({ servers: srvStat, tomcats: tcStat, databases: dbStat });
      setAllDbs(dbList);
      setDbStatuses(dbStat);

      // only set active server on first load
      if (!preserveActive || activeServerRef.current === null) {
        if (srvList.length > 0) setActiveServer(srvList[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load(false); // first load — let it set active
    const id = setInterval(() => load(true), 30000); // subsequent — preserve active
    return () => clearInterval(id);
  }, []);

  const handleDeleteServer = async (id) => {
    try {
      await authFetch(SERVERS.byId(id), { method: "DELETE" });
      addToast("Server deleted");
      // if deleting active server, reset
      if (activeServerRef.current === id) {
        activeServerRef.current = null;
        setActiveServer(null);
      }
      load(true);
    } catch (e) { addToast(e.message, "error"); }
  };

  const handleDeleteTomcat = async (id) => {
    try {
      await authFetch(SERVERS.tomcatById(id), { method: "DELETE" });
      addToast("Tomcat instance deleted");
      load(true);
    } catch (e) { addToast(e.message, "error"); }
  };

  const handleDeleteDb = async (id) => {
    try {
      await authFetch(SERVERS.databaseById(id), { method: "DELETE" });
      addToast("Database deleted");
      load(true);
    } catch (e) { addToast(e.message, "error"); }
  };

  const handleControl = async (tomcatId, serverId, action) => {
    setCtrl(tomcatId);
    try {
      await authFetch(`${SERVERS.tomcatControl(tomcatId)}?serverId=${serverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      addToast(`Tomcat ${action} executed`);
      load(true);
    } catch (e) { addToast(e.message, "error"); }
    finally { setCtrl(null); }
  };

  const handleRenameConfirm = async (newName) => {
    addToast(`Renamed to: ${newName}`);
    setRenaming(null);
  };

  const currentServer   = servers.find(s => s.id === activeServer);
  const serverSt        = statuses.servers.find(s => s.serverId === activeServer);
  const serverTomcats   = statuses.tomcats.filter(t => t.serverId === activeServer);

  // pair tomcats into rows of 2
  const tomcatPairs = [];
  for (let i = 0; i < serverTomcats.length; i += 2)
    tomcatPairs.push(serverTomcats.slice(i, i + 2));

  // merge db list with statuses
  const enrichedDbs = allDbs.map(db => {
    const st = dbStatuses.find(s => s.databaseId === db.id);
    return { ...db, databaseId: db.id, connected: st?.connected ?? null };
  });

  if (loading) return <div className="sp-loading">Loading servers…</div>;

  return (
    <div className="sp-page">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="sp-header">
        <div>
          <div className="sp-title">Infrastructure</div>
          <div className="sp-sub">{servers.length} server{servers.length !== 1 ? "s" : ""} · {enrichedDbs.length} database{enrichedDbs.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="sp-header-actions">
          {activeTab === "servers" && (
            <button className="sp-add" onClick={() => setDrawer("server")}>+ Add Server</button>
          )}
          {activeTab === "databases" && (
            <button className="sp-add" onClick={() => setDrawer("database")}>+ Add Database</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sp-tabs">
        <button className={`sp-tab ${activeTab === "servers" ? "active" : ""}`}
          onClick={() => setActiveTab("servers")}>
          <img src="/assets/icons/security.svg" alt="" style={{ width: 14, height: 14, filter: "invert(40%)" }} />
          Servers & Tomcat
        </button>
        <button className={`sp-tab ${activeTab === "databases" ? "active" : ""}`}
          onClick={() => setActiveTab("databases")}>
          <img src="/assets/icons/logs.svg" alt="" style={{ width: 14, height: 14, filter: "invert(40%)" }} />
          Databases
        </button>
      </div>

      {/* ── Servers Tab ── */}
      {activeTab === "servers" && (
        <div className="sp-body">
          {/* Server sidebar */}
          <div className="sp-sidebar">
            {servers.length === 0 ? (
              <div className="sp-empty">No servers yet</div>
            ) : (
              servers.map(s => {
                const st = statuses.servers.find(x => x.serverId === s.id);
                return (
                  <div key={s.id}
                    className={`sp-server-item ${activeServer === s.id ? "active" : ""}`}
                    onClick={() => setActiveServer(s.id)}>
                    <div className="sp-server-dot"
                      style={{ background: st?.sshReachable ? "#16a34a" : "#e53e3e" }} />
                    <div className="sp-server-info">
                      <div className="sp-server-name">{s.name}</div>
                      <div className="sp-server-host">{s.host}:{s.port}</div>
                    </div>
                    <button className="sp-icon-btn"
                      onClick={e => { e.stopPropagation(); handleDeleteServer(s.id); }}>
                      <img src="/assets/icons/close.svg" style={{ width: 11 }} alt="delete" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Server content */}
          {currentServer ? (
            <div className="sp-content">
              {/* Status banner */}
              <div className="sp-status-banner">
                <div className="sp-status-left">
                  <div className={`sp-status-pill ${serverSt?.sshReachable ? "up" : "down"}`}>
                    {serverSt?.sshReachable ? "SSH REACHABLE" : "SSH UNREACHABLE"}
                  </div>
                  <div className="sp-server-meta">
                    <span>{currentServer.name}</span>
                    <span className="sp-meta-sep">·</span>
                    <span>{currentServer.host}:{currentServer.port}</span>
                    <span className="sp-meta-sep">·</span>
                    <span>{currentServer.city}</span>
                  </div>
                </div>
                <button className="sp-rename-btn"
                  onClick={() => setRenaming({ type: "server", id: currentServer.id, current: currentServer.name })}>
                  Rename
                </button>
              </div>

              {/* Tomcat section */}
              <div className="sp-section">
                <div className="sp-section-header">
                  <div className="sp-section-title">
                    Tomcat Instances
                    <span className="sp-section-count">{serverTomcats.length}</span>
                  </div>
                  <button className="sp-section-add"
                    onClick={() => setDrawer({ type: "tomcat", serverId: currentServer.id })}>
                    + Add Tomcat
                  </button>
                </div>

                {tomcatPairs.length === 0 ? (
                  <div className="sp-empty-section">No Tomcat instances for this server</div>
                ) : (
                  tomcatPairs.map((pair, i) => (
                    <div key={i} className="tc-row">
                      {pair.map(tc => (
                        <TomcatCard key={tc.instanceId} tc={tc}
                          serverId={currentServer.id}
                          controlling={controlling}
                          onDelete={handleDeleteTomcat}
                          onControl={handleControl}
                          onLog={(tid, sid, f) => setLogModal({ tomcatId: tid, serverId: sid, filename: f })}
                        />
                      ))}
                      {/* fill empty slot if odd number */}
                      {pair.length === 1 && <div className="tc-card tc-card-phantom" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="sp-no-server">Select a server or add one</div>
          )}
        </div>
      )}

      {/* ── Databases Tab ── */}
      {activeTab === "databases" && (
        <div className="sp-db-page">
          {enrichedDbs.length === 0 ? (
            <div className="sp-empty-section sp-empty-centered">No databases registered yet</div>
          ) : (
            <div className="db-grid">
              {enrichedDbs.map(db => (
                <DatabaseCard key={db.databaseId} db={db}
                  onDelete={handleDeleteDb}
                  onRename={(id, name) => setRenaming({ type: "database", id, current: name })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawers */}
      {drawer === "server" && (
        <ServerDrawer onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); load(true); addToast("Server added"); }} />
      )}
      {drawer?.type === "tomcat" && (
        <TomcatDrawer serverId={drawer.serverId} onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); load(true); addToast("Tomcat added"); }} />
      )}
      {drawer === "database" && (
        <DatabaseDrawer onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); load(true); addToast("Database added"); }} />
      )}

      {logModal && (
        <LogModal {...logModal} onClose={() => setLogModal(null)} />
      )}

      {renaming && (
        <RenameModal current={renaming.current}
          onClose={() => setRenaming(null)}
          onConfirm={handleRenameConfirm} />
      )}
    </div>
  );
}