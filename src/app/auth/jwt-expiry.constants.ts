/**
 * Considera o JWT "no limite" quando faltam até estes segundos para o `exp`
 * (alinhado ao segundo parâmetro de JwtHelperService.isTokenExpired).
 */
export const JWT_EXPIRY_MARGIN_SECONDS = 300;

/** Verificação periódica enquanto o app está aberto (ms). */
export const JWT_EXPIRY_POLL_INTERVAL_MS = 60_000;
