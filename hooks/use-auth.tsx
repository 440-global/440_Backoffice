"use client"

import { deleteCrossSubdomainCookie, setCrossSubdomainCookie } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react"

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: boolean;
  roleId: number;
  permissions: string[];
};

type AuthData = {
  user: Omit<User, "role" | "permissions"> | null;
  role: { id: number; key: string; name: string };
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

  const clearSession = () => {
    deleteCrossSubdomainCookie("admin_token");
    deleteCrossSubdomainCookie("admin_refresh_token");
    localStorage.removeItem("admin");
  };
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("admin");
      if (!storedUser) return;
  
      const parsed = JSON.parse(storedUser) as Partial<User>;
  
      // Sessions saved before permissions existed (or any malformed entry) can't be trusted:
      // clear them so the person signs in again and gets a fresh permission list.
      if (!parsed?.role || !Array.isArray(parsed.permissions)) {
        clearSession();
        return;
      }
  
      setUser(parsed as User);
      setAuthenticated(true);
    } catch (error) {
      console.error("Error parsing user JSON:", error);
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticate = (data: AuthData) => {
    const userWithRole: User | null = data.user
    ? { ...data.user, role: data.role.key, permissions: data.permissions }
      : null;
  
    setUser(userWithRole);
    if (userWithRole) {
      localStorage.setItem("admin", JSON.stringify(userWithRole));
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
    clearSession();
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, authenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;