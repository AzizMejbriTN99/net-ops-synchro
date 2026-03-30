import { useEffect } from "react";
import "../css/Toast.css";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <img src={`/assets/icons/${type === "success" ? "task-completed" : "alerts"}.svg`} alt="" className="toast-icon" />
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>
        <img src="/assets/icons/close.svg" alt="close" />
      </button>
    </div>
  );
}