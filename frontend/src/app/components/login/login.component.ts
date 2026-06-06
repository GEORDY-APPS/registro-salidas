// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username  = '';
  password  = '';
  errorMsg  = '';
  loading   = false;

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    this.errorMsg = '';
    if (!this.username || !this.password) {
      this.errorMsg = 'Ingrese usuario y contraseña';
      return;
    }
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: ()  => { this.loading = false; this.router.navigate(['/registro']); },
      error: () => { this.loading = false; this.errorMsg = 'Credenciales incorrectas'; this.password = ''; }
    });
  }
}
