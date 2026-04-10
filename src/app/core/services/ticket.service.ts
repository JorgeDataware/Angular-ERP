import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import {
  Ticket, TicketComment, TicketChange, TicketStatus, TicketPriority,
  TicketBackend, CreateTicketPayload, UpdateTicketPayload, AssignTicketPayload,
} from '../models/ticket';

// ============================================================
// LEGACY DATA — preserved, do NOT delete
// ============================================================
export const LEGACY_TICKETS: Ticket[] = [
  {
    id: 1, titulo: 'Corregir bug en formulario de login',
    descripcion: 'El formulario de login no valida correctamente el email',
    estado: 'pendiente', asignadoA: 'Carlos Mendoza', prioridad: 'alta',
    fechaCreacion: '2026-03-01', fechaLimite: '2026-03-10', groupId: 1,
    comentarios: [{ id: 1, autor: 'Ana Garcia', fecha: '2026-03-02', texto: 'Revisando el issue' }],
    historialCambios: [{ id: 1, fecha: '2026-03-01', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' }],
  },
  {
    id: 2, titulo: 'Implementar endpoint de usuarios',
    descripcion: 'Crear el endpoint REST para CRUD de usuarios',
    estado: 'en progreso', asignadoA: 'Ana Garcia', prioridad: 'media',
    fechaCreacion: '2026-03-02', fechaLimite: '2026-03-15', groupId: 2,
    comentarios: [],
    historialCambios: [
      { id: 1, fecha: '2026-03-02', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
      { id: 2, fecha: '2026-03-03', usuario: 'Ana Garcia', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'En progreso' },
    ],
  },
  {
    id: 3, titulo: 'Pruebas de integracion modulo ventas',
    descripcion: 'Ejecutar pruebas de integracion para el modulo de ventas',
    estado: 'en revision', asignadoA: 'Luis Perez', prioridad: 'baja',
    fechaCreacion: '2026-02-28', fechaLimite: '2026-03-08', groupId: 3,
    comentarios: [
      { id: 1, autor: 'Luis Perez', fecha: '2026-03-01', texto: 'Tests ejecutados, 2 fallidos' },
      { id: 2, autor: 'Maria Lopez', fecha: '2026-03-02', texto: 'Revisando los tests fallidos' },
    ],
    historialCambios: [
      { id: 1, fecha: '2026-02-28', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
      { id: 2, fecha: '2026-03-01', usuario: 'Luis Perez', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'En progreso' },
      { id: 3, fecha: '2026-03-03', usuario: 'Luis Perez', campo: 'Estado', valorAnterior: 'En progreso', valorNuevo: 'En revision' },
    ],
  },
  {
    id: 4, titulo: 'Configurar pipeline CI/CD',
    descripcion: 'Configurar el pipeline de integracion continua y despliegue',
    estado: 'finalizado', asignadoA: 'Maria Lopez', prioridad: 'alta',
    fechaCreacion: '2026-02-25', fechaLimite: '2026-03-05', groupId: 4,
    comentarios: [],
    historialCambios: [
      { id: 1, fecha: '2026-02-25', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
      { id: 2, fecha: '2026-02-27', usuario: 'Maria Lopez', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'Finalizado' },
    ],
  },
  {
    id: 5, titulo: 'Redisenar pantalla de dashboard',
    descripcion: 'Actualizar el diseno del dashboard con nuevas metricas',
    estado: 'pendiente', asignadoA: 'Roberto Diaz', prioridad: 'media',
    fechaCreacion: '2026-03-04', fechaLimite: '2026-03-20', groupId: 5,
    comentarios: [],
    historialCambios: [{ id: 1, fecha: '2026-03-04', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' }],
  },
  {
    id: 6, titulo: 'Optimizar consultas de base de datos',
    descripcion: 'Revisar y optimizar las consultas SQL del modulo de inventario',
    estado: 'en progreso', asignadoA: 'Carlos Mendoza', prioridad: 'alta',
    fechaCreacion: '2026-03-03', fechaLimite: '2026-03-12', groupId: 1,
    comentarios: [{ id: 1, autor: 'Carlos Mendoza', fecha: '2026-03-04', texto: 'Identificadas 3 consultas lentas' }],
    historialCambios: [
      { id: 1, fecha: '2026-03-03', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
      { id: 2, fecha: '2026-03-04', usuario: 'Carlos Mendoza', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'En progreso' },
    ],
  },
];

// ============================================================
// TICKET SERVICE — HTTP-based, API Gateway only
// ============================================================

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiGatewayUrl}/tickets`;

  /** All tickets from GET /tickets */
  tickets = signal<TicketBackend[]>([]);

  /** Pending/unassigned tickets from GET /tickets/pending */
  pendingTickets = signal<TicketBackend[]>([]);

  /** Loading indicator */
  loading = signal(false);

  // ----------------------------------------------------------
  // READ operations
  // ----------------------------------------------------------

  /** GET /tickets — load all tickets */
  async loadTickets(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<TicketBackend>>(`${this.baseUrl}`)
      );
      this.tickets.set(res.data ?? []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      this.tickets.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /** GET /tickets/pending — load pending/unassigned tickets */
  async loadPendingTickets(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<TicketBackend>>(`${this.baseUrl}/pending`)
      );
      this.pendingTickets.set(res.data ?? []);
    } catch (err) {
      console.error('Error loading pending tickets:', err);
      this.pendingTickets.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /** GET /tickets/:ticketId — get single ticket detail */
  async getTicketById(ticketId: string): Promise<TicketBackend | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<TicketBackend>>(`${this.baseUrl}/${ticketId}`)
      );
      return res.data?.[0] ?? null;
    } catch (err) {
      console.error('Error getting ticket:', err);
      return null;
    }
  }

  // ----------------------------------------------------------
  // WRITE operations
  // ----------------------------------------------------------

  /** POST /tickets — create a new ticket */
  async createTicket(payload: CreateTicketPayload): Promise<TicketBackend | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<TicketBackend>>(`${this.baseUrl}`, payload)
      );
      // Refresh the list after creation
      await this.loadTickets();
      return res.data?.[0] ?? null;
    } catch (err) {
      console.error('Error creating ticket:', err);
      throw err;
    }
  }

  /** PATCH /tickets/:ticketId — edit ticket (only creator, only Open tickets) */
  async updateTicket(ticketId: string, payload: UpdateTicketPayload): Promise<TicketBackend | null> {
    try {
      const res = await firstValueFrom(
        this.http.patch<ApiResponse<TicketBackend>>(`${this.baseUrl}/${ticketId}`, payload)
      );
      // Refresh the list after update
      await this.loadTickets();
      return res.data?.[0] ?? null;
    } catch (err) {
      console.error('Error updating ticket:', err);
      throw err;
    }
  }

  // ----------------------------------------------------------
  // WORKFLOW operations
  // ----------------------------------------------------------

  /** POST /tickets/:ticketId/assign — assign ticket to a user */
  async assignTicket(ticketId: string, payload: AssignTicketPayload): Promise<TicketBackend | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<TicketBackend>>(`${this.baseUrl}/${ticketId}/assign`, payload)
      );
      await this.loadTickets();
      return res.data?.[0] ?? null;
    } catch (err) {
      console.error('Error assigning ticket:', err);
      throw err;
    }
  }

  /** POST /tickets/:ticketId/start-work — start working on a ticket (Open → InProgress) */
  async startWork(ticketId: string): Promise<TicketBackend | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<TicketBackend>>(`${this.baseUrl}/${ticketId}/start-work`, {})
      );
      await this.loadTickets();
      return res.data?.[0] ?? null;
    } catch (err) {
      console.error('Error starting work on ticket:', err);
      throw err;
    }
  }

  /** POST /tickets/:ticketId/finish — finish a ticket (InProgress → Closed) */
  async finishTicket(ticketId: string): Promise<TicketBackend | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<TicketBackend>>(`${this.baseUrl}/${ticketId}/finish`, {})
      );
      await this.loadTickets();
      return res.data?.[0] ?? null;
    } catch (err) {
      console.error('Error finishing ticket:', err);
      throw err;
    }
  }

  // ----------------------------------------------------------
  // LEGACY methods — preserved, do NOT delete
  // ----------------------------------------------------------

  /** @deprecated Use loadTickets() signal instead */
  getLegacyTickets(): Ticket[] {
    return LEGACY_TICKETS;
  }

  /** @deprecated Legacy: get tickets by numeric group ID */
  getLegacyTicketsByGroup(groupId: number): Ticket[] {
    return LEGACY_TICKETS.filter(t => t.groupId === groupId);
  }
}
