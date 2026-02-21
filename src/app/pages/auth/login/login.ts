import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';

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
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = signal('');
  password = signal('');
  rememberMe = signal(false);

  onLogin(): void {
    console.log('Login attempt:', {
      email: this.email(),
      password: this.password(),
      rememberMe: this.rememberMe(),
    });
  }
}
