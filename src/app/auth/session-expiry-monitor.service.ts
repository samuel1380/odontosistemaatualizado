import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthUserService } from '../serviceStorage/authUser.service';
import { JWT_EXPIRY_POLL_INTERVAL_MS } from './jwt-expiry.constants';
import { getTokenFromStorage, isJwtExpiredOrNearExpiry } from './jwt-session.util';
import { SessionReauthService } from './session-reauth.service';

/**
 * Checa o JWT periodicamente mesmo sem novas requisições HTTP (usuário parado na mesma tela).
 */
@Injectable({
    providedIn: 'root'
})
export class SessionExpiryMonitorService implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly zone: NgZone,
        private readonly auth: AuthUserService,
        private readonly sessionReauth: SessionReauthService
    ) {
        this.zone.runOutsideAngular(() => {
            this.intervalId = setInterval(() => this.check(), JWT_EXPIRY_POLL_INTERVAL_MS);
        });
        this.zone.run(() => this.check());
    }

    ngOnDestroy(): void {
        if (this.intervalId != null) {
            clearInterval(this.intervalId);
        }
    }

    private check(): void {
        const token = getTokenFromStorage();
        if (!token) {
            return;
        }
        if (isJwtExpiredOrNearExpiry(token)) {
            if (this.sessionReauth.isLoginScreen()) {
                return;
            }
            if (this.sessionReauth.isReauthDialogOpen()) {
                return;
            }
            this.zone.run(() => {
                this.sessionReauth.promptReauth().subscribe((ok) => {
                    if (!ok && !this.sessionReauth.isLoginScreen()) {
                        this.auth.forceLogoutToLogin();
                    }
                });
            });
        }
    }
}
