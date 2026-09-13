import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Field from "../components/Field";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    login: "",
    username: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    const result =
      mode === "login"
        ? await login({ login: form.login, password: form.password })
        : await register({
            username: form.username,
            email: form.email,
            password: form.password,
            passwordConfirmation: form.passwordConfirmation,
          });

    setLoading(false);

    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">I</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>iPay</span>
        </div>

        <h1 className="auth-title">{mode === "login" ? "Masuk ke akunmu" : "Buat akun baru"}</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "Kelola saldo dan transaksimu." : "Mulai kelola dompet digitalmu."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Daftar
          </button>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "login" ? (
            <>
              <Field
                id="login-id"
                label="Email atau username"
                type="text"
                value={form.login}
                onChange={update("login")}
                required
                disabled={loading}
              />
              <Field
                id="login-password"
                label="Password"
                type="password"
                value={form.password}
                onChange={update("password")}
                required
                disabled={loading}
              />
            </>
          ) : (
            <>
              <Field
                id="reg-username"
                label="Username"
                type="text"
                value={form.username}
                onChange={update("username")}
                required
                disabled={loading}
              />
              <Field
                id="reg-email"
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                disabled={loading}
              />
              <Field
                id="reg-password"
                label="Password (min. 8 karakter)"
                type="password"
                value={form.password}
                onChange={update("password")}
                required
                minLength={8}
                disabled={loading}
              />
              <Field
                id="reg-password-confirmation"
                label="Konfirmasi password"
                type="password"
                value={form.passwordConfirmation}
                onChange={update("passwordConfirmation")}
                required
                disabled={loading}
              />
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading && <span className="spinner" />}
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>
      </div>
    </div>
  );
}
