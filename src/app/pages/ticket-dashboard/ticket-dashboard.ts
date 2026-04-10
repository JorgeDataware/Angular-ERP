import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import {
  TicketBackend, TicketStatusBackend, TicketPriorityBackend, TagSeverity,
  TICKET_STATUS_LABELS, TICKET_STATUS_SEVERITY,
  TICKET_PRIORITY_LABELS, TICKET_PRIORITY_SEVERITY,
  TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS,
} from '../../core/models/ticket';

@Component({
  selector: 'app-ticket-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TooltipModule,
    CardModule,
  ],
  templateUrl: './ticket-dashboard.html',
  styleUrl: './ticket-dashboard.css',
})
export class TicketDashboard implements OnInit {
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Group context (UUID string from route param)
  groupId = signal<string | null>(null);
  groupName = signal('');

  // Loading
  loading = computed(() => this.ticketService.loading());

  // Filters
  filterAssigned = signal<string | null>(null);
  filterGroup = signal<string | null>(null);
  filterStatus = signal<TicketStatusBackend | null>(null);
  filterPriority = signal<TicketPriorityBackend | null>(null);
  filterCreatedFrom = signal<Date | null>(null);
  filterCreatedTo = signal<Date | null>(null);
  filterDueFrom = signal<Date | null>(null);
  filterDueTo = signal<Date | null>(null);
  searchValue = signal('');

  // Options
  statusOptions = [
    { label: 'Todos', value: null as TicketStatusBackend | null },
    ...TICKET_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value as TicketStatusBackend | null })),
  ];

  priorityOptions = [
    { label: 'Todas', value: null as TicketPriorityBackend | null },
    ...TICKET_PRIORITY_OPTIONS.map(o => ({ label: o.label, value: o.value as TicketPriorityBackend | null })),
  ];

  /** Unique assigned user names from ticket data */
  assignedOptions = computed(() => {
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

  /** Unique group names from ticket data */
  groupOptions = computed(() => {
    const groups = new Map<string, string>();
    for (const t of this.ticketService.tickets()) {
      if (!groups.has(t.groupId)) {
        groups.set(t.groupId, t.groupName);
      }
    }
    const opts: { label: string; value: string | null }[] = [
      { label: 'Todos', value: null },
    ];
    groups.forEach((name, id) => opts.push({ label: name, value: id }));
    return opts;
  });

  // All tickets (group-scoped or global)
  private allTickets = computed(() => {
    const gid = this.groupId();
    const all = this.ticketService.tickets();
    if (gid) {
      return all.filter(t => t.groupId === gid);
    }
    return all;
  });

  // Filtered tickets
  filteredTickets = computed(() => {
    let list = this.allTickets();

    // Filter by assigned user
    const assigned = this.filterAssigned();
    if (assigned) {
      list = list.filter((t: TicketBackend) => t.assignedUserName === assigned);
    }

    // Filter by group (when not scoped)
    const group = this.filterGroup();
    if (group !== null && this.groupId() === null) {
      list = list.filter((t: TicketBackend) => t.groupId === group);
    }

    // Filter by status
    const status = this.filterStatus();
    if (status !== null) {
      list = list.filter((t: TicketBackend) => t.status === status);
    }

    // Filter by priority
    const priority = this.filterPriority();
    if (priority !== null) {
      list = list.filter((t: TicketBackend) => t.priority === priority);
    }

    // Filter by creation date range
    const fcFrom = this.filterCreatedFrom();
    if (fcFrom) {
      const from = this.formatDateStr(fcFrom);
      list = list.filter((t: TicketBackend) => t.createdAt.substring(0, 10) >= from);
    }
    const fcTo = this.filterCreatedTo();
    if (fcTo) {
      const to = this.formatDateStr(fcTo);
      list = list.filter((t: TicketBackend) => t.createdAt.substring(0, 10) <= to);
    }

    // Filter by due date range
    const fdFrom = this.filterDueFrom();
    if (fdFrom) {
      const from = this.formatDateStr(fdFrom);
      list = list.filter((t: TicketBackend) => t.dueDate && t.dueDate.substring(0, 10) >= from);
    }
    const fdTo = this.filterDueTo();
    if (fdTo) {
      const to = this.formatDateStr(fdTo);
      list = list.filter((t: TicketBackend) => t.dueDate && t.dueDate.substring(0, 10) <= to);
    }

    // Search text
    const term = this.searchValue().toLowerCase().trim();
    if (term) {
      list = list.filter(
        (t: TicketBackend) =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          (t.assignedUserName?.toLowerCase().includes(term) ?? false) ||
          t.createdByUserName.toLowerCase().includes(term) ||
          t.groupName.toLowerCase().includes(term)
      );
    }

    return list;
  });

  // Summary stats — 3 statuses + priority alta
  totalTickets = computed(() => this.filteredTickets().length);
  abiertos = computed(() => this.filteredTickets().filter((t: TicketBackend) => t.status === 1).length);
  enProgreso = computed(() => this.filteredTickets().filter((t: TicketBackend) => t.status === 2).length);
  cerrados = computed(() => this.filteredTickets().filter((t: TicketBackend) => t.status === 4).length);
  prioridadAlta = computed(() => this.filteredTickets().filter((t: TicketBackend) => t.priority === 3).length);

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
    // Load tickets
    this.ticketService.loadTickets();
  }

  clearFilters(): void {
    this.filterAssigned.set(null);
    this.filterGroup.set(null);
    this.filterStatus.set(null);
    this.filterPriority.set(null);
    this.filterCreatedFrom.set(null);
    this.filterCreatedTo.set(null);
    this.filterDueFrom.set(null);
    this.filterDueTo.set(null);
    this.searchValue.set('');
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }

  goToTickets(groupId?: string): void {
    if (groupId) {
      this.router.navigate(['/tickets', groupId]);
    } else {
      this.router.navigate(['/tickets']);
    }
  }

  // Helpers
  private formatDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

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

  formatDateDisplay(dateStr: string | null): string {
    if (!dateStr) return '-';
    return dateStr.substring(0, 10);
  }
}
