import { Injectable, signal } from '@angular/core';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  users = signal<User[]>([
    { id: 1, username: 'cmendoza', fullName: 'Carlos Mendoza', email: 'carlos@erp.com', phone: '5551234567', address: 'Calle 1 #100', groupId: 1, role: 'groupLeader', active: true },
    { id: 2, username: 'agarcia', fullName: 'Ana Garcia', email: 'ana@erp.com', phone: '5552345678', address: 'Calle 2 #200', groupId: 2, role: 'developer', active: true },
    { id: 3, username: 'lperez', fullName: 'Luis Perez', email: 'luis@erp.com', phone: '5553456789', address: 'Calle 3 #300', groupId: 3, role: 'developer', active: true },
    { id: 4, username: 'mlopez', fullName: 'Maria Lopez', email: 'maria@erp.com', phone: '5554567890', address: 'Calle 4 #400', groupId: 4, role: 'groupLeader', active: true },
    { id: 5, username: 'rdiaz', fullName: 'Roberto Diaz', email: 'roberto@erp.com', phone: '5555678901', address: 'Calle 5 #500', groupId: 5, role: 'developer', active: true },
    { id: 6, username: 'jmartinez', fullName: 'Juan Martinez', email: 'juan@erp.com', phone: '5556789012', address: 'Calle 6 #600', groupId: 1, role: 'developer', active: true },
    { id: 7, username: 'srodriguez', fullName: 'Sofia Rodriguez', email: 'sofia@erp.com', phone: '5557890123', address: 'Calle 7 #700', groupId: 2, role: 'usuario', active: true },
    { id: 8, username: 'phernandez', fullName: 'Pedro Hernandez', email: 'pedro@erp.com', phone: '5558901234', address: 'Calle 8 #800', groupId: 1, role: 'developer', active: true },
  ]);

  private nextId(): number {
    const ids = this.users().map((u) => u.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  getUsersByGroup(groupId: number): User[] {
    return this.users().filter((u) => u.groupId === groupId);
  }

  getUserById(id: number): User | undefined {
    return this.users().find((u) => u.id === id);
  }

  addUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: this.nextId() };
    this.users.update((list) => [...list, newUser]);
    return newUser;
  }

  updateUser(id: number, changes: Partial<User>): void {
    this.users.update((list) =>
      list.map((u) => (u.id === id ? { ...u, ...changes } : u))
    );
  }

  deleteUser(id: number): void {
    this.users.update((list) => list.filter((u) => u.id !== id));
  }

  getAllUserNames(): string[] {
    return this.users().map((u) => u.fullName);
  }
}
