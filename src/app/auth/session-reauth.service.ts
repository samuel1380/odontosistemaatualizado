import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ReauthDialogComponent } from './reauth-dialog/reauth-dialog.component';

/**
 * Abre um único diálogo de login por vez; chamadas concorrentes compartilham o mesmo resultado.
 */
@Injectable({
    providedIn: 'root',
})
export class SessionReauthService {
    private dialogRef: MatDialogRef<ReauthDialogComponent, boolean> | null = null;

    constructor(
        private readonly dialog: MatDialog,
        private readonly router: Router
    ) {}

    /** Rota raiz (`''`) = tela de login — não exibir popup de reautenticação. */
    isLoginScreen(): boolean {
        const path = this.router.url.split('?')[0].split('#')[0];
        return path === '' || path === '/' || /^\/login\/?$/i.test(path);
    }

    isReauthDialogOpen(): boolean {
        return this.dialogRef != null;
    }

    /** true = novo token gravado e sessão atualizada; false = cancelar / falha. */
    promptReauth(): Observable<boolean> {
        if (this.isLoginScreen()) {
            return of(false);
        }
        if (this.dialogRef) {
            return this.dialogRef.afterClosed().pipe(map((r) => r === true));
        }
        this.dialogRef = this.dialog.open(ReauthDialogComponent, {
            width: '440px',
            maxWidth: '95vw',
            disableClose: true,
            autoFocus: 'first-tabbable',
            panelClass: 'reauth-dialog-panel',
        });
        return this.dialogRef.afterClosed().pipe(
            finalize(() => {
                this.dialogRef = null;
            }),
            map((r) => r === true)
        );
    }
}
