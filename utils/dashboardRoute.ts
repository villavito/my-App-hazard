import type { UserRole } from "../services/authService";

/** The screen each kind of account lands on after signing in. */
export function dashboardRouteFor(role: UserRole["role"]) {
  if (role === "super_admin") return "/admin/super-admin" as const;
  if (role === "admin") return "/admin/dashboard" as const;
  // Not "/(tabs)": that resolves to "/", the same address as the Get Started
  // screen, so refreshing the browser on the dashboard showed Get Started.
  return "/home" as const;
}
