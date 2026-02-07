export type Domain =
  | "orders"
  | "products"
  | "categories"
  | "media"
  | "settings"
  | "home-builder"
  | "catalog-pages"
  | "activity"
  | "dashboard";

export type Permission =
  | "orders:read"
  | "orders:update-status"
  | "orders:export"
  | "products:read"
  | "products:create"
  | "products:update"
  | "products:delete"
  | "products:import-export"
  | "categories:read"
  | "categories:create"
  | "categories:update"
  | "categories:delete"
  | "categories:reorder"
  | "categories:restore"
  | "media:read"
  | "media:upload"
  | "media:update"
  | "media:delete"
  | "media:restore"
  | "settings:read"
  | "settings:update"
  | "home-builder:read"
  | "home-builder:update"
  | "home-builder:publish"
  | "catalog-pages:read"
  | "catalog-pages:update"
  | "catalog-pages:publish"
  | "activity:read"
  | "dashboard:read";

export type AppRole = "ADMIN" | "EDITOR" | "VIEWER";

export function normalizeRoleName(roleName: string | undefined | null): AppRole {
  if (roleName === "ADMIN") return "ADMIN";
  if (roleName === "EDITOR") return "EDITOR";
  // Back-compat: ORDER_MANAGER becomes VIEWER (read-only)
  return "VIEWER";
}

const VIEWER_PERMS: Permission[] = [
  "dashboard:read",
  "activity:read",
  "orders:read",
  "products:read",
  "categories:read",
  "media:read",
  "home-builder:read",
  "catalog-pages:read",
];

const EDITOR_PERMS: Permission[] = [
  ...VIEWER_PERMS,
  "orders:update-status",
  "orders:export",
  "products:create",
  "products:update",
  "products:import-export",
  "categories:create",
  "categories:update",
  "categories:reorder",
  "categories:restore",
  "media:upload",
  "media:update",
  "media:restore",
  "home-builder:update",
  "catalog-pages:update",
  // NOTE: publish + deletes + settings are admin-only by default
];

const ADMIN_PERMS: Permission[] = [
  ...EDITOR_PERMS,
  "products:delete",
  "categories:delete",
  "media:delete",
  "settings:read",
  "settings:update",
  "home-builder:publish",
  "catalog-pages:publish",
];

const ROLE_PERMISSIONS: Record<AppRole, Set<Permission>> = {
  VIEWER: new Set(VIEWER_PERMS),
  EDITOR: new Set(EDITOR_PERMS),
  ADMIN: new Set(ADMIN_PERMS),
};

export type PermissionUserLike = { role?: { name?: string | null } | null };

export function hasPermission(user: PermissionUserLike, permission: Permission) {
  const role = normalizeRoleName(user.role?.name ?? null);
  return ROLE_PERMISSIONS[role].has(permission);
}

export function hasAnyPermission(user: PermissionUserLike, permissions: Permission[]) {
  return permissions.some((p) => hasPermission(user, p));
}

