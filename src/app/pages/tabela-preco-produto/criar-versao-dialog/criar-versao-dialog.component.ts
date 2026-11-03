import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { criarNovaVersao } from 'src/services/tabelaPrecoProduto.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-criar-versao-dialog',
  templateUrl: './criar-versao-dialog.component.html',
  styleUrls: ['./criar-versao-dialog.component.sass']
})
export class CriarVersaoDialogComponent {
  versaoForm = new FormGroup({
    numeroVersao: new FormControl('', [Validators.required]),
  });

  carregando = false;

  constructor(
    public dialogRef: MatDialogRef<CriarVersaoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idTabelaOrigem: number; nomeTabela: string },
    private snackBar: MatSnackBar,
  ) {}

  async criarVersao() {
    if (this.versaoForm.invalid) {
      this.versaoForm.markAllAsTouched();
      return;
    }

    this.carregando = true;

    try {
      const formValue = this.versaoForm.getRawValue();
      const dadosVersao = { numeroVersao: formValue.numeroVersao! };

      const response = await criarNovaVersao(this.data.idTabelaOrigem, dadosVersao);

      if (response?.status === 201 || response?.status === 200) {
        this.dialogRef.close(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao criar versão', error);
      const mensagem = error?.response?.data?.message || error?.response?.data?.resposta || 'Erro ao criar versão';
      this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
    } finally {
      this.carregando = false;
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}
