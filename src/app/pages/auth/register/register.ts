import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';

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
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  acceptTerms = signal(false);

  onRegister(): void {
    console.log('Register attempt:', {
      name: this.name(),
      email: this.email(),
      password: this.password(),
      confirmPassword: this.confirmPassword(),
      acceptTerms: this.acceptTerms(),
    });
  }
}
