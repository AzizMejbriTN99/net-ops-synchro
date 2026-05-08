import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { NOTIFICATIONS } from "../services/api";
import "./css/NotificationBell.css";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef();
  const navigate = useNavigate();

  const loadCount = async () => {
    try {
      const data = await authFetch(NOTIFICATIONS.unreadCount);
      setUnread(data.count);
    } catch (e) { console.error(e); }
  };

  const loadAll = async () => {
    try {
      const data = await authFetch(NOTIFICATIONS.all);
      setNotifications(data);
    } catch (e) { console.error(e); }
  };

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open) await loadAll();
  };

  const handleMarkAllRead = async () => {
    try {
      await authFetch(NOTIFICATIONS.markAllRead, { method: "PATCH" });
      setUnread(0);
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeIcon = type => ({
    USER_CREATED: "✦",
    USER_UPDATED: "✎",
    USER_DELETED: "✕",
    USER_TOGGLED: "⇄",
    TICKET_ASSIGNED: "◎",
    TICKET_UPDATED: "✎",
    TICKET_RESOLVED: "✔",
    TASK_ASSIGNED: "◎",
    TASK_UPDATED: "✎",
    TASK_COMPLETED: "✔",
  }[type] || "•");

  const typeClass = type => ({
    USER_CREATED: "nt-created",
    USER_UPDATED: "nt-updated",
    USER_DELETED: "nt-deleted",
    USER_TOGGLED: "nt-toggled",
    TICKET_ASSIGNED: "nt-created",
    TICKET_UPDATED: "nt-updated",
    TICKET_RESOLVED: "nt-created",
    TASK_ASSIGNED: "nt-created",
    TASK_UPDATED: "nt-updated",
    TASK_COMPLETED: "nt-created",
  }[type] || "");

  const timeAgo = iso => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="nbell-wrap" ref={ref}>
      <button className="nbell-btn" onClick={handleOpen} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="nbell-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="ndrop">
          <div className="ndrop-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button className="ndrop-mark" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="ndrop-list">
            {notifications.length === 0 ? (
              <div className="ndrop-empty">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`nitem ${n.read ? "" : "nitem-unread"}`}
                  onClick={() => {

                    const demandeId = n.demandeId || n.relatedId;

                    if (demandeId) {
                      navigate(`/consultant/demandes?search=${demandeId}`);
                      setOpen(false);
                    }
                  }}
                >
                  <div className={`nitem-icon ${typeClass(n.type)}`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="nitem-body">
                    <div className="nitem-msg">{n.message}</div>
                    <div className="nitem-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <div className="nitem-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}