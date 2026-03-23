import { useState } from "react";
import styles from "./Login.module.css";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

const handleSubmit = async () => {
  if (!username.trim() || !password.trim()) {
    setError("Please enter both username and password.");
    triggerShake();
    return;
  }
  setError("");
  setLoading(true);

  try {
    // const res = await fetch("/login", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ username: username.trim(), password }),
    // });

    // const data = await res.json();

    // if (!res.ok) {
    //   setError(data.message || "Invalid username or password.");
    //   triggerShake();
    // } else {
      onLogin(1); // pass the id straight up
    // }
  } catch (err) {
    setError("Server unreachable. Please try again.");
    triggerShake();
  } finally {
    setLoading(false);
  }
};

  return (
    <div className={styles.loginRoot}>
      <div className={`${styles.card} ${shake ? styles.shake : ""}`}>

        {/* ── Header ── */}
        <div className={styles.cardHeader}>
          <svg className={styles.dropIcon} viewBox="0 0 38 38" fill="none">
            <path
              d="M19 4 C19 4 6 18 6 25.5 A13 13 0 0 0 32 25.5 C32 18 19 4 19 4Z"
              fill="var(--color-primary)"
            />
            <ellipse
              cx="14" cy="24" rx="3" ry="5"
              fill="rgba(255,255,255,0.18)"
              transform="rotate(-20 14 24)"
            />
          </svg>
          <div>
            <div className={styles.brandText}>TULIP WATER PLANT</div>
            <div className={styles.brandSub}>Management System</div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.cardBody}>
          <div className={styles.sectionTitle}>Sign In</div>
          <div className={styles.sectionSub}>Enter your credentials to continue</div>

          {error && (
            <div className={styles.errorMsg}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Username */}
          <div className={styles.field}>
            <label htmlFor="login-username">Username</label>
            <div className={styles.inputWrap}>
              <svg className={styles.fieldIcon} width="15" height="15"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                id="login-username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.inputWrap}>
              <svg className={styles.fieldIcon} width="15" height="15"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                className={styles.pwdToggle}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8 a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8 a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <><div className={styles.spinner} /> Signing In...</>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* ── Footer ── */}
        <div className={styles.cardFooter}>
              <span className={styles.footerSeparator}>Developed By: </span>
           <a href="https://github.com/muzamilalisuleman" target="_blank" rel="noopener noreferrer">Muzamil Ali</a>
      </div>

        </div>
      </div>
  );
};

export default Login;