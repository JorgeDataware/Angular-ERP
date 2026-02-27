import { Component, signal } from '@angular/core';
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
  // Credenciales hardcodeadas para simulacion
  private readonly VALID_CREDENTIALS = {
    email: 'admin@erp.com',
    password: 'Admin@2025!'
  };

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  errorMessage = signal('');

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

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

    // Validar credenciales
    if (this.email() === this.VALID_CREDENTIALS.email && 
        this.password() === this.VALID_CREDENTIALS.password) {
      this.messageService.add({
        severity: 'success',
        summary: 'Exito',
        detail: 'Inicio de sesion exitoso',
        life: 3000
      });
      
      console.log('Login exitoso:', {
        email: this.email(),
        rememberMe: this.rememberMe(),
      });

      // Redirigir al dashboard despues de login exitoso
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
    } else {
      this.errorMessage.set('Credenciales invalidas. Intenta con admin@erp.com / Admin@2025!');
      this.messageService.add({
        severity: 'error',
        summary: 'Error de autenticacion',
        detail: 'Credenciales invalidas',
        life: 3000
      });
    }
  }
}
