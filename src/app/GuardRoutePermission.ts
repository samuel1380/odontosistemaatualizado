import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanMatch, UrlTree } from '@angular/router';
import { AuthUserService } from './serviceStorage/authUser.service';
import { Observable, map, mergeMap, of } from 'rxjs';

@Injectable()
export class GuardRoutePermission implements CanActivate {
    private userStorage = inject(AuthUserService);

    constructor(private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
      return this.userStorage.isLogged$.pipe(
        mergeMap((hasUser) => {
          if (hasUser) {
            if(route.data[`permission`].length > 0)
              if (this.userStorage.hasAnyRole(route.data[`permission`])) {
                return of(true);
              }

              return of(this.router.parseUrl('/l/app-unauthorized'));
          }

          return of(this.router.parseUrl('/l/app-no-user'));
      }))
    }
}
