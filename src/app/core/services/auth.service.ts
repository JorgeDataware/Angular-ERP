import { Injectable, signal, computed } from '@angular/core';
import { AuthUser, RolePermissions, PermissionModule, PermissionAction } from '../models/permission';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USERS: AuthUser[] = [
    {
      id: 1,
      email: 'superadmin@erp.com',
      password: 'Super@2025!',
      fullName: 'Super Administrador',
      permissions: {
        groups: { view: true, add: true, edit: true, delete: true },
        users: { view: true, add: true, edit: true, delete: true },
        tickets: { view: true, add: true, edit: true, delete: true },
      },
    },
    {
      id: 2,
      email: 'lider@erp.com',
      password: 'Lider@2025!',
      fullName: 'Carlos Mendoza',
      permissions: {
        groups: { view: true, add: true, edit: true, delete: true },
        users: { view: true, add: false, edit: false, delete: false },
        tickets: { view: true, add: true, edit: true, delete: true },
      },
      groupId: 1,
    },
    {
      id: 3,
      email: 'dev@erp.com',
      password: 'Devel@2025!',
      fullName: 'Ana Garcia',
      permissions: {
        groups: { view: true, add: false, edit: false, delete: false },
        users: { view: false, add: false, edit: false, delete: false },
        tickets: { view: true, add: false, edit: false, delete: false },
      },
      groupId: 1,
    },
    {
      id: 4,
      email: 'usuario@erp.com',
      password: 'User@2025!',
      fullName: 'Usuario Estandar',
      permissions: {
        groups: { view: false, add: false, edit: false, delete: false },
        users: { view: false, add: false, edit: false, delete: false },
        tickets: { view: true, add: true, edit: false, delete: false },
      },
    },
  ];

  currentUser = signal<AuthUser | null>(null);

  isLoggedIn = computed(() => this.currentUser() !== null);

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

  getCredentialsHint(): string {
    return 'Usuario 1: superadmin@erp.com / Super@2025! | Usuario 2: lider@erp.com / Lider@2025! | Usuario 3: dev@erp.com / Devel@2025! | Usuario 4: usuario@erp.com / User@2025!';
  }
}
