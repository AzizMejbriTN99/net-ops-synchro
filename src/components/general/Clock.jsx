import { useState, useEffect } from "react";

export default function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tb-time">{t.toUTCString().slice(17, 25)} UTC</span>;
}