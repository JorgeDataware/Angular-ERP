import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of, switchMap } from 'rxjs';
import {
  AuthUser,
  AuthUserBackend,
  RolePermissions,
  PermissionModule,
  PermissionAction,
  hasBackendPermission,
  hasRawPermission,
} from '../models/permission';
import { ApiResponse, LoginResponseData, UserMeResponseData } from '../models/api-response';
import { environment } from '../../../environments/environment';

/** Claves de localStorage para persistencia de sesión */
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  PERMISSIONS: 'auth_permissions',
  EXPIRES_AT: 'auth_expires_at',
  USER: 'auth_user',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiGatewayUrl;

  // =====================================================================
  // DATOS LEGACY HARDCODED (preservados — NO eliminar)
  // =====================================================================
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

  // =====================================================================
  // ESTADO REACTIVO
  // =====================================================================

  /** Usuario autenticado actual (formato backend) */
  currentUser = signal<AuthUserBackend | null>(this._loadUserFromStorage());

  /** Permisos del usuario como string[] del backend */
  permissions = signal<string[]>(this._loadPermissionsFromStorage());

  /** Indica si hay un usuario autenticado con token válido */
  isLoggedIn = computed(() => {
    const user = this.currentUser();
    const token = this.getToken();
    if (!user || !token) return false;
    // Verificar que el token no haya expirado
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (expiresAt && new Date(expiresAt) < new Date()) {
      this._clearStorage();
      this.currentUser.set(null);
      this.permissions.set([]);
      return false;
    }
    return true;
  });

  /** Nombre completo del usuario para mostrar en UI */
  fullName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
  });

  // =====================================================================
  // MÉTODOS DE AUTENTICACIÓN (HTTP real al API Gateway)
  // =====================================================================

  /**
   * Login contra el API Gateway: POST /auth/login
   * 1. Envía email y password
   * 2. Recibe { token, expiresAt, permissions[] }
   * 3. Almacena token y permisos en localStorage
   * 4. Llama GET /users/me para obtener perfil del usuario
   * 5. Actualiza signals reactivos
   */
  login(email: string, password: string): Observable<AuthUserBackend> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${this.baseUrl}/auth/login`, { email, password })
      .pipe(
        switchMap((response) => {
          const loginData = response.data[0];
          if (!loginData) {
            throw new Error('Respuesta de login vacía');
          }

          // Almacenar token y permisos
          localStorage.setItem(STORAGE_KEYS.TOKEN, loginData.token);
          localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(loginData.permissions));
          localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, loginData.expiresAt);

          // Actualizar signal de permisos inmediatamente
          this.permissions.set(loginData.permissions);

          // Obtener perfil del usuario con GET /users/me
          return this._fetchUserProfile();
        })
      );
  }

  /**
   * Logout contra el API Gateway: POST /auth/logout
   * Limpia token, permisos y datos de usuario del localStorage y signals.
   */
  logout(): Observable<void> {
    const token = this.getToken();

    // Limpiar estado local independientemente de si la llamada HTTP tiene éxito
    const clearState = () => {
      this._clearStorage();
      this.currentUser.set(null);
      this.permissions.set([]);
    };

    if (!token) {
      clearState();
      return of(void 0);
    }

    return this.http
      .post<ApiResponse>(`${this.baseUrl}/auth/logout`, {})
      .pipe(
        tap(() => clearState()),
        map(() => void 0),
        catchError(() => {
          // Incluso si el backend falla, limpiar estado local
          clearState();
          return of(void 0);
        })
      );
  }

  // =====================================================================
  // VERIFICACIÓN DE PERMISOS (adaptada al formato backend)
  // =====================================================================

  /**
   * Verifica si el usuario tiene un permiso dado, usando el formato
   * frontend (module, action) que se traduce a string backend.
   * Ejemplo: hasPermission('groups', 'view') → busca 'canRead_Groups'
   */
  hasPermission(module: PermissionModule, action: PermissionAction): boolean {
    const perms = this.permissions();
    if (!perms || perms.length === 0) return false;
    return hasBackendPermission(perms, module, action);
  }

  /**
   * Verifica un permiso backend directamente por su string.
   * Útil para permisos especiales: 'canAssign_Tickets', 'canUpdateStatus_Tickets'
   */
  hasRawPermission(permission: string): boolean {
    const perms = this.permissions();
    if (!perms || perms.length === 0) return false;
    return hasRawPermission(perms, permission);
  }

  // =====================================================================
  // TOKEN Y STORAGE
  // =====================================================================

  /** Obtiene el JWT token almacenado */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /** Verifica si el token existe y no ha expirado */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (expiresAt && new Date(expiresAt) < new Date()) return false;
    return true;
  }

  /**
   * Restaura la sesión desde localStorage al inicializar la app.
   * Si hay token válido y datos de usuario, los carga en los signals.
   * Si el token expiró, limpia todo.
   */
  restoreSession(): void {
    if (!this.isTokenValid()) {
      this._clearStorage();
      this.currentUser.set(null);
      this.permissions.set([]);
      return;
    }
    // Los signals ya se cargan en el constructor via _loadUserFromStorage/_loadPermissionsFromStorage
  }

  // =====================================================================
  // LEGACY (preservado para compatibilidad — NO eliminar)
  // =====================================================================

  getCredentialsHint(): string {
    return 'Usuario 1: superadmin@erp.com / Super@2025! | Usuario 2: lider@erp.com / Lider@2025! | Usuario 3: dev@erp.com / Devel@2025! | Usuario 4: usuario@erp.com / User@2025!';
  }

  // =====================================================================
  // MÉTODOS PRIVADOS
  // =====================================================================

  /** Obtiene el perfil del usuario autenticado desde GET /users/me */
  private _fetchUserProfile(): Observable<AuthUserBackend> {
    return this.http
      .get<ApiResponse<UserMeResponseData>>(`${this.baseUrl}/users/me`)
      .pipe(
        map((response) => {
          const userData = response.data[0];
          if (!userData) {
            throw new Error('Perfil de usuario vacío');
          }

          const user: AuthUserBackend = {
            id: userData.id,
            userName: userData.userName,
            firstName: userData.firstName,
            middleName: userData.middleName,
            lastName: userData.lastName,
            email: userData.email,
            permissions: this.permissions(),
          };

          // Persistir y actualizar signal
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          this.currentUser.set(user);

          return user;
        })
      );
  }

  /** Carga el usuario desde localStorage (para restaurar sesión) */
  private _loadUserFromStorage(): AuthUserBackend | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /** Carga los permisos desde localStorage (para restaurar sesión) */
  private _loadPermissionsFromStorage(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /** Limpia todos los datos de autenticación del localStorage */
  private _clearStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}
