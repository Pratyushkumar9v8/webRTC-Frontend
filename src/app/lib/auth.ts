export type AuthUser = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
};

const AUTH_USER_KEY = "nexus.auth.user";

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getInitials(nameOrEmail?: string) {
  const value = nameOrEmail?.trim();
  if (!value) {
    return "U";
  }

  const words = value.includes("@") ? [value.split("@")[0]] : value.split(/\s+/);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "U";
}
