import { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { adminRoutes } from "../utilities/routes";
import NotificationBell from "../components/NotificationBell";
import Clock from "../components/general/Clock";
import "./css/Dashboard.css";

const logo = "/assets/logos/logo-min.svg";
const logoIcon = "/assets/logos/logo-icon.svg";

const userMenuItems = [
  {
    id: "signout",
    label: "Sign Out",
    icon: "/assets/icons/sign-out.svg",
    danger: true,
  },
];

export default function Dashboard() {
  const { logoutUser, userObj } = useAuth();
  const [active, setActive] = useState(adminRoutes[0].id);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const formatRole = r => {
    if (!r) return "";
    const clean = r.replace("ROLE_", "");
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  };

  const ActivePage = adminRoutes.find(r => r.id === active)?.component;
  const initials = userObj?.username
    ? userObj.username.slice(0, 2).toUpperCase()
    : "AD";

  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMenuItem = (item) => {
    setMenuOpen(false);
    if (item.id === "signout") logoutUser();
  };

  return (
    <div
      className={`app ${collapsed ? "sb-collapsed" : ""}`}
      style={{ "--sb-width": collapsed ? "80px" : "240px" }}
    >

      <aside className="sb">

        <button className="sb-toggle" onClick={() => setCollapsed(c => !c)}>
          <img
            src={collapsed ? "/assets/icons/expand.svg" : "/assets/icons/collapse.svg"}
            alt={collapsed ? "Expand" : "Collapse"}
            className="sb-toggle-icon"
          />
        </button>

        <div className="sb-logo">
          {collapsed
            ? <img src={logoIcon} alt="NetOps" className="sb-logo-icon" />
            : <img src={logo} alt="NetOps Synchro" className="sb-logo-full" />
          }
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

        <div className="sb-ft" ref={menuRef}>

          {menuOpen && (
            <div className="av-menu">
              <div className="av-menu-header">
                <div className="av-menu-name">{userObj?.username || "Admin"}</div>
                <div className="av-menu-role">{formatRole(userObj?.role) || "Admin"}</div>
              </div>
              <div className="av-menu-items">
                {userMenuItems.map(item => (
                  <button
                    key={item.id}
                    className={`av-menu-item ${item.danger ? "danger" : ""}`}
                    onClick={() => handleMenuItem(item)}
                  >
                    <img src={item.icon} alt="" className="av-menu-icon" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="av-btn"
            onClick={() => setMenuOpen(o => !o)}
            title={collapsed ? (userObj?.username || "Admin") : ""}
          >
            <div className="av">{initials}</div>
          </button>

          {!collapsed && (
            <>
              <div className="av-info" onClick={() => setMenuOpen(o => !o)} style={{ cursor: "pointer" }}>
                <div className="av-n">{userObj?.username || "Admin"}</div>
                <div className="av-r">{formatRole(userObj?.role) || "Admin"}</div>
              </div>
              <button className="sout" onClick={logoutUser} title="Sign out">
                <img src="/assets/icons/sign-out.svg" alt="Sign out" className="sout-icon" />
              </button>
            </>
          )}

        </div>

      </aside>

      <div className="main">
        <div className="tb">
          <div className="tb-ttl">
            {adminRoutes.find(r => r.id === active)?.label}
          </div>
          <div className="tb-right">
            <NotificationBell />
            <div className="tb-divider" />
            <Clock />
          </div>
        </div>

        <div className="scr">
          {ActivePage && <ActivePage />}
        </div>
      </div>

    </div>
  );
}