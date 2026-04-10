import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { PasswordModule } from 'primeng/password';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { GroupService } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { User, UserBackend } from '../../core/models/user';
import { GroupMember } from '../../core/models/group';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-group-users',
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
    PasswordModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group-users.html',
  styleUrl: './group-users.css',
})
export class GroupUsers implements OnInit {
  private userService = inject(UserService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Group context
  groupId = signal<string>('');
  groupName = signal('');

  // Members loaded from GET /groups/:groupId/members
  members = signal<GroupMember[]>([]);
  loading = signal(false);

  // Add member dialog
  addMemberDialogVisible = signal(false);
  selectedUserId = signal<string | null>(null);
  addingMember = signal(false);

  // All users (for the add-member dropdown)
  allUsers = this.userService.users;

  // Users available to add (not already members)
  availableUsers = computed(() => {
    const memberIds = new Set(this.members().map((m) => m.id));
    return this.allUsers()
      .filter((u) => !memberIds.has(u.id))
      .map((u) => ({
        label: `${this.userService.getFullName(u)} (${u.userName})`,
        value: u.id,
      }));
  });

  // Search
  searchValue = signal('');

  filteredMembers = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    const list = this.members();
    if (!term) return list;
    return list.filter(
      (m) =>
        m.userName.toLowerCase().includes(term) ||
        m.completeName.toLowerCase().includes(term)
    );
  });

  // Permissions — groups edit permission needed for member management
  canEditGroup = computed(() => this.authService.hasPermission('groups', 'edit'));

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['groupId']) {
        this.groupId.set(params['groupId']);
        this.loadMembers();
      }
    });
    this.route.queryParams.subscribe((qp) => {
      if (qp['groupName']) {
        this.groupName.set(qp['groupName']);
      }
    });

    // Load all users for the add-member dropdown (if not loaded yet)
    if (this.userService.users().length === 0) {
      this.userService.loadUsers().subscribe();
    }
  }

  /** Carga los miembros del grupo desde el API Gateway */
  loadMembers(): void {
    const gId = this.groupId();
    if (!gId) return;

    this.loading.set(true);
    this.groupService.getGroupMembers(gId).subscribe({
      next: (members) => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron cargar los miembros',
          life: 5000,
        });
      },
    });
  }

  /** Abre el diálogo para agregar un miembro */
  openAddMember(): void {
    this.selectedUserId.set(null);
    this.addMemberDialogVisible.set(true);
  }

  /** Agrega el miembro seleccionado al grupo */
  addMember(): void {
    const memberId = this.selectedUserId();
    if (!memberId) return;

    this.addingMember.set(true);
    this.groupService.addMember({
      groupId: this.groupId(),
      memberId,
    }).subscribe({
      next: () => {
        this.addingMember.set(false);
        this.addMemberDialogVisible.set(false);
        this.selectedUserId.set(null);
        this.loadMembers();
        this.messageService.add({
          severity: 'success',
          summary: 'Agregado',
          detail: 'El miembro ha sido agregado al grupo',
          life: 3000,
        });
      },
      error: (err) => {
        this.addingMember.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo agregar el miembro',
          life: 5000,
        });
      },
    });
  }

  /** Confirma y remueve un miembro del grupo */
  confirmRemoveMember(member: GroupMember): void {
    this.confirmationService.confirm({
      message: `¿Estas seguro de que deseas remover a "${member.completeName}" del grupo?`,
      header: 'Confirmar Remocion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.removeMember(member);
      },
    });
  }

  removeMember(member: GroupMember): void {
    this.groupService.removeMember({
      groupId: this.groupId(),
      memberId: member.id,
    }).subscribe({
      next: () => {
        this.loadMembers();
        this.messageService.add({
          severity: 'success',
          summary: 'Removido',
          detail: `"${member.completeName}" ha sido removido del grupo`,
          life: 3000,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo remover el miembro',
          life: 5000,
        });
      },
    });
  }

  hideAddMemberDialog(): void {
    this.addMemberDialogVisible.set(false);
    this.selectedUserId.set(null);
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }
}
