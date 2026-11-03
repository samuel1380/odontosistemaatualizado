import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { listarMovimentacoesPagamentoEmprestimo, recalcularSaldoEmprestimo, EmprestimoMovimentacaoPagamento, Emprestimo } from 'src/services/capital.service';
import { MatTableDataSource } from '@angular/material/table';
import { EmprestimoMovimentacaoDialogComponent } from '../emprestimo-movimentacao-dialog/emprestimo-movimentacao-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-emprestimo-historico-dialog',
  templateUrl: './emprestimo-historico-dialog.component.html',
  styleUrls: ['./emprestimo-historico-dialog.component.sass'],
})
export class EmprestimoHistoricoDialogComponent implements OnInit {
  carregando = true;
  teveAlteracao = false;
  modoImprimir = false;
  movimentacoes = new MatTableDataSource<EmprestimoMovimentacaoPagamento>([]);
  colunas = ['dataMovimentacao', 'tipoMovimentacao', 'valor', 'saldoAtualizado', 'descricao'];

  constructor(
    public dialogRef: MatDialogRef<EmprestimoHistoricoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { emp: Emprestimo, imprimir?: boolean },
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.modoImprimir = !!data.imprimir;
  }

  async ngOnInit() {
    try {
      const res = await listarMovimentacoesPagamentoEmprestimo(this.data.emp.idEmprestimo);
      let payload = (res as { data?: EmprestimoMovimentacaoPagamento[] }).data || [];
      
      // Calculate running balance
      if (payload.length > 0) {
        // Reverse array to chronologically calculate balance
        let chron = [...payload].reverse();
        let runningBalance = Number(this.data.emp.valorPrincipal);
        
        chron.forEach(mov => {
          const val = Number(mov.valor);
          if (mov.tipoMovimentacao === 'JUROS' || mov.tipoMovimentacao === 'ACRESCIMO') {
            runningBalance += val;
          } else if (mov.tipoMovimentacao === 'PAGAMENTO') {
            runningBalance -= val;
          }
          mov.saldoAposMovimentacao = runningBalance;
        });
        
        // Reverse back to DESC
        payload = chron.reverse();
      }
      
      this.movimentacoes.data = payload;
      
      if (this.modoImprimir) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch (e) {
      console.error(e);
      this.movimentacoes.data = [];
    } finally {
      this.carregando = false;
    }
  }

  abrirLancamentoMovimentacao(tipo: 'JUROS' | 'PAGAMENTO' | 'ACRESCIMO') {
    const ref = this.dialog.open(EmprestimoMovimentacaoDialogComponent, {
      width: '600px',
      data: { emp: this.data.emp, tipo }
    });

    ref.afterClosed().subscribe((recarregar) => {
      if (recarregar) {
        this.teveAlteracao = true;
        this.ngOnInit(); // Recarrega os dados
      }
    });
  }

  async recalcularSaldo() {
    try {
      this.carregando = true;
      const res = await recalcularSaldoEmprestimo(this.data.emp.idEmprestimo);
      if (res.status === 201 || res.status === 200) {
        const { saldoNovo } = res.data;
        this.data.emp.saldoRestante = saldoNovo;
        this.snackBar.open('Saldo recalculado com sucesso!', 'Fechar', { duration: 3000 });
        this.teveAlteracao = true;
        this.ngOnInit();
      }
    } catch (e) {
      this.snackBar.open('Erro ao recalcular saldo.', 'Fechar', { duration: 3000 });
      this.carregando = false;
    }
  }

  fecharDialog() {
    this.dialogRef.close(this.teveAlteracao);
  }
}
