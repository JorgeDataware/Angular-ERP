import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket, TicketBackend, TicketStatusBackend, TicketPriorityBackend, TagSeverity, TICKET_STATUS_LABELS, TICKET_STATUS_SEVERITY, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_SEVERITY } from '../../core/models/ticket';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    MessageModule,
    DialogModule,
    ConfirmDialogModule,
    TagModule,
    TableModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly SPECIAL_CHARS = '!@#$%^&*';
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private ticketService = inject(TicketService);

  // --- Tickets assigned to current user ---
  assignedTickets = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.ticketService.tickets().filter(
      (t) => t.assignedUserName === this.authService.fullName()
    );
  });

  // --- Datos de perfil (cargados desde GET /users/me) ---
  userName = signal('');
  firstName = signal('');
  middleName = signal('');
  lastName = signal('');
  email = signal('');

  // --- Password change fields ---
  currentPassword = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');

  // --- Backup para cancelar edicion ---
  private backup = {
    userName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
  };

  // --- Estado de UI ---
  editing = signal(false);
  deleted = signal(false);
  saving = signal(false);
  changingPassword = signal(false);
  loadingProfile = signal(false);

  // --- Indicador de diálogo de cambio de contraseña ---
  passwordDialogVisible = signal(false);

  // --- Validaciones ---
  userNameError = computed(() => {
    if (!this.editing()) return '';
    const val = this.userName();
    if (val.trim().length === 0) return 'El usuario es requerido';
    if (/\s/.test(val)) return 'El usuario no puede contener espacios en blanco';
    return '';
  });

  firstNameError = computed(() => {
    if (!this.editing()) return '';
    const val = this.firstName();
    if (val.trim().length === 0) return 'El nombre es requerido';
    return '';
  });

  lastNameError = computed(() => {
    if (!this.editing()) return '';
    const val = this.lastName();
    if (val.trim().length === 0) return 'El apellido es requerido';
    return '';
  });

  emailError = computed(() => {
    if (!this.editing()) return '';
    const val = this.email();
    if (val.trim().length === 0) return 'El correo es requerido';
    if (/\s/.test(val)) return 'El correo no puede contener espacios en blanco';
    return '';
  });

  newPasswordErrors = computed(() => {
    const errors: string[] = [];
    const pwd = this.newPassword();
    if (pwd.length === 0) {
      errors.push('La nueva contrasena es requerida');
      return errors;
    }
    if (/\s/.test(pwd)) errors.push('La contrasena no puede contener espacios en blanco');
    if (pwd.length < 10) errors.push('La contrasena debe tener al menos 10 caracteres');
    if (!this.hasSpecialChar(pwd))
      errors.push(`Debe incluir al menos un simbolo especial (${this.SPECIAL_CHARS})`);
    return errors;
  });

  passwordsMatch = computed(() => {
    const pwd = this.newPassword();
    const confirm = this.confirmNewPassword();
    return pwd.length > 0 && confirm.length > 0 && pwd === confirm;
  });

  passwordsDontMatch = computed(() => {
    const confirm = this.confirmNewPassword();
    return confirm.length > 0 && !this.passwordsMatch();
  });

  isPasswordFormValid = computed(() => {
    const currentPwd = this.currentPassword();
    const newPwd = this.newPassword();
    return (
      currentPwd.trim().length > 0 &&
      newPwd.length >= 10 &&
      !/\s/.test(newPwd) &&
      this.hasSpecialChar(newPwd) &&
      this.passwordsMatch()
    );
  });

  isFormValid = computed(() => {
    const user = this.userName();
    const first = this.firstName();
    const last = this.lastName();
    const mail = this.email();

    return (
      user.trim().length > 0 &&
      !/\s/.test(user) &&
      first.trim().length > 0 &&
      last.trim().length > 0 &&
      mail.trim().length > 0 &&
      !/\s/.test(mail)
    );
  });

  /** Nombre completo para display */
  fullName = computed(() => {
    return [this.firstName(), this.middleName(), this.lastName()].filter(Boolean).join(' ');
  });

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private hasSpecialChar(str: string): boolean {
    return this.SPECIAL_CHARS.split('').some((char) => str.includes(char));
  }

  // --- Cargar perfil desde el backend ---
  private loadProfile(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.userName.set(user.userName);
      this.firstName.set(user.firstName);
      this.middleName.set(user.middleName || '');
      this.lastName.set(user.lastName);
      this.email.set(user.email);
    }
  }

  // --- Acciones ---
  startEdit(): void {
    this.backup = {
      userName: this.userName(),
      firstName: this.firstName(),
      middleName: this.middleName(),
      lastName: this.lastName(),
      email: this.email(),
    };
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.userName.set(this.backup.userName);
    this.firstName.set(this.backup.firstName);
    this.middleName.set(this.backup.middleName);
    this.lastName.set(this.backup.lastName);
    this.email.set(this.backup.email);
    this.editing.set(false);
  }

  saveProfile(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario invalido',
        detail: 'Corrige los errores antes de guardar',
        life: 3000,
      });
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    this.saving.set(true);

    this.userService.updateUser(user.id, {
      userName: this.userName().trim(),
      firstName: this.firstName().trim(),
      middleName: this.middleName().trim() || null,
      lastName: this.lastName().trim(),
      email: this.email().trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);

        // Actualizar el currentUser en AuthService con los datos nuevos
        this.authService.currentUser.set({
          ...user,
          userName: this.userName().trim(),
          firstName: this.firstName().trim(),
          middleName: this.middleName().trim() || '',
          lastName: this.lastName().trim(),
          email: this.email().trim(),
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Perfil actualizado',
          detail: 'Los cambios han sido guardados correctamente',
          life: 3000,
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo actualizar el perfil',
          life: 5000,
        });
      },
    });
  }

  // --- Cambio de contraseña ---
  openPasswordDialog(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmNewPassword.set('');
    this.passwordDialogVisible.set(true);
  }

  hidePasswordDialog(): void {
    this.passwordDialogVisible.set(false);
  }

  changePassword(): void {
    if (!this.isPasswordFormValid()) return;

    const user = this.authService.currentUser();
    if (!user) return;

    this.changingPassword.set(true);

    this.userService.changePassword(user.id, {
      currentPassword: this.currentPassword().trim(),
      newPassword: this.newPassword().trim(),
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordDialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Contrasena actualizada',
          detail: 'Tu contrasena ha sido cambiada correctamente',
          life: 3000,
        });
      },
      error: (err) => {
        this.changingPassword.set(false);
        const detail = err?.error?.intOpCode === 'EUSCF409'
          ? 'La contrasena actual es incorrecta'
          : (err?.error?.message || 'No se pudo cambiar la contrasena');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail,
          life: 5000,
        });
      },
    });
  }

  // --- Desactivar cuenta ---
  confirmDelete(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas desactivar tu cuenta? Esta acción marcará tu perfil como eliminado.',
      header: 'Confirmar Desactivacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const user = this.authService.currentUser();
        if (!user) return;

        this.userService.deactivateUser(user.id).subscribe({
          next: () => {
            this.deleted.set(true);
            this.editing.set(false);
            this.messageService.add({
              severity: 'warn',
              summary: 'Cuenta desactivada',
              detail: 'Tu cuenta ha sido marcada como eliminada',
              life: 3000,
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'No se pudo desactivar la cuenta',
              life: 5000,
            });
          },
        });
      },
    });
  }

  restoreAccount(): void {
    this.deleted.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Cuenta restaurada',
      detail: 'Tu cuenta ha sido reactivada correctamente',
      life: 3000,
    });
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
}
