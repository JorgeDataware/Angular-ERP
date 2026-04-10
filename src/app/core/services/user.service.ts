import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { User } from '../models/user';
import {
  UserBackend,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
  UpdatePermissionsPayload,
  DeactivateUserPayload,
  PermissionDefinition,
  RegisterUserPayload,
} from '../models/user';
import { ApiResponse } from '../models/api-response';
import { RolePermissions } from '../models/permission';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiGatewayUrl;

  // =====================================================================
  // ESTADO REACTIVO
  // =====================================================================

  /** Lista de usuarios del backend (actualizada tras cada operación) */
  users = signal<UserBackend[]>([]);

  /** Lista de definiciones de permisos disponibles en el sistema */
  availablePermissions = signal<PermissionDefinition[]>([]);

  /** Indicador de carga */
  loading = signal(false);

  // =====================================================================
  // DATOS LEGACY HARDCODED (preservados — NO eliminar)
  // =====================================================================
  private readonly LEGACY_USERS: User[] = [
    { id: 1, username: 'cmendoza', fullName: 'Carlos Mendoza', email: 'carlos@erp.com', phone: '5551234567', address: 'Calle 1 #100', groupId: 1, active: true, permissions: { groups: { view: true, add: true, edit: true, delete: true }, users: { view: true, add: false, edit: false, delete: false }, tickets: { view: true, add: true, edit: true, delete: true } } },
    { id: 2, username: 'agarcia', fullName: 'Ana Garcia', email: 'ana@erp.com', phone: '5552345678', address: 'Calle 2 #200', groupId: 2, active: true, permissions: { groups: { view: true, add: false, edit: false, delete: false }, users: { view: false, add: false, edit: false, delete: false }, tickets: { view: true, add: false, edit: false, delete: false } } },
    { id: 3, username: 'lperez', fullName: 'Luis Perez', email: 'luis@erp.com', phone: '5553456789', address: 'Calle 3 #300', groupId: 3, active: true, permissions: { groups: { view: true, add: false, edit: false, delete: false }, users: { view: false, add: false, edit: false, delete: false }, tickets: { view: true, add: false, edit: false, delete: false } } },
    { id: 4, username: 'mlopez', fullName: 'Maria Lopez', email: 'maria@erp.com', phone: '5554567890', address: 'Calle 4 #400', groupId: 4, active: true, permissions: { groups: { view: true, add: true, edit: true, delete: true }, users: { view: true, add: false, edit: false, delete: false }, tickets: { view: true, add: true, edit: true, delete: true } } },
    { id: 5, username: 'rdiaz', fullName: 'Roberto Diaz', email: 'roberto@erp.com', phone: '5555678901', address: 'Calle 5 #500', groupId: 5, active: true, permissions: { groups: { view: true, add: false, edit: false, delete: false }, users: { view: false, add: false, edit: false, delete: false }, tickets: { view: true, add: false, edit: false, delete: false } } },
    { id: 6, username: 'jmartinez', fullName: 'Juan Martinez', email: 'juan@erp.com', phone: '5556789012', address: 'Calle 6 #600', groupId: 1, active: true, permissions: { groups: { view: true, add: false, edit: false, delete: false }, users: { view: false, add: false, edit: false, delete: false }, tickets: { view: true, add: false, edit: false, delete: false } } },
    { id: 7, username: 'srodriguez', fullName: 'Sofia Rodriguez', email: 'sofia@erp.com', phone: '5557890123', address: 'Calle 7 #700', groupId: 2, active: true, permissions: { groups: { view: false, add: false, edit: false, delete: false }, users: { view: false, add: false, edit: false, delete: false }, tickets: { view: true, add: true, edit: false, delete: false } } },
    { id: 8, username: 'phernandez', fullName: 'Pedro Hernandez', email: 'pedro@erp.com', phone: '5558901234', address: 'Calle 8 #800', groupId: 1, active: true, permissions: { groups: { view: true, add: false, edit: false, delete: false }, users: { view: false, add: false, edit: false, delete: false }, tickets: { view: true, add: false, edit: false, delete: false } } },
  ];

  // =====================================================================
  // MÉTODOS LEGACY (preservados — NO eliminar)
  // =====================================================================

  getEmptyPermissions(): RolePermissions {
    return {
      groups: { view: false, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      tickets: { view: false, add: false, edit: false, delete: false },
    };
  }

  getUsersByGroup(groupId: number): User[] {
    return this.LEGACY_USERS.filter((u) => u.groupId === groupId);
  }

  // =====================================================================
  // HTTP — LECTURA (GET)
  // =====================================================================

  /**
   * GET /users — Obtiene todos los usuarios.
   * Requiere canRead_Users. Actualiza el signal `users`.
   */
  loadUsers(): Observable<UserBackend[]> {
    this.loading.set(true);
    return this.http
      .get<ApiResponse<UserBackend>>(`${this.baseUrl}/users`)
      .pipe(
        map((res) => res.data),
        tap((users) => {
          this.users.set(users);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * GET /users/:userId — Obtiene un usuario por ID.
   * Requiere canRead_Users.
   */
  getUserById(userId: string): Observable<UserBackend> {
    return this.http
      .get<ApiResponse<UserBackend>>(`${this.baseUrl}/users/${userId}`)
      .pipe(
        map((res) => {
          const user = res.data[0];
          if (!user) throw new Error('Usuario no encontrado');
          return user;
        })
      );
  }

  /**
   * GET /users/permissions — Obtiene todas las definiciones de permisos disponibles.
   * Requiere canRead_Users. Devuelve array de {id, name}.
   * Actualiza el signal `availablePermissions`.
   */
  loadAvailablePermissions(): Observable<PermissionDefinition[]> {
    return this.http
      .get<ApiResponse<PermissionDefinition>>(`${this.baseUrl}/users/permissions`)
      .pipe(
        map((res) => res.data),
        tap((perms) => this.availablePermissions.set(perms))
      );
  }

  // =====================================================================
  // HTTP — ESCRITURA (POST, PUT, PATCH, DELETE)
  // =====================================================================

  /**
   * POST /users — Crea un nuevo usuario.
   * Requiere canCreate_Users.
   * Devuelve el ID del usuario creado.
   * Después de crear, recarga la lista de usuarios.
   */
  createUser(payload: CreateUserPayload): Observable<string> {
    return this.http
      .post<ApiResponse<{ id: string }>>(`${this.baseUrl}/users`, payload)
      .pipe(
        map((res) => res.data?.[0]?.id ?? ''),
        tap(() => {
          this.loadUsers().subscribe();
        })
      );
  }

  /**
   * PUT /users/:userId — Actualiza un usuario existente.
   * Todos los campos son opcionales. Solo enviar los que cambian.
   * Después de actualizar, recarga la lista de usuarios.
   */
  updateUser(userId: string, payload: UpdateUserPayload): Observable<string> {
    return this.http
      .put<ApiResponse<{ id: string }>>(`${this.baseUrl}/users/${userId}`, payload)
      .pipe(
        map((res) => res.data?.[0]?.id ?? userId),
        tap(() => {
          this.loadUsers().subscribe();
        })
      );
  }

  /**
   * PUT /users/:userId/permissions — Actualiza los permisos de un usuario.
   * Requiere canUpdate_Users.
   * Envía array de UUIDs de permisos. Reemplaza todos los permisos.
   * Después de actualizar, recarga la lista de usuarios.
   */
  updatePermissions(userId: string, payload: UpdatePermissionsPayload): Observable<string> {
    return this.http
      .put<ApiResponse<{ id: string }>>(`${this.baseUrl}/users/${userId}/permissions`, payload)
      .pipe(
        map((res) => res.data?.[0]?.id ?? userId),
        tap(() => {
          this.loadUsers().subscribe();
        })
      );
  }

  /**
   * PATCH /users/:userId/password — Cambia la contraseña de un usuario.
   * currentPassword requerido cuando el usuario cambia su propia contraseña.
   */
  changePassword(userId: string, payload: ChangePasswordPayload): Observable<void> {
    return this.http
      .patch<ApiResponse>(`${this.baseUrl}/users/${userId}/password`, payload)
      .pipe(map(() => void 0));
  }

  /**
   * DELETE /users/:userId/status — Desactiva un usuario (soft delete).
   * Requiere canDelete_Users.
   * Envía { status: 0 } para desactivar.
   * Después de desactivar, recarga la lista de usuarios.
   */
  deactivateUser(userId: string): Observable<void> {
    const payload: DeactivateUserPayload = { status: 0 };
    return this.http
      .delete<ApiResponse>(`${this.baseUrl}/users/${userId}/status`, { body: payload })
      .pipe(
        map(() => void 0),
        tap(() => {
          this.loadUsers().subscribe();
        })
      );
  }

  // =====================================================================
  // REGISTRO PÚBLICO (sin autenticación)
  // =====================================================================

  /**
   * POST /users/register — Registro público de un nuevo usuario.
   * NO requiere autenticación ni permisos.
   * Mismo body que POST /users pero sin permissionIds.
   * Devuelve el ID del usuario creado.
   */
  registerUser(payload: RegisterUserPayload): Observable<string> {
    return this.http
      .post<ApiResponse<{ id: string }>>(`${this.baseUrl}/users/register`, payload)
      .pipe(
        map((res) => {
          const created = res.data[0];
          if (!created) throw new Error('Error al registrar usuario');
          return created.id;
        })
      );
  }

  // =====================================================================
  // HELPERS
  // =====================================================================

  /**
   * Construye el nombre completo a partir de firstName, middleName, lastName.
   * middleName puede ser null, se omite en ese caso.
   */
  getFullName(user: UserBackend): string {
    return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
  }

  /**
   * Obtiene todos los nombres completos de los usuarios cargados.
   * Útil para autocompletado, asignación, etc.
   */
  getAllUserNames(): string[] {
    return this.users().map((u) => this.getFullName(u));
  }
}
