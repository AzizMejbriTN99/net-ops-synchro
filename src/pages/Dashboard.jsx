import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { adminRoutes } from "../utilities/routes";
import NotificationBell from "../components/NotificationBell";
import "./css/Dashboard.css";

const logo = "/assets/logos/logo.svg";

export default function Dashboard() {
  const { logoutUser, userObj } = useAuth();
  const [active, setActive] = useState(adminRoutes[0].id);
  const [collapsed, setCollapsed] = useState(false);

  const ActivePage = adminRoutes.find(r => r.id === active)?.component;
  const initials = userObj?.username
    ? userObj.username.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className={`app ${collapsed ? "sb-collapsed" : ""}`}>

      <aside className="sb">
        <div className="sb-logo">
          <img src={logo} alt="NetOps Synchro" className={collapsed ? "sb-logo-icon" : "sb-logo-full"} />
        </div>

        <nav className="sb-nav">
          {adminRoutes.map(r => (
            <button
              key={r.id}
              className={`ni ${active === r.id ? "a" : ""}`}
              onClick={() => setActive(r.id)}
              title={collapsed ? r.label : ""}
            >
              <img src={r.icon} alt="" className="ni-icon" />
              {!collapsed && <span>{r.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sb-ft">
          {!collapsed && (
            <>
              <div className="av">{initials}</div>
              <div className="av-info">
                <div className="av-n">{userObj?.username || "Admin"}</div>
                <div className="av-r">{userObj?.role || "ADMIN"}</div>
              </div>
            </>
          )}
          <button className="sout" onClick={logoutUser} title="Sign out">
            <img src="/assets/icons/sign-out.svg" alt="Sign out" className="sout-icon" />
          </button>
        </div>

        <button className="sb-toggle" onClick={() => setCollapsed(c => !c)}>
          <img
            src={collapsed ? "/assets/icons/expand.svg" : "/assets/icons/collapse.svg"}
            alt={collapsed ? "Expand" : "Collapse"}
            className="sb-toggle-icon"
          />
        </button>
      </aside>

      <div className="main">
        <div className="tb">
          <div className="tb-ttl">
            {adminRoutes.find(r => r.id === active)?.label}
          </div>
          <div className="tb-right">
            <NotificationBell />
            <div className="tb-divider"/>
            <div className="tb-user">
              <div className="av sm">{initials}</div>
              <span>{userObj?.username || "Admin"}</span>
            </div>
          </div>
        </div>

        <div className="scr">
          {ActivePage && <ActivePage />}
        </div>
      </div>

    </div>
  );
}