import { JwtHelperService } from '@auth0/angular-jwt';
import { JWT_EXPIRY_MARGIN_SECONDS } from './jwt-expiry.constants';

const jwtHelper = new JwtHelperService(null as any);

export function getTokenFromStorage(): string | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
        return null;
    }
    try {
        const user = JSON.parse(raw);
        return user?.token ?? null;
    } catch {
        return null;
    }
}

/** true = expirado ou sem `exp`, ou faltam menos que marginSeconds para expirar. */
export function isJwtExpiredOrNearExpiry(
    token: string | null,
    marginSeconds: number = JWT_EXPIRY_MARGIN_SECONDS
): boolean {
    if (!token) {
        return true;
    }
    try {
        return jwtHelper.isTokenExpired(token, marginSeconds);
    } catch {
        return true;
    }
}
