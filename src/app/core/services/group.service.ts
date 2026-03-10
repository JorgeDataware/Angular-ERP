import { Injectable, signal } from '@angular/core';
import { Group } from '../models/group';

@Injectable({ providedIn: 'root' })
export class GroupService {
  groups = signal<Group[]>([
    {
      id: 1,
      nivel: 'Alto',
      autor: 'Carlos Mendoza',
      nombre: 'Desarrollo Frontend',
      integrantes: 5,
      tickets: 12,
      descripcion: 'Equipo encargado del desarrollo de interfaces de usuario',
    },
    {
      id: 2,
      nivel: 'Medio',
      autor: 'Ana Garcia',
      nombre: 'Backend API',
      integrantes: 4,
      tickets: 8,
      descripcion: 'Equipo de servicios y APIs REST',
    },
    {
      id: 3,
      nivel: 'Bajo',
      autor: 'Luis Perez',
      nombre: 'QA Testing',
      integrantes: 3,
      tickets: 20,
      descripcion: 'Equipo de aseguramiento de calidad y pruebas',
    },
    {
      id: 4,
      nivel: 'Alto',
      autor: 'Maria Lopez',
      nombre: 'DevOps',
      integrantes: 2,
      tickets: 5,
      descripcion: 'Infraestructura, CI/CD y despliegues',
    },
    {
      id: 5,
      nivel: 'Medio',
      autor: 'Roberto Diaz',
      nombre: 'Diseno UX/UI',
      integrantes: 3,
      tickets: 15,
      descripcion: 'Diseno de experiencia e interfaz de usuario',
    },
  ]);

  private nextId(): number {
    const ids = this.groups().map((g) => g.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  addGroup(group: Omit<Group, 'id'>): Group {
    const newGroup: Group = { ...group, id: this.nextId() };
    this.groups.update((list) => [...list, newGroup]);
    return newGroup;
  }

  updateGroup(id: number, changes: Partial<Group>): void {
    this.groups.update((list) =>
      list.map((g) => (g.id === id ? { ...g, ...changes } : g))
    );
  }

  deleteGroup(id: number): void {
    this.groups.update((list) => list.filter((g) => g.id !== id));
  }

  getGroupById(id: number): Group | undefined {
    return this.groups().find((g) => g.id === id);
  }
}
