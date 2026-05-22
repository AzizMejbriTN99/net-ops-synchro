import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { decryptData, encryptData } from "../utilities/crypto";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const SESSION_DURATION = 30 * 60 * 1000;
  const timeoutRef = useRef(null);

  const userObj = useMemo(() => {
    if (!user) return null;
    if (typeof user !== "string") return user;
    try {
      return decryptData(user);
    } catch (e) {
      console.error("AuthContext: decrypt user failed", e);
      return null;
    }
  }, [user]);

  const isAdminTickets = useMemo(() => {
    if (!userObj) return false;

    if (userObj.isAdminTickets === true) return true;

    const roles = Array.isArray(userObj.roles) ? userObj.roles : [];
    return roles.some((r) => r?.description === "Gestion ticket");
  }, [userObj]);

  const canProcessTickets = useMemo(() => {
    if (!userObj) return false;
    if (userObj.canProcessTickets === true) return true;
    return false;
  }, [userObj]);

  useEffect(() => {
    const storedSession = localStorage.getItem("session");
    const storedUser = localStorage.getItem("user");
    const storedRoles = localStorage.getItem("userRoles");

    if (storedSession) setSession(JSON.parse(storedSession));
    if (storedUser) setUser(storedUser);
    if (storedRoles) setUserRoles(storedRoles);

    setLoading(false);
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const resetTimeout = () => {
      if (!session) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        localStorage.removeItem("session");
        localStorage.removeItem("user");
        localStorage.removeItem("userRoles");

        setSession(null);
        setUser(null);
        setUserRoles(null);

        navigate("/login", { replace: true });
      }, SESSION_DURATION);
    };

    resetTimeout();

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimeout));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [session, navigate]);

  const loginUser = (sessionData, userData) => {
    const newSession = { token: sessionData.token };
    setSession(newSession);
    localStorage.setItem("session", JSON.stringify(newSession));

    if (userData) {
      // store encrypted user
      const encryptedUser = encryptData(userData);
      setUser(encryptedUser);
      localStorage.setItem("user", encryptedUser);

      // build role maps (encrypted)
      const roleMap = {};
      const actionIdsMap = {};

      if (Array.isArray(userData.roles)) {
        userData.roles.forEach((role) => {
          const key = role.description || role.name || role.roleName;
          if (!key) return;

          roleMap[key] = { roleId: role.roleId, events: [] };
          actionIdsMap[key] = role.roleId;
        });
      }

      const encryptedRoles = encryptData(roleMap);
      setUserRoles(encryptedRoles);
      localStorage.setItem("userRoles", encryptedRoles);

    }
  };

  const logoutUser = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("user");
    localStorage.removeItem("userRoles");

    setSession(null);
    setUser(null);
    setUserRoles(null);

    navigate("/login", { replace: true });
  };

  const authFetch = async (url, options = {}) => {
    const { parseAs, ...fetchOptions } = options;

    if (!fetchOptions.headers) fetchOptions.headers = {};

    if (session?.token) {
      fetchOptions.headers["Authorization"] = `Bearer ${session.token}`;
    }

    const res = await fetch(url, fetchOptions);

    if (res.status === 401) {
      localStorage.removeItem("session");
      localStorage.removeItem("user");
      localStorage.removeItem("userRoles");

      setSession(null);
      setUser(null);
      setUserRoles(null);

      navigate("/login", { replace: true });
      return;
    }

    if (!res.ok) {
      let errBody = null;

      try {
        const ct = res.headers.get("content-type") || "";

        errBody = ct.includes("application/json")
          ? await res.json()
          : await res.text();

      } catch {
        errBody = null;
      }

      const msg =
        typeof errBody === "string"
          ? errBody
          : errBody?.message ||
          errBody?.rootMessage ||
          `HTTP ${res.status}`;

      throw new Error(msg);
    }

    if (parseAs === "blob") {
      return await res.blob();
    }

    if (parseAs === "text") {
      return await res.text();
    }

    // FIX IS HERE
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    }

    return null;
  };



  return (
    <AuthContext.Provider
      value={{
        session,
        loginUser,
        logoutUser,
        user,
        userRoles,
        userObj,
        isAdminTickets,
        canProcessTickets,
        authFetch,
        loading,
        setUserRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
