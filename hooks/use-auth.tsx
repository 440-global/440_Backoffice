"use client"

import { deleteCrossSubdomainCookie, setCrossSubdomainCookie } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react"

type User = {
  id: number,
  name: string,
  email: string,
  role: string,
  status: boolean,
  roleId: number
};

type AuthData = {
  user: User | null;
  role: {
    id: number;
    key: string;
    name: string;
  };
  isSuper: boolean;
  permissions: string[];
  token?: string;
  refresh?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  authenticate: (data: AuthData) => void;
  authenticated: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("admin");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user JSON:", error);
    }
  }, []);

  const authenticate = (data: AuthData) => {
    setUser(data.user);
    if (data.user) {
      localStorage.setItem("admin", JSON.stringify(data.user));
    }
    setAuthenticated(true);
    if (data.token) {
      setCrossSubdomainCookie("admin_token", data.token, 1);
    }
    if (data.refresh) {
      setCrossSubdomainCookie("admin_refresh_token", data.refresh, 7);
    }
  };

  const logout = () => {
    deleteCrossSubdomainCookie("admin_token");
    deleteCrossSubdomainCookie("admin_refresh_token");
    localStorage.removeItem("admin");
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, authenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;