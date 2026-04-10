import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  errorMessage = signal('');
  loading = signal(false);

  credentialsHint = this.authService.getCredentialsHint();

  onLogin(): void {
    this.errorMessage.set('');

    // Validar campos vacios
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Por favor completa todos los campos');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor completa todos los campos',
        life: 3000
      });
      return;
    }

    this.loading.set(true);

    // Llamada HTTP real al API Gateway
    this.authService.login(this.email(), this.password()).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Inicio de sesion exitoso',
          life: 3000
        });

        // Redirigir al dashboard de grupos despues de login exitoso
        setTimeout(() => {
          this.router.navigate(['/groups']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        let detail = 'Credenciales invalidas';
        if (error.error?.message) {
          detail = error.error.message;
        } else if (error.status === 0) {
          detail = 'No se pudo conectar con el servidor. Verifica que el API Gateway esté activo.';
        } else if (error.status === 401) {
          detail = 'Credenciales invalidas. Verifica tu correo y contrasena.';
        }

        this.errorMessage.set(detail);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de autenticacion',
          detail,
          life: 5000
        });
      },
    });
  }
}
