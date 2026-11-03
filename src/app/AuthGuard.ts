import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthUserService } from './serviceStorage/authUser.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { JWT_EXPIRY_MARGIN_SECONDS } from './auth/jwt-expiry.constants';
import { SessionReauthService } from './auth/session-reauth.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthGuard implements CanActivate {

    private userStorage = inject(AuthUserService);
    private sessionReauth = inject(SessionReauthService);

    constructor(private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
      const userLogged = localStorage.getItem('currentUser');
      if (userLogged) {
        const user = JSON.parse(userLogged);
        const isExpired = this.isExpired(user.token);

        if (!isExpired) {
          this.userStorage.login(user);
          return true;
        }

        return this.sessionReauth.promptReauth().pipe(
          switchMap((ok) => {
            if (ok) {
              const fresh = JSON.parse(localStorage.getItem('currentUser')!);
              this.userStorage.login(fresh);
              return of(true);
            }
            localStorage.removeItem('currentUser');
            this.router.navigate([''], {
              queryParams: { returnUrl: state.url, sessionExpired: '1' },
            });
            return of(false);
          })
        );
      }

      localStorage.removeItem('currentUser');
      this.router.navigate([''], { queryParams: { returnUrl: state.url } });
      return false;
    }

    isExpired(token: string | null): boolean {
      if (!token) return true;

      const helper = new JwtHelperService();
      return helper.isTokenExpired(token, JWT_EXPIRY_MARGIN_SECONDS);
    }
}
