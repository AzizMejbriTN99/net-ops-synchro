import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./css/LoginPage.css";
import api from "../functions/httpClient";
import { setToken } from "../functions/httpClient";
const logo = "/assets/logos/logo.svg";
const billcomLogo = "/assets/logos/billcomConsulting.png";
const eyeOpen = "/assets/icons/eye-open.svg";
const eyeClosed = "/assets/icons/eye-closed.svg";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!user.trim() || !pass.trim()) {
      setError("Please fill in all fields.");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("loading");

    try {
      const response = await api.post("/api/auth/login", {
        username: user,
        password: pass,
      });

      const data = response.data;

      setToken({ accessToken: data.token });
      loginUser({ token: data.token }, { username: data.username, role: data.role });

      setStatus("success");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1400);

    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Invalid credentials.";
      setError(msg);
      setStatus("error");

      setTimeout(() => setStatus("error-done"), 600);
    }
  };

  const isShaking = status === "error";
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const hasError = status === "error" || status === "error-done";

  return (
    <div className="lp">
      <div className="lcard">

        <div className="lbrand">
          <div className="lbrand-inner">
            <img src={logo} alt="NetOps Synchro" />
          </div>
          <div className="lbrand-footer">
            <div className="lbrand-footer-label">Developed by</div>
            <img src={billcomLogo} alt="Billcom Consulting" className="lbrand-footer-logo-img" />
          </div>
        </div>

        <div className="lform">

          {/* Overlay — loading or success */}
          {(isLoading || isSuccess) && (
            <div className="loverlay">
              <svg className="loverlay-ring" viewBox="0 0 120 120">
                {/* Track */}
                <circle cx="60" cy="60" r="50" className="lring-track" />
                {/* Spinning arc */}
                {isLoading && (
                  <circle cx="60" cy="60" r="50" className="lring-spin" />
                )}
                {/* Fill circle on success */}
                {isSuccess && (
                  <circle cx="60" cy="60" r="50" className="lring-success-fill" />
                )}
              </svg>

              {/* Tick */}
              {isSuccess && (
                <svg className="loverlay-tick" viewBox="0 0 52 52">
                  <polyline className="ltick-line" points="8,28 20,40 44,14" />
                </svg>
              )}
            </div>
          )}

          {/* Error banner */}
          {hasError && error && (
            <div className="lerror-banner">
              <span className="lerror-icon">!</span>
              {error}
            </div>
          )}

          <div className="ltitle">Sign In</div>
          <div className="lsub">Access your control panel</div>

          <div className={`lfield ${isShaking ? "lfield-shake" : ""}`}>
            <label>Username</label>
            <input
              type="text"
              placeholder="admin@netops.int"
              value={user}
              onChange={e => { setUser(e.target.value); if (hasError) setStatus("idle"); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              className={hasError ? "linput-error" : ""}
            />
          </div>

          <div className={`lfield ${isShaking ? "lfield-shake" : ""}`}>
            <label>Password</label>
            <div className="lfield-password">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={pass}
                onChange={e => { setPass(e.target.value); if (hasError) setStatus("idle"); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className={hasError ? "linput-error" : ""}
              />
              <button
                type="button"
                className="lpassword-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                <img src={showPassword ? eyeClosed : eyeOpen} alt="" />
              </button>
            </div>
          </div>

          <div className="lforgot-row">
            <button className="lforgot">Forgot password?</button>
          </div>

          <button
            className="lbtn"
            onClick={handleLogin}
            disabled={isLoading || isSuccess}
          >
            Authenticate
          </button>

        </div>
      </div>
    </div>
  );
}