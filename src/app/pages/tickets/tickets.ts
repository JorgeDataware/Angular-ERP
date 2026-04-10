import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TicketService } from '../../core/services/ticket.service';
import { GroupService } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import {
  TicketBackend, TicketStatusBackend, TicketPriorityBackend, TicketPriorityPayload,
  CreateTicketPayload, UpdateTicketPayload, TagSeverity,
  TICKET_STATUS_LABELS, TICKET_STATUS_SEVERITY,
  TICKET_PRIORITY_LABELS, TICKET_PRIORITY_SEVERITY,
  TICKET_PRIORITY_FORM_OPTIONS, TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS,
  TICKET_PRIORITY_TO_PAYLOAD,
} from '../../core/models/ticket';
import { GroupMember } from '../../core/models/group';

@Component({
  selector: 'app-tickets',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    SelectModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TabsModule,
    ToggleButtonModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  private ticketService = inject(TicketService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Group context (UUID from route param)
  groupId = signal<string | null>(null);
  groupName = signal('');

  // View mode
  kanbanView = signal(false);

  // Loading
  loading = computed(() => this.ticketService.loading());

  // Kanban: 3 columns — Open / InProgress / Closed (status 3 exists in enum but is unused)
  kanbanStatuses: TicketStatusBackend[] = [1, 2, 4];

  kanbanColumns = computed(() => {
    const tickets = this.filteredTickets();
    return this.kanbanStatuses.map((status) => ({
      status,
      label: TICKET_STATUS_LABELS[status],
      cssClass: this.getKanbanHeaderClass(status),
      tickets: tickets.filter((t) => t.status === status),
    }));
  });

  // Filters
  filterStatus = signal<TicketStatusBackend | null>(null);
  filterPriority = signal<TicketPriorityBackend | null>(null);
  filterAssigned = signal<string | null>(null);

  statusFilterOptions = [
    { label: 'Todos', value: null as TicketStatusBackend | null },
    ...TICKET_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value as TicketStatusBackend | null })),
  ];

  priorityFilterOptions = [
    { label: 'Todas', value: null as TicketPriorityBackend | null },
    ...TICKET_PRIORITY_OPTIONS.map(o => ({ label: o.label, value: o.value as TicketPriorityBackend | null })),
  ];

  /** Unique assigned user names from loaded tickets */
  assignedFilterOptions = computed(() => {
    const names = new Set<string>();
    for (const t of this.ticketService.tickets()) {
      if (t.assignedUserName) names.add(t.assignedUserName);
    }
    const sorted = Array.from(names).sort();
    return [
      { label: 'Todos', value: null as string | null },
      ...sorted.map(n => ({ label: n, value: n as string | null })),
    ];
  });

  // Data — all tickets or filtered by group
  tickets = computed(() => {
    const gid = this.groupId();
    const all = this.ticketService.tickets();
    if (gid) {
      return all.filter(t => t.groupId === gid);
    }
    return all;
  });

  // Dialog state
  dialogVisible = signal(false);
  isEditMode = signal(false);
  submitted = signal(false);
  detailDialogVisible = signal(false);
  selectedTicket = signal<TicketBackend | null>(null);

  // Assign dialog
  assignDialogVisible = signal(false);
  assignTicketId = signal<string | null>(null);
  assignGroupId = signal<string | null>(null);
  assignMembers = signal<GroupMember[]>([]);
  assignSelectedUserId = signal<string | null>(null);
  assignLoading = signal(false);

  // Form fields for create/edit
  editId = signal<string | null>(null);
  editTitle = signal('');
  editDescription = signal('');
  editComments = signal('');
  editPriority = signal<TicketPriorityPayload>('Medium');
  editGroupId = signal<string | null>(null);
  editDueDate = signal<Date | null>(null);

  // Options for form selects
  priorityFormOptions = TICKET_PRIORITY_FORM_OPTIONS;

  groupOptions = computed(() =>
    this.groupService.groups().map(g => ({ label: g.name, value: g.id }))
  );

  // Search
  searchValue = signal('');

  filteredTickets = computed(() => {
    const term = this.searchValue().toLowerCase().trim();
    let list = this.tickets();

    const status = this.filterStatus();
    if (status !== null) {
      list = list.filter(t => t.status === status);
    }

    const priority = this.filterPriority();
    if (priority !== null) {
      list = list.filter(t => t.priority === priority);
    }

    const assigned = this.filterAssigned();
    if (assigned) {
      list = list.filter(t => t.assignedUserName === assigned);
    }

    if (term) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        (t.assignedUserName?.toLowerCase().includes(term) ?? false) ||
        t.createdByUserName.toLowerCase().includes(term) ||
        t.groupName.toLowerCase().includes(term)
      );
    }

    return list;
  });

  // Validation: create needs title, description, priority, groupId. Edit needs at least title.
  isFormValid = computed(() => {
    if (this.isEditMode()) {
      // Edit: at least something provided, title not empty
      return this.editTitle().trim().length > 0;
    }
    // Create
    return (
      this.editTitle().trim().length > 0 &&
      this.editDescription().trim().length > 0 &&
      this.editGroupId() !== null
    );
  });

  // Dialog title
  dialogTitle = computed(() =>
    this.isEditMode() ? 'Editar Ticket' : 'Nuevo Ticket'
  );

  // Permissions
  canCreate = computed(() => this.authService.hasPermission('tickets', 'add'));
  canEdit = computed(() => this.authService.hasPermission('tickets', 'edit'));
  canAssign = computed(() => this.authService.hasRawPermission('canAssign_Tickets'));
  canUpdateStatus = computed(() => this.authService.hasRawPermission('canUpdateStatus_Tickets'));

  // Drag & Drop state
  draggedTicket = signal<TicketBackend | null>(null);
  dragOverColumn = signal<TicketStatusBackend | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['groupId']) {
        this.groupId.set(params['groupId']);
      }
    });
    this.route.queryParams.subscribe((qp) => {
      if (qp['groupName']) {
        this.groupName.set(qp['groupName']);
      }
    });
    // Load data
    this.ticketService.loadTickets();
    this.groupService.loadGroups();
  }

  // ----------------------------------------------------------
  // CREATE / EDIT dialog
  // ----------------------------------------------------------

  openNew(): void {
    this.resetForm();
    // Pre-select group if in group context
    if (this.groupId()) {
      this.editGroupId.set(this.groupId());
    }
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editTicket(ticket: TicketBackend): void {
    // Can only edit Open (status=1) tickets
    if (ticket.status !== 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No editable',
        detail: 'Solo se pueden editar tickets abiertos',
        life: 3000,
      });
      return;
    }
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.editId.set(ticket.id);
    this.editTitle.set(ticket.title);
    this.editDescription.set(ticket.description);
    this.editComments.set(ticket.comments ?? '');
    this.editPriority.set(TICKET_PRIORITY_TO_PAYLOAD[ticket.priority]);
    this.editGroupId.set(ticket.groupId);
    this.editDueDate.set(ticket.dueDate ? new Date(ticket.dueDate) : null);
    this.dialogVisible.set(true);
  }

  async saveTicket(): Promise<void> {
    this.submitted.set(true);
    if (!this.isFormValid()) return;

    try {
      if (this.isEditMode()) {
        const payload: UpdateTicketPayload = {};
        if (this.editTitle().trim()) payload.title = this.editTitle().trim();
        if (this.editDescription().trim()) payload.description = this.editDescription().trim();
        if (this.editComments().trim()) payload.comments = this.editComments().trim();
        payload.priority = this.editPriority();
        if (this.editDueDate()) {
          payload.dueDate = this.formatDate(this.editDueDate()!);
        }
        await this.ticketService.updateTicket(this.editId()!, payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: `El ticket "${this.editTitle().trim()}" ha sido actualizado`,
          life: 3000,
        });
      } else {
        const payload: CreateTicketPayload = {
          title: this.editTitle().trim(),
          description: this.editDescription().trim(),
          priority: this.editPriority(),
          groupId: this.editGroupId()!,
        };
        if (this.editComments().trim()) payload.comments = this.editComments().trim();
        if (this.editDueDate()) payload.dueDate = this.formatDate(this.editDueDate()!);

        await this.ticketService.createTicket(payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Creado',
          detail: `El ticket "${this.editTitle().trim()}" ha sido creado`,
          life: 3000,
        });
      }
      this.dialogVisible.set(false);
      this.resetForm();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al guardar el ticket';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: msg,
        life: 5000,
      });
    }
  }

  // ----------------------------------------------------------
  // DETAIL dialog
  // ----------------------------------------------------------

  viewTicketDetail(ticket: TicketBackend): void {
    this.selectedTicket.set(ticket);
    this.detailDialogVisible.set(true);
  }

  // ----------------------------------------------------------
  // ASSIGN workflow
  // ----------------------------------------------------------

  async openAssignDialog(ticket: TicketBackend): Promise<void> {
    this.assignTicketId.set(ticket.id);
    this.assignGroupId.set(ticket.groupId);
    this.assignSelectedUserId.set(null);
    this.assignLoading.set(true);
    this.assignDialogVisible.set(true);

    try {
      const members = await firstValueFrom(
        this.groupService.getGroupMembers(ticket.groupId)
      );
      this.assignMembers.set(members);
    } catch {
      this.assignMembers.set([]);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los miembros del grupo',
        life: 3000,
      });
    } finally {
      this.assignLoading.set(false);
    }
  }

  assignMemberOptions = computed(() =>
    this.assignMembers().map(m => ({ label: m.completeName || m.userName, value: m.id }))
  );

  async confirmAssign(): Promise<void> {
    const ticketId = this.assignTicketId();
    const userId = this.assignSelectedUserId();
    if (!ticketId || !userId) return;

    try {
      await this.ticketService.assignTicket(ticketId, { assignedUserId: userId });
      this.messageService.add({
        severity: 'success',
        summary: 'Asignado',
        detail: 'El ticket ha sido asignado correctamente',
        life: 3000,
      });
      this.assignDialogVisible.set(false);
      // Refresh detail if open
      this.refreshSelectedTicket(ticketId);
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al asignar el ticket';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: msg,
        life: 5000,
      });
    }
  }

  // ----------------------------------------------------------
  // START WORK workflow
  // ----------------------------------------------------------

  async startWork(ticket: TicketBackend): Promise<void> {
    this.confirmationService.confirm({
      message: `¿Deseas iniciar el trabajo en "${ticket.title}"?`,
      header: 'Iniciar trabajo',
      icon: 'pi pi-play',
      acceptLabel: 'Iniciar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.ticketService.startWork(ticket.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Iniciado',
            detail: `El trabajo en "${ticket.title}" ha comenzado`,
            life: 3000,
          });
          this.refreshSelectedTicket(ticket.id);
        } catch (err: any) {
          const msg = err?.error?.message ?? 'Error al iniciar el trabajo';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
            life: 5000,
          });
        }
      },
    });
  }

  // ----------------------------------------------------------
  // FINISH workflow
  // ----------------------------------------------------------

  async finishTicket(ticket: TicketBackend): Promise<void> {
    this.confirmationService.confirm({
      message: `¿Deseas finalizar el ticket "${ticket.title}"?`,
      header: 'Finalizar ticket',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Finalizar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.ticketService.finishTicket(ticket.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Finalizado',
            detail: `El ticket "${ticket.title}" ha sido finalizado`,
            life: 3000,
          });
          this.refreshSelectedTicket(ticket.id);
        } catch (err: any) {
          const msg = err?.error?.message ?? 'Error al finalizar el ticket';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
            life: 5000,
          });
        }
      },
    });
  }

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  clearFilters(): void {
    this.filterStatus.set(null);
    this.filterPriority.set(null);
    this.filterAssigned.set(null);
    this.searchValue.set('');
  }

  hideDialog(): void {
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }

  // ----------------------------------------------------------
  // DRAG & DROP — Kanban workflow transitions
  // ----------------------------------------------------------

  onDragStart(event: DragEvent, ticket: TicketBackend): void {
    this.draggedTicket.set(ticket);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', ticket.id);
    }
  }

  onDragEnd(): void {
    this.draggedTicket.set(null);
    this.dragOverColumn.set(null);
  }

  onDragOver(event: DragEvent, status: TicketStatusBackend): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const dragged = this.draggedTicket();
    if (dragged && dragged.status !== status) {
      this.dragOverColumn.set(status);
    }
  }

  onDragLeave(event: DragEvent, status: TicketStatusBackend): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      if (this.dragOverColumn() === status) {
        this.dragOverColumn.set(null);
      }
    }
  }

  async onDrop(event: DragEvent, newStatus: TicketStatusBackend): Promise<void> {
    event.preventDefault();
    this.dragOverColumn.set(null);

    const ticket = this.draggedTicket();
    if (!ticket || ticket.status === newStatus) {
      this.draggedTicket.set(null);
      return;
    }

    // Validate allowed transitions:
    // Open(1) → InProgress(2): start-work (canUpdateStatus)
    // InProgress(2) → Closed(4): finish (canUpdateStatus)
    // Status 3 (OnRevision) exists in enum but is not used in workflow
    // Other transitions not allowed via backend
    try {
      if (ticket.status === 1 && newStatus === 2) {
        // start-work
        if (!this.canUpdateStatus()) {
          this.showNoPermission();
          this.draggedTicket.set(null);
          return;
        }
        await this.ticketService.startWork(ticket.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Iniciado',
          detail: `"${ticket.title}" movido a En progreso`,
          life: 3000,
        });
      } else if (ticket.status === 2 && newStatus === 4) {
        // finish
        if (!this.canUpdateStatus()) {
          this.showNoPermission();
          this.draggedTicket.set(null);
          return;
        }
        await this.ticketService.finishTicket(ticket.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Finalizado',
          detail: `"${ticket.title}" movido a Cerrado`,
          life: 3000,
        });
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Transicion no permitida',
          detail: 'Solo se permite: Abierto → En progreso → Cerrado',
          life: 3000,
        });
      }
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al cambiar el estado';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: msg,
        life: 5000,
      });
    }

    this.draggedTicket.set(null);
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  private resetForm(): void {
    this.editId.set(null);
    this.editTitle.set('');
    this.editDescription.set('');
    this.editComments.set('');
    this.editPriority.set('Medium');
    this.editGroupId.set(null);
    this.editDueDate.set(null);
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }

  private showNoPermission(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Sin permiso',
      detail: 'No tienes permiso para realizar esta accion',
      life: 3000,
    });
  }

  /** After a workflow action, refresh selectedTicket if detail dialog is open */
  private refreshSelectedTicket(ticketId: string): void {
    const sel = this.selectedTicket();
    if (sel && sel.id === ticketId) {
      const updated = this.ticketService.tickets().find(t => t.id === ticketId);
      if (updated) this.selectedTicket.set({ ...updated });
    }
  }

  // Template helpers
  getStatusLabel(status: TicketStatusBackend): string {
    return TICKET_STATUS_LABELS[status] ?? 'Desconocido';
  }

  getStatusSeverity(status: TicketStatusBackend): TagSeverity {
    return TICKET_STATUS_SEVERITY[status] ?? 'info';
  }

  getPriorityLabel(priority: TicketPriorityBackend): string {
    return TICKET_PRIORITY_LABELS[priority] ?? 'Desconocida';
  }

  getPrioritySeverity(priority: TicketPriorityBackend): TagSeverity {
    return TICKET_PRIORITY_SEVERITY[priority] ?? 'info';
  }

  getKanbanHeaderClass(status: TicketStatusBackend): string {
    switch (status) {
      case 1: return 'kanban-header-open';
      case 2: return 'kanban-header-in-progress';
      case 4: return 'kanban-header-closed';
      default: return '';
    }
  }

  /** Whether a ticket can be dragged in kanban (only Open or InProgress, with permission) */
  canDragTicket(ticket: TicketBackend): boolean {
    return this.canUpdateStatus() && (ticket.status === 1 || ticket.status === 2);
  }

  /** Whether a ticket is Open and unassigned (can be assigned) */
  isAssignable(ticket: TicketBackend): boolean {
    return ticket.status === 1 && !ticket.assignedUserId;
  }

  /** Whether start-work can be called on this ticket */
  canStartWork(ticket: TicketBackend): boolean {
    return ticket.status === 1 && !!ticket.assignedUserId;
  }

  /** Whether finish can be called on this ticket */
  canFinish(ticket: TicketBackend): boolean {
    return ticket.status === 2;
  }

  /** Whether the ticket is Open (editable) */
  isOpen(ticket: TicketBackend): boolean {
    return ticket.status === 1;
  }

  formatDateDisplay(dateStr: string | null): string {
    if (!dateStr) return '-';
    // Return just the date part
    return dateStr.substring(0, 10);
  }
}
