import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Params } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthUserService {

    /** Próximo redirect ao login (ex.: sessionExpired) — consumido pelo layout ao deslogar. */
    private pendingLoginQueryParams: Params | null = null;

    /** Evita múltiplos redirects se várias respostas HTTP sinalizarem fim de sessão ao mesmo tempo. */
    private terminatingSession = false;

    // Constantes de perfis
    static readonly ADMIN = 'admin';
    static readonly FINANCEIRO = 'financeiro';
    static readonly VENDAS = 'vendas';
    static readonly PRODUCAO = 'producao';

    private isLogged = new BehaviorSubject<any>(null);
    private isAdmin = new BehaviorSubject<any>(null);
    private idEmpresaSelecionada = new BehaviorSubject<any>(null);
    private idEmpresaSelecionadaAdmin = new BehaviorSubject<any>(null);
    private userPermissions: string[] = [];

    get isLogged$() {
      return this.isLogged.asObservable();
    }

    get isAdmin$() {
      return this.isAdmin.asObservable();
    }

    get idEmpresaSelecionada$() {
      return this.idEmpresaSelecionada.asObservable();
    }

    get idEmpresaSelecionadaAdmin$() {
      return this.idEmpresaSelecionadaAdmin.asObservable();
    }

    hasAnyRole(permissions: string[]) {
      return permissions.some((permission: string) => this.userPermissions.indexOf(permission) != -1);
    }

    hasPermission(permission: string): boolean {
      return this.userPermissions.indexOf(permission) !== -1;
    }

    hasAllPermissions(permissions: string[]): boolean {
      return permissions.every((permission: string) => this.userPermissions.indexOf(permission) !== -1);
    }

    login(user: any) {
        this.terminatingSession = false;
        this.isLogged.next(user);
        this.admin(user);
        this.setPermissions(user);
        this.setIdEmpresaSelecionada(user.empresas && user.empresas[0] && user.empresas[0].idEmpresa);
    }

    /** Lê e zera query params extras para o redirect ao login (layout). */
    consumePendingLoginQueryParams(): Params | null {
        const p = this.pendingLoginQueryParams;
        this.pendingLoginQueryParams = null;
        return p;
    }

    /** Logout completo e redirect ao login (ex.: utilizador cancelou a reautenticação no popup). */
    forceLogoutToLogin() {
        this.terminateSessionRequireReauthentication();
    }

    /** Encerra sessão por JWT próximo do fim, 401 ou cabeçalho do servidor — força novo login. */
    terminateSessionRequireReauthentication() {
        if (this.terminatingSession) {
            return;
        }
        this.terminatingSession = true;
        localStorage.removeItem('currentUser');
        this.pendingLoginQueryParams = { sessionExpired: '1' };
        this.emitLoggedOut();
    }

    logout() {
        this.terminatingSession = false;
        localStorage.removeItem('currentUser');
        this.pendingLoginQueryParams = null;
        this.emitLoggedOut();
    }

    private emitLoggedOut() {
        this.isLogged.next(null);
        this.admin(null);
        this.setPermissions(null);
    }

    private admin(user: any) {
      if (!user?.permissoes?.length) {
        this.isAdmin.next(false);
        return;
      }
      const userAdmin = user.permissoes.filter((permission: string) => permission == "admin");
      this.isAdmin.next(!!userAdmin?.length);
    }

    private setIdEmpresaSelecionada(idEmpresa: any) {
      this.idEmpresaSelecionada.next(idEmpresa);
    }

    public setIdEmpresaSelecionadaAdmin(idEmpresa: any) {
      this.idEmpresaSelecionadaAdmin.next(idEmpresa);
    }

    private setPermissions(user: any) {
      this.userPermissions = user?.permissoes ?? [];
    }

}
