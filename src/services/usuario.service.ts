import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from './envfile';

export interface Usuario {
  idUsuario: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  ativo: boolean;
  bloqueado: boolean;
  permissoes?: Permissao[];
  empresas?: Empresa[];
  idUsuarioCadastro: number;
  dataInclusao?: Date;
  dataAlteracao?: Date;
  dataExclusao?: Date;
}

export interface Permissao {
  idPermissao: number;
  nome: string;
  ativo: boolean;
}

export interface Empresa {
  idEmpresa: number;
  nome: string;
  nomeFantasia?: string;
}

export interface CreateUsuarioDto {
  nome: string;
  email: string;
  tipoUsuario: string;
  permissoes: string[];
  ativo?: boolean;
  bloqueado?: boolean;
  idEmpresa?: number;
}

export interface UpdateUsuarioDto {
  nome?: string;
  email?: string;
  tipoUsuario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${env.BASE_URL}/usuario`;

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

  listarUsuarios(idEmpresa?: number): Observable<Usuario[]> {
    let params = new HttpParams();
    if (idEmpresa) {
      params = params.set('idEmpresa', idEmpresa.toString());
    }
    return this.http.get<Usuario[]>(this.apiUrl, { 
      headers: this.getAuthHeaders(), 
      params 
    });
  }

  buscarUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  criarUsuario(usuario: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario, { 
      headers: this.getAuthHeaders() 
    });
  }

  editarUsuario(id: number, usuario: UpdateUsuarioDto): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario, { 
      headers: this.getAuthHeaders() 
    });
  }

  ativarUsuario(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/ativar`, {}, { 
      headers: this.getAuthHeaders() 
    });
  }

  inativarUsuario(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/inativar`, {}, { 
      headers: this.getAuthHeaders() 
    });
  }

  adicionarPermissao(id: number, permissao: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/permissoes`, { permissao }, { 
      headers: this.getAuthHeaders() 
    });
  }

  removerPermissao(id: number, permissao: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}/permissoes/${permissao}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  listarUsuariosPorEmpresa(idEmpresa: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/empresa/${idEmpresa}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  resetarSenha(id: number): Observable<{ senhaGerada: string }> {
    return this.http.post<{ senhaGerada: string }>(`${this.apiUrl}/${id}/reset-password`, {}, { 
      headers: this.getAuthHeaders() 
    });
  }

  alterarSenha(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, data, { 
      headers: this.getAuthHeaders() 
    });
  }
}
