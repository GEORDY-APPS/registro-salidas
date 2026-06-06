// src/app/services/salidas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Salida } from '../models/salida.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SalidasService {

  private base = `${environment.apiUrl}/salidas.php`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'X-Token': this.auth.getToken() || ''
    });
  }

  getSalidas(empresa?: string): Observable<Salida[]> {
    const params = empresa ? `?empresa=${encodeURIComponent(empresa)}` : '';
    return this.http.get<Salida[]>(this.base + params, { headers: this.headers() });
  }

  guardar(salida: Salida): Observable<{ id: number; ok: boolean }> {
    return this.http.post<{ id: number; ok: boolean }>(this.base, salida, { headers: this.headers() });
  }

  borrarTodo(): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(this.base, { headers: this.headers() });
  }
}
