import { Injectable, signal } from '@angular/core';
import { Ticket, TicketComment, TicketChange, TicketStatus, TicketPriority } from '../models/ticket';

@Injectable({ providedIn: 'root' })
export class TicketService {
  tickets = signal<Ticket[]>([
    {
      id: 1,
      titulo: 'Corregir bug en formulario de login',
      descripcion: 'El formulario de login no valida correctamente el email',
      estado: 'pendiente',
      asignadoA: 'Carlos Mendoza',
      prioridad: 'alta',
      fechaCreacion: '2026-03-01',
      fechaLimite: '2026-03-10',
      groupId: 1,
      comentarios: [
        { id: 1, autor: 'Ana Garcia', fecha: '2026-03-02', texto: 'Revisando el issue' },
      ],
      historialCambios: [
        { id: 1, fecha: '2026-03-01', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
      ],
    },
    {
      id: 2,
      titulo: 'Implementar endpoint de usuarios',
      descripcion: 'Crear el endpoint REST para CRUD de usuarios',
      estado: 'en progreso',
      asignadoA: 'Ana Garcia',
      prioridad: 'media',
      fechaCreacion: '2026-03-02',
      fechaLimite: '2026-03-15',
      groupId: 2,
      comentarios: [],
      historialCambios: [
        { id: 1, fecha: '2026-03-02', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
        { id: 2, fecha: '2026-03-03', usuario: 'Ana Garcia', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'En progreso' },
      ],
    },
    {
      id: 3,
      titulo: 'Pruebas de integracion modulo ventas',
      descripcion: 'Ejecutar pruebas de integracion para el modulo de ventas',
      estado: 'en revision',
      asignadoA: 'Luis Perez',
      prioridad: 'baja',
      fechaCreacion: '2026-02-28',
      fechaLimite: '2026-03-08',
      groupId: 3,
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
      id: 4,
      titulo: 'Configurar pipeline CI/CD',
      descripcion: 'Configurar el pipeline de integracion continua y despliegue',
      estado: 'finalizado',
      asignadoA: 'Maria Lopez',
      prioridad: 'alta',
      fechaCreacion: '2026-02-25',
      fechaLimite: '2026-03-05',
      groupId: 4,
      comentarios: [],
      historialCambios: [
        { id: 1, fecha: '2026-02-25', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
        { id: 2, fecha: '2026-02-27', usuario: 'Maria Lopez', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'Finalizado' },
      ],
    },
    {
      id: 5,
      titulo: 'Redisenar pantalla de dashboard',
      descripcion: 'Actualizar el diseno del dashboard con nuevas metricas',
      estado: 'pendiente',
      asignadoA: 'Roberto Diaz',
      prioridad: 'media',
      fechaCreacion: '2026-03-04',
      fechaLimite: '2026-03-20',
      groupId: 5,
      comentarios: [],
      historialCambios: [
        { id: 1, fecha: '2026-03-04', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
      ],
    },
    {
      id: 6,
      titulo: 'Optimizar consultas de base de datos',
      descripcion: 'Revisar y optimizar las consultas SQL del modulo de inventario',
      estado: 'en progreso',
      asignadoA: 'Carlos Mendoza',
      prioridad: 'alta',
      fechaCreacion: '2026-03-03',
      fechaLimite: '2026-03-12',
      groupId: 1,
      comentarios: [
        { id: 1, autor: 'Carlos Mendoza', fecha: '2026-03-04', texto: 'Identificadas 3 consultas lentas' },
      ],
      historialCambios: [
        { id: 1, fecha: '2026-03-03', usuario: 'Admin', campo: 'Estado', valorAnterior: '-', valorNuevo: 'Pendiente' },
        { id: 2, fecha: '2026-03-04', usuario: 'Carlos Mendoza', campo: 'Estado', valorAnterior: 'Pendiente', valorNuevo: 'En progreso' },
      ],
    },
  ]);

  private nextId(): number {
    const ids = this.tickets().map((t) => t.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  getTicketsByGroup(groupId: number): Ticket[] {
    return this.tickets().filter((t) => t.groupId === groupId);
  }

  addTicket(ticket: Omit<Ticket, 'id' | 'comentarios' | 'historialCambios'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: this.nextId(),
      comentarios: [],
      historialCambios: [
        {
          id: 1,
          fecha: ticket.fechaCreacion,
          usuario: 'Sistema',
          campo: 'Estado',
          valorAnterior: '-',
          valorNuevo: ticket.estado,
        },
      ],
    };
    this.tickets.update((list) => [...list, newTicket]);
    return newTicket;
  }

  updateTicket(id: number, changes: Partial<Ticket>, usuario: string): void {
    this.tickets.update((list) =>
      list.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...changes };
        // Add change history entries
        const newChanges: TicketChange[] = [];
        const fecha = new Date().toISOString().split('T')[0];
        let changeId = t.historialCambios.length > 0 ? Math.max(...t.historialCambios.map(c => c.id)) + 1 : 1;

        for (const key of Object.keys(changes) as (keyof Ticket)[]) {
          if (key === 'comentarios' || key === 'historialCambios' || key === 'id') continue;
          const oldVal = String(t[key]);
          const newVal = String(changes[key]);
          if (oldVal !== newVal) {
            newChanges.push({
              id: changeId++,
              fecha,
              usuario,
              campo: key,
              valorAnterior: oldVal,
              valorNuevo: newVal,
            });
          }
        }

        updated.historialCambios = [...t.historialCambios, ...newChanges];
        return updated;
      })
    );
  }

  deleteTicket(id: number): void {
    this.tickets.update((list) => list.filter((t) => t.id !== id));
  }

  addComment(ticketId: number, autor: string, texto: string): void {
    this.tickets.update((list) =>
      list.map((t) => {
        if (t.id !== ticketId) return t;
        const commentId = t.comentarios.length > 0 ? Math.max(...t.comentarios.map(c => c.id)) + 1 : 1;
        return {
          ...t,
          comentarios: [
            ...t.comentarios,
            { id: commentId, autor, fecha: new Date().toISOString().split('T')[0], texto },
          ],
        };
      })
    );
  }
}
