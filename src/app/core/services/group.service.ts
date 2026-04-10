import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import {
  Group,
  GroupBackend,
  GroupDetailBackend,
  GroupMember,
  GroupTicketBackend,
  CreateGroupPayload,
  UpdateGroupPayload,
  AddMemberPayload,
  RemoveMemberPayload,
} from '../models/group';
import { ApiResponse } from '../models/api-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiGatewayUrl;

  // =====================================================================
  // ESTADO REACTIVO
  // =====================================================================

  /** Lista de grupos del backend (actualizada tras cada operación) */
  groups = signal<GroupBackend[]>([]);

  /** Indicador de carga */
  loading = signal(false);

  // =====================================================================
  // DATOS LEGACY HARDCODED (preservados — NO eliminar)
  // =====================================================================

  private readonly LEGACY_GROUPS: Group[] = [
    { id: 1, nivel: 'Alto', autor: 'Carlos Mendoza', nombre: 'Desarrollo Frontend', integrantes: 5, tickets: 12, descripcion: 'Equipo encargado del desarrollo de interfaces de usuario' },
    { id: 2, nivel: 'Medio', autor: 'Ana Garcia', nombre: 'Backend API', integrantes: 4, tickets: 8, descripcion: 'Equipo de servicios y APIs REST' },
    { id: 3, nivel: 'Bajo', autor: 'Luis Perez', nombre: 'QA Testing', integrantes: 3, tickets: 20, descripcion: 'Equipo de aseguramiento de calidad y pruebas' },
    { id: 4, nivel: 'Alto', autor: 'Maria Lopez', nombre: 'DevOps', integrantes: 2, tickets: 5, descripcion: 'Infraestructura, CI/CD y despliegues' },
    { id: 5, nivel: 'Medio', autor: 'Roberto Diaz', nombre: 'Diseno UX/UI', integrantes: 3, tickets: 15, descripcion: 'Diseno de experiencia e interfaz de usuario' },
  ];

  // =====================================================================
  // MÉTODOS LEGACY (preservados — NO eliminar)
  // =====================================================================

  private nextId(): number {
    const ids = this.LEGACY_GROUPS.map((g) => g.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  addGroupLegacy(group: Omit<Group, 'id'>): Group {
    const newGroup: Group = { ...group, id: this.nextId() };
    this.LEGACY_GROUPS.push(newGroup);
    return newGroup;
  }

  updateGroupLegacy(id: number, changes: Partial<Group>): void {
    const idx = this.LEGACY_GROUPS.findIndex((g) => g.id === id);
    if (idx !== -1) {
      Object.assign(this.LEGACY_GROUPS[idx], changes);
    }
  }

  deleteGroupLegacy(id: number): void {
    const idx = this.LEGACY_GROUPS.findIndex((g) => g.id === id);
    if (idx !== -1) this.LEGACY_GROUPS.splice(idx, 1);
  }

  getGroupByIdLegacy(id: number): Group | undefined {
    return this.LEGACY_GROUPS.find((g) => g.id === id);
  }

  // =====================================================================
  // HTTP — LECTURA (GET)
  // =====================================================================

  /**
   * GET /groups — Obtiene todos los grupos.
   * Requiere canRead_Groups. Actualiza el signal `groups`.
   */
  loadGroups(): Observable<GroupBackend[]> {
    this.loading.set(true);
    return this.http
      .get<ApiResponse<GroupBackend>>(`${this.baseUrl}/groups`)
      .pipe(
        map((res) => res.data),
        tap((groups) => {
          this.groups.set(groups);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * GET /groups/:groupId — Obtiene el detalle de un grupo (incluye members).
   * Requiere canRead_Groups.
   */
  getGroupById(groupId: string): Observable<GroupDetailBackend> {
    return this.http
      .get<ApiResponse<GroupDetailBackend>>(`${this.baseUrl}/groups/${groupId}`)
      .pipe(
        map((res) => {
          const group = res.data[0];
          if (!group) throw new Error('Grupo no encontrado');
          return group;
        })
      );
  }

  /**
   * GET /groups/:groupId/members — Obtiene los miembros de un grupo.
   * Requiere canRead_Groups.
   */
  getGroupMembers(groupId: string): Observable<GroupMember[]> {
    return this.http
      .get<ApiResponse<GroupMember>>(`${this.baseUrl}/groups/${groupId}/members`)
      .pipe(
        map((res) => res.data)
      );
  }

  /**
   * GET /groups/:groupId/tickets — Obtiene los tickets de un grupo.
   * Requiere canRead_Groups.
   */
  getGroupTickets(groupId: string): Observable<GroupTicketBackend[]> {
    return this.http
      .get<ApiResponse<GroupTicketBackend>>(`${this.baseUrl}/groups/${groupId}/tickets`)
      .pipe(
        map((res) => res.data)
      );
  }

  // =====================================================================
  // HTTP — ESCRITURA (POST, PATCH, DELETE)
  // =====================================================================

  /**
   * POST /groups — Crea un nuevo grupo.
   * Requiere canCreate_Groups. Owner se asigna desde el JWT.
   * Después de crear, recarga la lista de grupos.
   */
  createGroup(payload: CreateGroupPayload): Observable<string> {
    return this.http
      .post<ApiResponse<{ id: string }>>(`${this.baseUrl}/groups`, payload)
      .pipe(
        map((res) => res.data?.[0]?.id ?? ''),
        tap(() => {
          this.loadGroups().subscribe();
        })
      );
  }

  /**
   * PATCH /groups/:groupId — Edita un grupo existente (solo owner).
   * Requiere canUpdate_Groups. Campos opcionales: name, description.
   * Después de editar, recarga la lista de grupos.
   */
  updateGroup(groupId: string, payload: UpdateGroupPayload): Observable<string> {
    return this.http
      .patch<ApiResponse<{ id: string }>>(`${this.baseUrl}/groups/${groupId}`, payload)
      .pipe(
        map((res) => res.data?.[0]?.id ?? groupId),
        tap(() => {
          this.loadGroups().subscribe();
        })
      );
  }

  /**
   * PATCH /groups/:groupId/deactivate — Desactiva un grupo (solo owner/superadmin).
   * Requiere canDelete_Groups. No body.
   * Después de desactivar, recarga la lista de grupos.
   */
  deactivateGroup(groupId: string): Observable<void> {
    return this.http
      .patch<ApiResponse>(`${this.baseUrl}/groups/${groupId}/deactivate`, {})
      .pipe(
        map(() => void 0),
        tap(() => {
          this.loadGroups().subscribe();
        })
      );
  }

  // =====================================================================
  // HTTP — MIEMBROS
  // =====================================================================

  /**
   * POST /groups/members — Agrega un miembro a un grupo (solo owner).
   * Requiere canUpdate_Groups.
   */
  addMember(payload: AddMemberPayload): Observable<void> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/groups/members`, payload)
      .pipe(
        map(() => void 0)
      );
  }

  /**
   * DELETE /groups/members — Remueve un miembro de un grupo (solo owner).
   * Requiere canUpdate_Groups.
   */
  removeMember(payload: RemoveMemberPayload): Observable<void> {
    return this.http
      .delete<ApiResponse>(`${this.baseUrl}/groups/members`, { body: payload })
      .pipe(
        map(() => void 0)
      );
  }

  // =====================================================================
  // HELPERS
  // =====================================================================

  /**
   * Devuelve la etiqueta de estado para un grupo.
   */
  getStatusLabel(status: number): string {
    return status === 1 ? 'Activo' : 'Inactivo';
  }

  /**
   * Devuelve la severidad de PrimeNG Tag para un estado.
   */
  getStatusSeverity(status: number): 'success' | 'danger' {
    return status === 1 ? 'success' : 'danger';
  }
}
