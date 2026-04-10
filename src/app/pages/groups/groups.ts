import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Group, GroupBackend } from '../../core/models/group';
import { AuthService } from '../../core/services/auth.service';
import { GroupService } from '../../core/services/group.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-groups',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class Groups implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private router = inject(Router);

  // --- Permissions ---
  canAdd = computed(() => this.authService.hasPermission('groups', 'add'));
  canEdit = computed(() => this.authService.hasPermission('groups', 'edit'));
  canDelete = computed(() => this.authService.hasPermission('groups', 'delete'));

  // --- Data (from service) ---
  groups = this.groupService.groups;
  loading = this.groupService.loading;

  // --- Dialog state ---
  dialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);
  saving = signal(false);

  // --- Form fields (bound to dialog) ---
  // Backend only accepts name + description for create/edit.
  // Owner is auto-set from JWT. Status not editable.
  editId = signal<string | null>(null);
  editName = signal('');
  editDescription = signal('');

  // --- Group pending deactivation ---
  groupToDeactivate = signal<GroupBackend | null>(null);

  // --- Search ---
  searchValue = signal('');

  // --- Filtered data ---
  filteredGroups = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.groups();
    return this.groups().filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.owner.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term)
    );
  });

  // --- Validation ---
  isFormValid = computed(() => {
    return (
      this.editName().trim().length > 0 &&
      this.editDescription().trim().length > 0
    );
  });

  // --- Dialog title ---
  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Grupo' : 'Nuevo Grupo'
  );

  // --- Lifecycle ---
  ngOnInit(): void {
    this.groupService.loadGroups().subscribe({
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron cargar los grupos',
          life: 5000,
        });
      },
    });
  }

  // --- Actions ---
  openNew(): void {
    this.resetForm();
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editGroup(group: GroupBackend): void {
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(group.id);
    this.editName.set(group.name);
    this.editDescription.set(group.description);
    this.dialogVisible.set(true);
  }

  confirmDeactivate(group: GroupBackend): void {
    this.groupToDeactivate.set(group);
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas desactivar el grupo "${group.name}"?`,
      header: 'Confirmar Desactivacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deactivateGroup(group);
      },
    });
  }

  deactivateGroup(group: GroupBackend): void {
    this.groupService.deactivateGroup(group.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Desactivado',
          detail: `El grupo "${group.name}" ha sido desactivado`,
          life: 3000,
        });
        this.groupToDeactivate.set(null);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo desactivar el grupo',
          life: 5000,
        });
        this.groupToDeactivate.set(null);
      },
    });
  }

  saveGroup(): void {
    this.submitted.set(true);
    if (!this.isFormValid()) return;

    this.saving.set(true);

    if (this.isEditMode()) {
      const id = this.editId()!;
      this.groupService.updateGroup(id, {
        name: this.editName().trim(),
        description: this.editDescription().trim(),
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.resetForm();
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `El grupo "${this.editName().trim()}" ha sido actualizado`,
            life: 3000,
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'No se pudo actualizar el grupo',
            life: 5000,
          });
        },
      });
    } else {
      this.groupService.createGroup({
        name: this.editName().trim(),
        description: this.editDescription().trim(),
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible.set(false);
          this.resetForm();
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: `El grupo "${this.editName().trim()}" ha sido creado`,
            life: 3000,
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'No se pudo crear el grupo',
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

  // --- Navigation ---
  goToUsers(group: GroupBackend): void {
    this.router.navigate(['/groups', group.id, 'users'], {
      queryParams: { groupName: group.name },
    });
  }

  goToTicketDashboard(group: GroupBackend): void {
    this.router.navigate(['/ticket-dashboard', group.id], {
      queryParams: { groupName: group.name },
    });
  }

  // --- Helpers ---
  private resetForm(): void {
    this.editId.set(null);
    this.editName.set('');
    this.editDescription.set('');
  }

  getStatusLabel(status: number): string {
    return this.groupService.getStatusLabel(status);
  }

  getStatusSeverity(status: number): 'success' | 'danger' {
    return this.groupService.getStatusSeverity(status);
  }
}
