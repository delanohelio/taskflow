import { useEffect, useState, useCallback } from "react";
import * as api from "@/services/api";

export function useAuth() {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth configuration on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const config = await api.fetchAuthConfig();
        if (!config.require_password) {
          setUnlocked(true);
        } else {
          // If password is required, check if we already have it in localStorage
          const savedPwd = localStorage.getItem("taskflow_page_pwd");
          if (savedPwd) {
            const res = await api.verifyPagePassword(savedPwd);
            if (res.valid) {
              setUnlocked(true);
            } else {
              // Stored password is no longer valid
              localStorage.removeItem("taskflow_page_pwd");
            }
          }
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await api.verifyPagePassword(password);
      if (res.valid) {
        localStorage.setItem("taskflow_page_pwd", password);
        setUnlocked(true);
        return true;
      } else {
        setError("Senha incorreta. Tente novamente.");
        return false;
      }
    } catch (err) {
      setError("Erro ao verificar senha.");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("taskflow_page_pwd");
    setUnlocked(false);
    window.location.reload();
  }, []);

  return {
    unlocked,
    loading,
    error,
    login,
    logout,
  };
}
