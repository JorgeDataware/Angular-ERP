import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { RegisterUserPayload } from '../../../core/models/user';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    DividerModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  // Simbolos especiales permitidos
  private readonly SPECIAL_CHARS = '!@#$%^&*';

  // Campos del formulario — adaptados al backend
  userName = signal('');
  firstName = signal('');
  middleName = signal('');
  lastName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  isAdult = signal(false);
  acceptTerms = signal(false);

  /** Indicador de carga durante el registro */
  loading = signal(false);

  // Validaciones computadas
  userNameError = computed(() => {
    const val = this.userName();
    if (val.length > 0 && /\s/.test(val)) {
      return 'El usuario no puede contener espacios en blanco';
    }
    return '';
  });

  firstNameError = computed(() => {
    const val = this.firstName();
    if (val.length > 0 && /\s{2,}/.test(val)) {
      return 'El nombre no puede contener dos espacios seguidos';
    }
    return '';
  });

  lastNameError = computed(() => {
    const val = this.lastName();
    if (val.length > 0 && /\s{2,}/.test(val)) {
      return 'El apellido no puede contener dos espacios seguidos';
    }
    return '';
  });

  emailError = computed(() => {
    const val = this.email();
    if (val.length > 0 && /\s/.test(val)) {
      return 'El correo no puede contener espacios en blanco';
    }
    return '';
  });

  passwordErrors = computed(() => {
    const errors: string[] = [];
    const pwd = this.password();

    if (pwd.length > 0 && /\s/.test(pwd)) {
      errors.push('La contrasena no puede contener espacios en blanco');
    }

    if (pwd.length > 0 && pwd.length < 10) {
      errors.push('La contrasena debe tener al menos 10 caracteres');
    }

    if (pwd.length > 0 && !this.hasSpecialChar(pwd)) {
      errors.push(`Debe incluir al menos un simbolo especial (${this.SPECIAL_CHARS})`);
    }

    return errors;
  });

  passwordsMatch = computed(() => {
    const pwd = this.password();
    const confirm = this.confirmPassword();
    return pwd.length > 0 && confirm.length > 0 && pwd === confirm;
  });

  passwordsDontMatch = computed(() => {
    const confirm = this.confirmPassword();
    return confirm.length > 0 && !this.passwordsMatch();
  });

  isFormValid = computed(() => {
    const user = this.userName();
    const first = this.firstName();
    const last = this.lastName();
    const mail = this.email();
    const pwd = this.password();

    return (
      user.trim().length > 0 &&
      !/\s/.test(user) &&
      first.trim().length > 0 &&
      !/\s{2,}/.test(first) &&
      last.trim().length > 0 &&
      !/\s{2,}/.test(last) &&
      mail.trim().length > 0 &&
      !/\s/.test(mail) &&
      pwd.length >= 10 &&
      !/\s/.test(pwd) &&
      this.hasSpecialChar(pwd) &&
      this.passwordsMatch() &&
      this.isAdult() &&
      this.acceptTerms()
    );
  });

  private hasSpecialChar(str: string): boolean {
    return this.SPECIAL_CHARS.split('').some(char => str.includes(char));
  }

  onRegister(): void {
    if (!this.isFormValid() || this.loading()) return;

    this.loading.set(true);

    const payload: RegisterUserPayload = {
      userName: this.userName().trim(),
      firstName: this.firstName().trim(),
      middleName: this.middleName().trim() || null,
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      password: this.password(),
    };

    this.userService.registerUser(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Tu cuenta ha sido creada correctamente',
          life: 3000
        });

        // Redirigir al login despues de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message ?? 'Error al crear la cuenta. Intenta de nuevo.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de registro',
          detail: message,
          life: 5000
        });
      },
    });
  }
}
