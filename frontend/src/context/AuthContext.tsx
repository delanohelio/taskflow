import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/types/task";
import { fetchMe, loginUser as apiLogin } from "@/services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("taskflow_token"));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (token) {
        const currentUser = await fetchMe();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch user context", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    localStorage.setItem("taskflow_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("taskflow_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
