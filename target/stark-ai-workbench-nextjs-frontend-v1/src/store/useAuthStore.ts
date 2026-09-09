import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppRole } from "@/utils/get-user-role";

interface AuthState {
  user: any | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
      login: async (email, password) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Login failed");
        }

        const user = result.data.user;
        const role = result.data.role;

        set({
          user,
          role,
          isAuthenticated: true,
        });

        // Return the redirect path so the calling component can handle navigation
        if (role === "superadmin") return "/superadmin-portal";
        if (role === "admin") return "/admin-portal";
        if (role === "member") return "/members-portal";
        return "/";
      },
      logout: async () => {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Logout failed");
        }

        set({
          user: null,
          role: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-store",
    }
  )
);
