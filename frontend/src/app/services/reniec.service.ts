// src/app/services/reniec.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReniecService {
  constructor(private http: HttpClient) {}

  consultarDNI(dni: string): Observable<{ full_name?: string; [key: string]: any }> {
    return this.http.post<any>(`${environment.apiUrl}/reniec.php`, { dni });
  }
}
