export const Roles = {
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
  // Back-compat (deprecated): treat ORDER_MANAGER as VIEWER in permissions
  ORDER_MANAGER: "ORDER_MANAGER",
} as const;

export const AdminRoles = [Roles.ADMIN];
export const EditorRoles = [Roles.ADMIN, Roles.EDITOR];
export const ViewerRoles = [Roles.ADMIN, Roles.EDITOR, Roles.VIEWER, Roles.ORDER_MANAGER];
export const OrderManagerRoles = [Roles.ADMIN, Roles.ORDER_MANAGER, Roles.VIEWER];
export const ContentRoles = [Roles.ADMIN, Roles.EDITOR];
