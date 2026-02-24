import { Component, signal, computed } from '@angular/core';
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
  // Simbolos especiales permitidos
  private readonly SPECIAL_CHARS = '!@#$%^&*';
  
  // Campos del formulario
  username = signal('');
  fullName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  phone = signal('');
  address = signal('');
  isAdult = signal(false);
  acceptTerms = signal(false);

  // Validaciones computadas
  passwordErrors = computed(() => {
    const errors: string[] = [];
    const pwd = this.password();
    
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

  phoneError = computed(() => {
    const phone = this.phone();
    if (phone.length > 0 && !/^\d+$/.test(phone)) {
      return 'El telefono solo debe contener numeros';
    }
    if (phone.length > 0 && phone.length < 10) {
      return 'El telefono debe tener al menos 10 digitos';
    }
    return '';
  });

  isFormValid = computed(() => {
    return (
      this.username().trim().length > 0 &&
      this.fullName().trim().length > 0 &&
      this.email().trim().length > 0 &&
      this.password().length >= 10 &&
      this.hasSpecialChar(this.password()) &&
      this.passwordsMatch() &&
      this.phone().length >= 10 &&
      /^\d+$/.test(this.phone()) &&
      this.address().trim().length > 0 &&
      this.isAdult() &&
      this.acceptTerms()
    );
  });

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  private hasSpecialChar(str: string): boolean {
    return this.SPECIAL_CHARS.split('').some(char => str.includes(char));
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Filtrar solo numeros
    const filtered = input.value.replace(/\D/g, '');
    this.phone.set(filtered);
  }

  onRegister(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario invalido',
        detail: 'Por favor completa todos los campos correctamente',
        life: 3000
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Registro exitoso',
      detail: 'Tu cuenta ha sido creada correctamente',
      life: 3000
    });

    console.log('Registro exitoso:', {
      username: this.username(),
      fullName: this.fullName(),
      email: this.email(),
      phone: this.phone(),
      address: this.address(),
      isAdult: this.isAdult(),
      acceptTerms: this.acceptTerms(),
    });

    // Redirigir al login despues de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 2000);
  }
}
