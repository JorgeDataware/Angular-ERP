import { Component, signal, computed, inject, OnInit } from '@angular/core';
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
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';
import { UserBackend, PermissionDefinition } from '../../core/models/user';
import { PermissionModule, PermissionAction, RolePermissions } from '../../core/models/permission';
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
    CheckboxModule,
    PasswordModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
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
  saving = signal(false);

  // Permissions dialog state
  permissionsDialogVisible = signal(false);
  permissionsUserId = signal<string | null>(null);
  permissionsUserName = signal('');
  /** UUIDs de permisos seleccionados para el usuario en edición */
  selectedPermissionIds = signal<string[]>([]);
  savingPermissions = signal(false);

  // =====================================================================
  // LEGACY: Permission config para template iteration (preservado — NO eliminar)
  // =====================================================================
  permissionModules: { key: PermissionModule; label: string; icon: string }[] = [
    { key: 'groups', label: 'Grupos', icon: 'pi pi-sitemap' },
    { key: 'users', label: 'Usuarios', icon: 'pi pi-users' },
    { key: 'tickets', label: 'Tickets', icon: 'pi pi-ticket' },
  ];

  permissionActions: { key: PermissionAction; label: string }[] = [
    { key: 'view', label: 'Ver' },
    { key: 'add', label: 'Agregar' },
    { key: 'edit', label: 'Editar' },
    { key: 'delete', label: 'Eliminar' },
  ];

  editPermissions = signal<RolePermissions>({
    groups: { view: false, add: false, edit: false, delete: false },
    users: { view: false, add: false, edit: false, delete: false },
    tickets: { view: false, add: false, edit: false, delete: false },
  });

  // Form fields — adaptados al backend
  editId = signal<string | null>(null);
  editUserName = signal('');
  editFirstName = signal('');
  editMiddleName = signal('');
  editLastName = signal('');
  editEmail = signal('');
  editPassword = signal('');

  // Data
  users = this.userService.users;
  availablePermissions = this.userService.availablePermissions;
  loading = this.userService.loading;

  filteredUsers = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(
      (u) =>
        this.userService.getFullName(u).toLowerCase().includes(term) ||
        u.userName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  });

  // Validation
  isFormValid = computed(() => {
    const isEdit = this.isEditMode();
    const hasUserName = this.editUserName().trim().length > 0;
    const hasFirstName = this.editFirstName().trim().length > 0;
    const hasLastName = this.editLastName().trim().length > 0;
    const hasEmail = this.editEmail().trim().length > 0;
    // Password solo requerido al crear
    const hasPassword = isEdit || this.editPassword().trim().length > 0;

    return hasUserName && hasFirstName && hasLastName && hasEmail && hasPassword;
  });

  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario'
  );

  ngOnInit(): void {
    // Cargar usuarios al iniciar
    this.userService.loadUsers().subscribe({
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron cargar los usuarios',
          life: 5000,
        });
      },
    });

    // Cargar permisos disponibles para el diálogo de permisos
    this.userService.loadAvailablePermissions().subscribe({
      error: (err) => {
        // Silenciar error de permisos no disponibles (puede faltar permiso canRead_Users)
        console.warn('No se pudieron cargar los permisos disponibles:', err?.error?.message);
      },
    });
  }

  /** Obtiene el nombre completo de un UserBackend */
  getFullName(user: UserBackend): string {
    return this.userService.getFullName(user);
  }

  openNew(): void {
    this.resetForm();
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editUser(user: UserBackend): void {
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(user.id);
    this.editUserName.set(user.userName);
    this.editFirstName.set(user.firstName);
    this.editMiddleName.set(user.middleName || '');
    this.editLastName.set(user.lastName);
    this.editEmail.set(user.email);
    this.editPassword.set(''); // No se muestra la contraseña actual
    this.dialogVisible.set(true);
  }

  confirmDelete(user: UserBackend): void {
    const fullName = this.getFullName(user);
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas desactivar al usuario "${fullName}"?`,
      header: 'Confirmar Desactivacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deactivateUser(user.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Desactivado',
              detail: `El usuario "${fullName}" ha sido desactivado`,
              life: 3000,
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'No se pudo desactivar el usuario',
              life: 5000,
            });
          },
        });
      },
    });
  }

  saveUser(): void {
    this.submitted.set(true);
    if (!this.isFormValid()) return;

    this.saving.set(true);

    if (this.isEditMode()) {
      const userId = this.editId()!;
      this.userService.updateUser(userId, {
        userName: this.editUserName().trim(),
        firstName: this.editFirstName().trim(),
        middleName: this.editMiddleName().trim() || null,
        lastName: this.editLastName().trim(),
        email: this.editEmail().trim(),
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.resetForm();
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `El usuario "${this.editFirstName().trim()} ${this.editLastName().trim()}" ha sido actualizado`,
            life: 3000,
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'No se pudo actualizar el usuario',
            life: 5000,
          });
        },
      });
    } else {
      this.userService.createUser({
        userName: this.editUserName().trim(),
        firstName: this.editFirstName().trim(),
        middleName: this.editMiddleName().trim() || null,
        lastName: this.editLastName().trim(),
        email: this.editEmail().trim(),
        password: this.editPassword().trim(),
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.resetForm();
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: `El usuario "${this.editFirstName().trim()} ${this.editLastName().trim()}" ha sido creado`,
            life: 3000,
          });
        },
        error: (err) => {
          this.saving.set(false);
          const detail = err?.error?.intOpCode === 'EUSCF409'
            ? 'Ya existe un usuario con ese correo electronico'
            : (err?.error?.message || 'No se pudo crear el usuario');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail,
            life: 5000,
          });
        },
      });
    }
  }

  hideDialog(): void {
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  // =====================================================================
  // DIÁLOGO DE PERMISOS — basado en UUID checkboxes
  // =====================================================================

  openPermissions(user: UserBackend): void {
    this.permissionsUserId.set(user.id);
    this.permissionsUserName.set(this.getFullName(user));

    // Mapear los nombres de permisos del usuario a los UUIDs correspondientes
    const userPermNames = user.permissions || [];
    const allPerms = this.availablePermissions();
    const selectedIds = allPerms
      .filter((p) => userPermNames.includes(p.name))
      .map((p) => p.id);
    this.selectedPermissionIds.set(selectedIds);

    this.permissionsDialogVisible.set(true);
  }

  /** Verifica si un permiso (por UUID) está seleccionado */
  isPermissionSelected(permId: string): boolean {
    return this.selectedPermissionIds().includes(permId);
  }

  /** Toggle de un permiso (por UUID) en la selección */
  togglePermission(permId: string, checked: boolean): void {
    if (checked) {
      this.selectedPermissionIds.update((ids) => [...ids, permId]);
    } else {
      this.selectedPermissionIds.update((ids) => ids.filter((id) => id !== permId));
    }
  }

  savePermissions(): void {
    const userId = this.permissionsUserId();
    if (!userId) return;

    this.savingPermissions.set(true);
    this.userService.updatePermissions(userId, {
      permissionIds: this.selectedPermissionIds(),
    }).subscribe({
      next: () => {
        this.savingPermissions.set(false);
        this.permissionsDialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Permisos actualizados',
          detail: `Los permisos de "${this.permissionsUserName()}" han sido actualizados`,
          life: 3000,
        });
      },
      error: (err) => {
        this.savingPermissions.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron actualizar los permisos',
          life: 5000,
        });
      },
    });
  }

  hidePermissionsDialog(): void {
    this.permissionsDialogVisible.set(false);
  }

  // =====================================================================
  // LEGACY: getPermission / setPermission (preservados — NO eliminar)
  // =====================================================================

  getPermission(module: PermissionModule, action: PermissionAction): boolean {
    return this.editPermissions()[module][action];
  }

  setPermission(module: PermissionModule, action: PermissionAction, value: boolean): void {
    this.editPermissions.update((perms) => ({
      ...perms,
      [module]: {
        ...perms[module],
        [action]: value,
      },
    }));
  }

  private resetForm(): void {
    this.editId.set(null);
    this.editUserName.set('');
    this.editFirstName.set('');
    this.editMiddleName.set('');
    this.editLastName.set('');
    this.editEmail.set('');
    this.editPassword.set('');
  }
}
