import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { realizaLogin } from 'src/services/login.service';
import { AuthUserService } from 'src/app/serviceStorage/authUser.service';

@Component({
    selector: 'app-reauth-dialog',
    templateUrl: './reauth-dialog.component.html',
    styleUrls: ['./reauth-dialog.component.scss'],
})
export class ReauthDialogComponent implements OnInit {
    emailControl = new FormControl('', [Validators.required, Validators.email]);
    senhaControl = new FormControl('', [Validators.required]);

    hide = true;
    loading = false;

    constructor(
        private readonly dialogRef: MatDialogRef<ReauthDialogComponent, boolean>,
        private readonly auth: AuthUserService,
        private readonly snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        const hint = this.readEmailHint();
        if (hint) {
            this.emailControl.setValue(hint);
            this.emailControl.disable();
        }
    }

    private readEmailHint(): string {
        try {
            const raw = localStorage.getItem('currentUser');
            if (!raw) {
                return '';
            }
            const u = JSON.parse(raw);
            return u.email || u.username || u.nomeUsuario || '';
        } catch {
            return '';
        }
    }

    async submit(): Promise<void> {
        const email = (this.emailControl.disabled
            ? this.emailControl.getRawValue()
            : this.emailControl.value) as string;
        const senha = this.senhaControl.value;
        if (!email?.trim() || !senha) {
            return;
        }
        this.loading = true;
        try {
            const result = await realizaLogin(email.trim(), senha);
            if (result.status !== 201 || !result.data) {
                this.snackBar.open('Não foi possível autenticar. Verifique e-mail e senha.', 'Fechar', {
                    duration: 5000,
                });
                return;
            }
            localStorage.setItem('currentUser', JSON.stringify(result.data));
            this.auth.login(result.data);
            this.dialogRef.close(true);
        } catch {
            this.snackBar.open('Erro ao autenticar. Tente novamente.', 'Fechar', { duration: 5000 });
        } finally {
            this.loading = false;
        }
    }

    sair(): void {
        this.dialogRef.close(false);
    }
}
