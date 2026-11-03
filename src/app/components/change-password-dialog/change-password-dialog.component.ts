import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioService } from 'src/services/usuario.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.sass']
})
export class ChangePasswordDialogComponent {
  form: FormGroup;
  loading = false;
  hideAtual = true;
  hideNova = true;
  hideConfirma = true;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private usuarioService: UsuarioService
  ) {
    this.form = this.fb.group({
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [
        Validators.required,
        Validators.minLength(8),
        this.strongPasswordValidator
      ]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasNumeric = /[0-9]+/.test(value);
    const hasSpecial = /[\W_]+/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

    if (!passwordValid) {
      return { strongPassword: true };
    }
    return null;
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('novaSenha')?.value;
    const confirmPass = group.get('confirmarSenha')?.value;

    return pass === confirmPass ? null : { notSame: true };
  }

  salvar() {
    if (this.form.invalid) return;

    this.loading = true;
    const dto = {
      senhaAtual: this.form.value.senhaAtual,
      novaSenha: this.form.value.novaSenha
    };

    this.usuarioService.alterarSenha(dto).subscribe({
      next: () => {
        this.snackBar.open('Senha alterada com sucesso!', 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        let msg = 'Erro ao alterar senha.';
        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            msg = err.error.message.join(', ');
          } else {
            msg = err.error.message;
          }
        }
        this.snackBar.open(msg, 'Fechar', { duration: 4000 });
      }
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
