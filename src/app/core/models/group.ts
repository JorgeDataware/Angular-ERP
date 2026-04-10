// =====================================================================
// LEGACY MODEL (preservado — NO eliminar)
// =====================================================================

export interface Group {
  id: number;
  nivel: string;
  autor: string;
  nombre: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
}

// =====================================================================
// BACKEND MODELS — Adaptados al API Gateway
// =====================================================================

/**
 * Grupo tal como lo devuelve GET /groups (lista).
 * NO incluye members ni createdByUserId.
 */
export interface GroupBackend {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: number; // 1 = activo, 0 = inactivo
}

/**
 * Grupo con detalle, tal como lo devuelve GET /groups/:groupId.
 * Incluye members[] y createdByUserId.
 */
export interface GroupDetailBackend extends GroupBackend {
  createdByUserId: string;
  members: GroupMember[];
}

/**
 * Miembro de un grupo, tal como lo devuelve GET /groups/:groupId/members
 * y dentro de GroupDetailBackend.members[].
 */
export interface GroupMember {
  id: string;
  userName: string;
  completeName: string;
}

/**
 * Ticket de un grupo, tal como lo devuelve GET /groups/:groupId/tickets.
 */
export interface GroupTicketBackend {
  id: string;
  title: string;
  description: string;
  status: number;   // 1, 2, 3
  priority: number;  // 1, 2, 3
  groupId: string;
  groupName: string;
}

// =====================================================================
// PAYLOADS — Cuerpos de peticiones HTTP
// =====================================================================

/**
 * POST /groups — Crear grupo.
 * El owner se asigna automáticamente desde el JWT.
 */
export interface CreateGroupPayload {
  name: string;
  description: string;
}

/**
 * PATCH /groups/:groupId — Editar grupo (solo owner puede editar).
 * Todos los campos son opcionales.
 */
export interface UpdateGroupPayload {
  name?: string;
  description?: string;
}

/**
 * POST /groups/members — Agregar miembro a un grupo.
 * Solo el owner del grupo puede agregar miembros.
 */
export interface AddMemberPayload {
  groupId: string;
  memberId: string;
}

/**
 * DELETE /groups/members — Remover miembro de un grupo.
 * Solo el owner del grupo puede remover miembros.
 */
export interface RemoveMemberPayload {
  groupId: string;
  memberId: string;
}
