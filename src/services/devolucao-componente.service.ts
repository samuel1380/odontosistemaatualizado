import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from "./envfile";

export interface DevolucaoItemPayload {
  idOrdemServicoItem: number;
  quantidade: number;
}

export interface SolicitarDevolucaoPayload {
  idFatura: number;
  observacao?: string;
  itens: DevolucaoItemPayload[];
}

export interface DevolucaoComponente {
  idDevolucao: number;
  idFatura: number;
  idOrdemServicoItem: number;
  quantidadeDevolvida: number;
  status: string;
  observacao?: string;
  dataSolicitacao: Date;
  dataConferencia?: Date;
  fatura?: {
    idFatura: number;
    idEmpresa: number;
    dataInicio?: Date | string;
    dataFim?: Date | string;
    empresa?: {
      idEmpresa: number;
      nome: string;
    };
  };
  ordemServicoItem?: {
    idOrdemServicoItem: number;
    idReferencia: number;
    descricao: string;
    quantidade: number;
    ordemServico?: {
      idOrdemServico: number;
      trabalho?: {
        idTrabalho: number;
        nomePaciente: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class DevolucaoComponenteService {
  private apiUrl = `${env.BASE_URL}/devolucao-componente`;

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

  solicitar(payload: SolicitarDevolucaoPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/solicitar`, payload, { headers: this.getAuthHeaders() });
  }

  listarPendentes(idEmpresa?: number): Observable<DevolucaoComponente[]> {
    let params = new HttpParams();
    if (idEmpresa) {
      params = params.set('idEmpresa', idEmpresa.toString());
    }
    return this.http.get<DevolucaoComponente[]>(`${this.apiUrl}/pendentes`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  listarConcluidas(idEmpresa?: number): Observable<DevolucaoComponente[]> {
    let params = new HttpParams();
    if (idEmpresa) {
      params = params.set('idEmpresa', idEmpresa.toString());
    }
    return this.http.get<DevolucaoComponente[]>(`${this.apiUrl}/concluidas`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  confirmarRecebimento(idDevolucao: number): Observable<DevolucaoComponente> {
    return this.http.post<DevolucaoComponente>(`${this.apiUrl}/${idDevolucao}/confirmar`, {}, {
      headers: this.getAuthHeaders()
    });
  }
}
