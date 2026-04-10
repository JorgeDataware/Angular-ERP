// ============================================================
// LEGACY TYPES — preserved, do NOT delete
// ============================================================
export type TicketStatus = 'pendiente' | 'en progreso' | 'en revision' | 'finalizado';
export type TicketPriority = 'alta' | 'media' | 'baja';

export interface TicketComment {
  id: number;
  autor: string;
  fecha: string;
  texto: string;
}

export interface TicketChange {
  id: number;
  fecha: string;
  usuario: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: TicketStatus;
  asignadoA: string;
  prioridad: TicketPriority;
  fechaCreacion: string;
  fechaLimite: string;
  groupId: number;
  comentarios: TicketComment[];
  historialCambios: TicketChange[];
}

// ============================================================
// BACKEND TYPES — match API Gateway contract
// ============================================================

/** Backend ticket status: 1=Open, 2=InProgress, 3=OnRevision, 4=Closed */
export type TicketStatusBackend = 1 | 2 | 3 | 4;

/** Backend ticket priority: 1=Low, 2=Medium, 3=High */
export type TicketPriorityBackend = 1 | 2 | 3;

/** Priority strings used in create/edit payloads */
export type TicketPriorityPayload = 'Low' | 'Medium' | 'High';

/** Ticket as returned by GET /tickets, GET /tickets/pending, GET /tickets/:ticketId */
export interface TicketBackend {
  id: string;
  title: string;
  description: string;
  comments: string | null;
  status: TicketStatusBackend;
  priority: TicketPriorityBackend;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  groupId: string;
  groupName: string;
  createdByUserId: string;
  createdByUserName: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
}

/** POST /tickets body */
export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriorityPayload;
  groupId: string;
  comments?: string;
  dueDate?: string;
}

/** PATCH /tickets/:ticketId body — all fields optional */
export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  comments?: string;
  priority?: TicketPriorityPayload;
  dueDate?: string;
}

/** POST /tickets/:ticketId/assign body */
export interface AssignTicketPayload {
  assignedUserId: string;
}

// ============================================================
// STATUS & PRIORITY MAPPINGS
// ============================================================

/** PrimeNG Tag severity union type */
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

/** Map backend numeric status to Spanish display label */
export const TICKET_STATUS_LABELS: Record<TicketStatusBackend, string> = {
  1: 'Abierto',
  2: 'En progreso',
  3: 'En revisión',
  4: 'Cerrado',
};

/** Map backend numeric status to PrimeNG severity for p-tag */
export const TICKET_STATUS_SEVERITY: Record<TicketStatusBackend, TagSeverity> = {
  1: 'info',
  2: 'warn',
  3: 'secondary',
  4: 'success',
};

/** Map backend numeric priority to Spanish display label */
export const TICKET_PRIORITY_LABELS: Record<TicketPriorityBackend, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
};

/** Map backend numeric priority to PrimeNG severity for p-tag */
export const TICKET_PRIORITY_SEVERITY: Record<TicketPriorityBackend, TagSeverity> = {
  1: 'info',
  2: 'warn',
  3: 'danger',
};

/** Map backend numeric priority to payload string (for create/edit) */
export const TICKET_PRIORITY_TO_PAYLOAD: Record<TicketPriorityBackend, TicketPriorityPayload> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

/** Map payload string to backend numeric priority */
export const TICKET_PRIORITY_FROM_PAYLOAD: Record<TicketPriorityPayload, TicketPriorityBackend> = {
  'Low': 1,
  'Medium': 2,
  'High': 3,
};

/** Dropdown options for status filter (Spanish labels) */
export const TICKET_STATUS_OPTIONS = [
  { label: 'Abierto', value: 1 },
  { label: 'En progreso', value: 2 },
  { label: 'En revisión', value: 3 },
  { label: 'Cerrado', value: 4 },
];

/** Dropdown options for priority filter (Spanish labels) */
export const TICKET_PRIORITY_OPTIONS = [
  { label: 'Baja', value: 1 },
  { label: 'Media', value: 2 },
  { label: 'Alta', value: 3 },
];

/** Dropdown options for priority in create/edit forms (payload strings) */
export const TICKET_PRIORITY_FORM_OPTIONS = [
  { label: 'Baja', value: 'Low' as TicketPriorityPayload },
  { label: 'Media', value: 'Medium' as TicketPriorityPayload },
  { label: 'Alta', value: 'High' as TicketPriorityPayload },
];
