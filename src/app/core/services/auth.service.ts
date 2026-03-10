import { Injectable, signal, computed } from '@angular/core';
import { AuthUser, RolePermissions, PermissionModule, PermissionAction, UserRole } from '../models/permission';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SUPERADMIN_PERMISSIONS: RolePermissions = {
    groups: { view: true, add: true, edit: true, delete: true },
    users: { view: true, add: true, edit: true, delete: true },
    tickets: { view: true, add: true, edit: true, delete: true },
  };

  private readonly GROUPLEADER_PERMISSIONS: RolePermissions = {
    groups: { view: true, add: true, edit: true, delete: true },
    users: { view: true, add: false, edit: false, delete: false },
    tickets: { view: true, add: true, edit: true, delete: true },
  };

  private readonly DEVELOPER_PERMISSIONS: RolePermissions = {
    groups: { view: true, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false },
    tickets: { view: true, add: false, edit: false, delete: false },
  };

  private readonly USER_PERMISSIONS: RolePermissions = {
    groups: { view: false, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false },
    tickets: { view: true, add: true, edit: false, delete: false },
  };

  private readonly USERS: AuthUser[] = [
    {
      id: 1,
      email: 'superadmin@erp.com',
      password: 'Super@2025!',
      fullName: 'Super Administrador',
      role: 'superAdmin',
      permissions: this.SUPERADMIN_PERMISSIONS,
    },
    {
      id: 2,
      email: 'lider@erp.com',
      password: 'Lider@2025!',
      fullName: 'Carlos Mendoza',
      role: 'groupLeader',
      permissions: this.GROUPLEADER_PERMISSIONS,
      groupId: 1,
    },
    {
      id: 3,
      email: 'dev@erp.com',
      password: 'Devel@2025!',
      fullName: 'Ana Garcia',
      role: 'developer',
      permissions: this.DEVELOPER_PERMISSIONS,
      groupId: 1,
    },
    {
      id: 4,
      email: 'usuario@erp.com',
      password: 'User@2025!',
      fullName: 'Usuario Estandar',
      role: 'usuario',
      permissions: this.USER_PERMISSIONS,
    },
  ];

  currentUser = signal<AuthUser | null>(null);

  isLoggedIn = computed(() => this.currentUser() !== null);
  isSuperAdmin = computed(() => this.currentUser()?.role === 'superAdmin');
  isGroupLeader = computed(() => this.currentUser()?.role === 'groupLeader');
  isDeveloper = computed(() => this.currentUser()?.role === 'developer');
  isUsuario = computed(() => this.currentUser()?.role === 'usuario');

  login(email: string, password: string): AuthUser | null {
    const user = this.USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      this.currentUser.set(user);
    }
    return user || null;
  }

  logout(): void {
    this.currentUser.set(null);
  }

  hasPermission(module: PermissionModule, action: PermissionAction): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.permissions[module][action];
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'superAdmin': return 'Super Admin';
      case 'groupLeader': return 'Lider de Grupo';
      case 'developer': return 'Desarrollador';
      case 'usuario': return 'Usuario';
    }
  }

  getCredentialsHint(): string {
    return 'SuperAdmin: superadmin@erp.com / Super@2025! | Lider: lider@erp.com / Lider@2025! | Dev: dev@erp.com / Devel@2025! | Usuario: usuario@erp.com / User@2025!';
  }
}
