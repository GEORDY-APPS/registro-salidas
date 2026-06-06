// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'apu_token';
  private readonly ROLE_KEY  = 'apu_role';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<{ token: string; rol: string }> {
    return this.http
      .post<{ token: string; rol: string }>(`${environment.apiUrl}/login.php`, { username, password })
      .pipe(tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.ROLE_KEY,  res.rol);
      }));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null   { return localStorage.getItem(this.TOKEN_KEY); }
  getRole():  string | null   { return localStorage.getItem(this.ROLE_KEY);  }
  isLoggedIn(): boolean       { return !!this.getToken(); }
  isAdmin(): boolean          { return this.getRole() === 'admin'; }
}
