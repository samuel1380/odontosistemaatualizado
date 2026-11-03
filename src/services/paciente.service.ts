import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from './envfile';
import { PacienteElement } from '../app/pages/paciente/paciente.component';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = `${env.BASE_URL}/paciente`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const currentUserString = localStorage.getItem("currentUser");
    if (currentUserString) {
      const currentUser = JSON.parse(currentUserString);
      return new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`
      });
    }
    return new HttpHeaders();
  }

  buscarPacientesPorEmpresaId(empresaId: number, idProfissional: number): Observable<PacienteElement[]> {
    return this.http.get<PacienteElement[]>(`${this.apiUrl}/empresa/${empresaId}`, { headers: this.getAuthHeaders(), params: { idProfissional } });
  }

  buscarPacientePorId(id: string): Observable<PacienteElement> {
    return this.http.get<PacienteElement>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  cadastrarPaciente(paciente: any): Observable<PacienteElement> {
    return this.http.post<PacienteElement>(this.apiUrl, paciente, { headers: this.getAuthHeaders() });
  }

  atualizarPaciente(id: string, paciente: any): Observable<PacienteElement> {
    return this.http.patch<PacienteElement>(`${this.apiUrl}/${id}`, paciente, { headers: this.getAuthHeaders() });
  }

  deletarPaciente(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
