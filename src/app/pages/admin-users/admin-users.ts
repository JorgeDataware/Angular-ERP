import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { UserRole } from '../../core/models/permission';
import { GroupService } from '../../core/services/group.service';

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Search
  searchValue = signal('');

  // Dialog state
  dialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);

  // Form fields
  editId = signal<number | null>(null);
  editUsername = signal('');
  editFullName = signal('');
  editEmail = signal('');
  editPhone = signal('');
  editAddress = signal('');
  editGroupId = signal<number>(1);
  editRole = signal<UserRole>('usuario');
  editActive = signal(true);

  // Options
  roleOptions = [
    { label: 'Super Admin', value: 'superAdmin' as UserRole },
    { label: 'Lider de Grupo', value: 'groupLeader' as UserRole },
    { label: 'Desarrollador', value: 'developer' as UserRole },
    { label: 'Usuario', value: 'usuario' as UserRole },
  ];

  activeOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  groupOptions = computed(() => {
    return this.groupService.groups().map((g) => ({
      label: g.nombre,
      value: g.id,
    }));
  });

  // Data
  users = this.userService.users;

  filteredUsers = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    );
  });

  // Validation
  isFormValid = computed(() => {
    return (
      this.editUsername().trim().length > 0 &&
      this.editFullName().trim().length > 0 &&
      this.editEmail().trim().length > 0 &&
      this.editPhone().trim().length > 0 &&
      this.editAddress().trim().length > 0
    );
  });

  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario'
  );

  openNew(): void {
    this.resetForm();
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editUser(user: User): void {
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(user.id);
    this.editUsername.set(user.username);
    this.editFullName.set(user.fullName);
    this.editEmail.set(user.email);
    this.editPhone.set(user.phone);
    this.editAddress.set(user.address);
    this.editGroupId.set(user.groupId);
    this.editRole.set(user.role);
    this.editActive.set(user.active);
    this.dialogVisible.set(true);
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas eliminar al usuario "${user.fullName}"?`,
      header: 'Confirmar Eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(user.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: `El usuario "${user.fullName}" ha sido eliminado`,
          life: 3000,
        });
      },
    });
  }

  saveUser(): void {
    this.submitted.set(true);
    if (!this.isFormValid()) return;

    if (this.isEditMode()) {
      this.userService.updateUser(this.editId()!, {
        username: this.editUsername().trim(),
        fullName: this.editFullName().trim(),
        email: this.editEmail().trim(),
        phone: this.editPhone().trim(),
        address: this.editAddress().trim(),
        groupId: this.editGroupId(),
        role: this.editRole(),
        active: this.editActive(),
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: `El usuario "${this.editFullName().trim()}" ha sido actualizado`,
        life: 3000,
      });
    } else {
      this.userService.addUser({
        username: this.editUsername().trim(),
        fullName: this.editFullName().trim(),
        email: this.editEmail().trim(),
        phone: this.editPhone().trim(),
        address: this.editAddress().trim(),
        groupId: this.editGroupId(),
        role: this.editRole(),
        active: this.editActive(),
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Creado',
        detail: `El usuario "${this.editFullName().trim()}" ha sido creado`,
        life: 3000,
      });
    }

    this.dialogVisible.set(false);
    this.resetForm();
  }

  hideDialog(): void {
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  getRoleSeverity(role: UserRole): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (role) {
      case 'superAdmin': return 'danger';
      case 'groupLeader': return 'warn';
      case 'developer': return 'info';
      case 'usuario': return 'secondary';
    }
  }

  getRoleLabel(role: UserRole): string {
    return this.authService.getRoleLabel(role);
  }

  private resetForm(): void {
    this.editId.set(null);
    this.editUsername.set('');
    this.editFullName.set('');
    this.editEmail.set('');
    this.editPhone.set('');
    this.editAddress.set('');
    this.editGroupId.set(1);
    this.editRole.set('usuario');
    this.editActive.set(true);
  }
}
