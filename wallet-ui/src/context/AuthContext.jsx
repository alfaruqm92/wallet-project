import { createContext, useContext, useState, useCallback } from "react";
import client, { extractErrorMessage } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem("wallet_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem("wallet_token"));

  const persistSession = useCallback((nextUser, nextToken) => {
    sessionStorage.setItem("wallet_user", JSON.stringify(nextUser));
    sessionStorage.setItem("wallet_token", nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const register = useCallback(
    async ({ username, email, password, passwordConfirmation }) => {
      try {
        const { data } = await client.post("/auth/register", {
          username,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });
        persistSession(data.data.user, data.data.token);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractErrorMessage(error, "Registrasi gagal.") };
      }
    },
    [persistSession]
  );

  const login = useCallback(
    async ({ login: loginId, password }) => {
      try {
        const { data } = await client.post("/auth/login", { login: loginId, password });
        persistSession(data.data.user, data.data.token);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractErrorMessage(error, "Login gagal.") };
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await client.post("/auth/logout");
    } catch {
      // Tetap bersihkan sesi lokal walaupun request logout gagal (misal token sudah expired).
    }
    sessionStorage.removeItem("wallet_user");
    sessionStorage.removeItem("wallet_token");
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
