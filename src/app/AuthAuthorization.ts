import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, EMPTY, throwError, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuthUserService } from './serviceStorage/authUser.service';
import { SessionReauthService } from './auth/session-reauth.service';
import { getTokenFromStorage, isJwtExpiredOrNearExpiry } from './auth/jwt-session.util';

/** Cabeçalhos opcionais que o BFF pode enviar para pedir nova autenticação. */
const HEADER_FORCE_REAUTH = 'x-force-reauthentication';
const HEADER_TOKEN_EXPIRING = 'x-token-expiring';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private readonly auth: AuthUserService,
        private readonly sessionReauth: SessionReauthService
    ) {}

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (this.shouldBypass(request)) {
            return next.handle(request);
        }

        const token = getTokenFromStorage();
        if (token && isJwtExpiredOrNearExpiry(token)) {
            if (this.sessionReauth.isLoginScreen()) {
                return this.forwardAuthorized(request, next);
            }
            return this.sessionReauth.promptReauth().pipe(
                mergeMap((ok) => {
                    if (!ok) {
                        if (!this.sessionReauth.isLoginScreen()) {
                            this.auth.forceLogoutToLogin();
                        }
                        return EMPTY;
                    }
                    return this.forwardAuthorized(request, next);
                })
            );
        }

        return this.forwardAuthorized(request, next);
    }

    private forwardAuthorized(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        const token = getTokenFromStorage();
        // Sempre aplicar o Bearer do localStorage quando existir, para que após o popup o pedido
        // não continue com um Authorization antigo definido manualmente no serviço.
        const req = token
            ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            : request;

        return next.handle(req).pipe(
            mergeMap((event: HttpEvent<unknown>) => {
                if (event instanceof HttpResponse && this.serverSignalsReauth(event)) {
                    if (this.sessionReauth.isLoginScreen()) {
                        return of(event);
                    }
                    return this.sessionReauth.promptReauth().pipe(
                        mergeMap((ok) => {
                            if (!ok && !this.sessionReauth.isLoginScreen()) {
                                this.auth.forceLogoutToLogin();
                            }
                            return of(event);
                        })
                    );
                }
                return of(event);
            }),
            catchError((err: HttpErrorResponse) => {
                const tok = getTokenFromStorage();
                if (err.status === 401 && tok && !request.headers.has('X-Reauth-Retry')) {
                    if (this.sessionReauth.isLoginScreen()) {
                        return throwError(() => err);
                    }
                    return this.sessionReauth.promptReauth().pipe(
                        mergeMap((ok) => {
                            if (!ok) {
                                if (!this.sessionReauth.isLoginScreen()) {
                                    this.auth.forceLogoutToLogin();
                                }
                                return throwError(() => err);
                            }
                            const newTok = getTokenFromStorage();
                            if (!newTok) {
                                if (!this.sessionReauth.isLoginScreen()) {
                                    this.auth.forceLogoutToLogin();
                                }
                                return throwError(() => err);
                            }
                            const retryReq = request.clone({
                                setHeaders: {
                                    Authorization: `Bearer ${newTok}`,
                                    'X-Reauth-Retry': '1',
                                },
                            });
                            return next.handle(retryReq);
                        })
                    );
                }
                if (err.status === 401 && request.headers.has('X-Reauth-Retry')) {
                    if (!this.sessionReauth.isLoginScreen()) {
                        this.auth.forceLogoutToLogin();
                    }
                }
                return throwError(() => err);
            })
        );
    }

    private shouldBypass(req: HttpRequest<unknown>): boolean {
        const u = req.url.toLowerCase();
        if (u.includes('/assets/')) {
            return true;
        }
        if (u.endsWith('.json')) {
            return true;
        }
        return false;
    }

    private serverSignalsReauth(res: HttpResponse<unknown>): boolean {
        const v = (name: string) => res.headers.get(name);
        return this.isTruthyHeader(v(HEADER_FORCE_REAUTH)) || this.isTruthyHeader(v(HEADER_TOKEN_EXPIRING));
    }

    private isTruthyHeader(raw: string | null): boolean {
        if (raw == null) {
            return false;
        }
        const s = raw.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'yes';
    }
}
