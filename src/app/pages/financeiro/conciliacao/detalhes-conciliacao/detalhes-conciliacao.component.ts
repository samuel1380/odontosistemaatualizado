import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { desfazerConciliacao, ConciliacaoTransacao } from 'src/services/conciliacao.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { format } from 'date-fns';

@Component({
  selector: 'app-detalhes-conciliacao',
  templateUrl: './detalhes-conciliacao.component.html',
  styleUrls: ['./detalhes-conciliacao.component.sass']
})
export class DetalhesConciliacaoComponent {
  carregando = false;

  constructor(
    public dialogRef: MatDialogRef<DetalhesConciliacaoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { conciliacao: ConciliacaoTransacao },
    private snackBar: MatSnackBar,
  ) {}

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  formatarData(data: string | Date): string {
    return format(new Date(data), 'dd/MM/yyyy HH:mm');
  }

  async desfazer() {
    if (!confirm('Tem certeza que deseja desfazer esta conciliação?')) {
      return;
    }

    this.carregando = true;
    try {
      const response = await desfazerConciliacao(this.data.conciliacao.idConciliacao);
      if (response.status === 200) {
        this.snackBar.open('Conciliação desfeita com sucesso!', 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao desfazer conciliação', error);
      const mensagem = error?.response?.data?.message || 'Erro ao desfazer conciliação';
      this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
    } finally {
      this.carregando = false;
    }
  }
}
