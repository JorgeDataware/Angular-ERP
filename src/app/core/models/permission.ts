export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';
export type PermissionModule = 'groups' | 'users' | 'tickets';

export type UserRole = 'superAdmin' | 'groupLeader' | 'developer' | 'usuario';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  groups: ModulePermissions;
  users: ModulePermissions;
  tickets: ModulePermissions;
}

export interface AuthUser {
  id: number;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  permissions: RolePermissions;
  groupId?: number;
}
