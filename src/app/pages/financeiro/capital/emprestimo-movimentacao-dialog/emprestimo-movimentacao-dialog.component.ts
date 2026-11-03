import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { registrarJurosEmprestimo, registrarPagamentoEmprestimo, registrarAcrescimoEmprestimo, CreateJurosEmprestimoDto, CreatePagamentoEmprestimoDto, Emprestimo } from 'src/services/capital.service';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-emprestimo-movimentacao-dialog',
  templateUrl: './emprestimo-movimentacao-dialog.component.html',
  styleUrls: ['./emprestimo-movimentacao-dialog.component.sass']
})
export class EmprestimoMovimentacaoDialogComponent {
  movimentacaoForm = new FormGroup({
    valor: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    dataMovimentacao: new FormControl(new Date(), [Validators.required]),
    idCategoria: new FormControl<number | null>(null),
    idConta: new FormControl<number | null>(null),
    meioPagamento: new FormControl('TRANSFERENCIA'),
    observacoes: new FormControl<string | null>(null),
  });

  categorias: any[] = [];
  contas: any[] = [];
  isSubmitting = false;
  teveAlteracao = false;

  meiosPagamento = [
    { nome: 'Dinheiro', id: 'DINHEIRO' },
    { nome: 'Cartão de Crédito', id: 'CARTAO_CREDITO' },
    { nome: 'Cartão de Débito', id: 'CARTAO_DEBITO' },
    { nome: 'Pix', id: 'PIX' },
    { nome: 'Boleto', id: 'BOLETO' },
    { nome: 'Transferência Bancária', id: 'TRANSFERENCIA' },
  ];

  constructor(
    public dialogRef: MatDialogRef<EmprestimoMovimentacaoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { emp: Emprestimo, tipo: 'JUROS' | 'PAGAMENTO' | 'ACRESCIMO' },
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.loadData();
    if (this.data.tipo === 'PAGAMENTO' || this.data.tipo === 'ACRESCIMO') {
      this.movimentacaoForm.get('idConta')?.setValidators([Validators.required]);
    } else if (this.data.tipo === 'JUROS') {
      // Calcular 1% do saldo devedor
      const saldo = Number(this.data.emp.saldoRestante) || Number(this.data.emp.valorPrincipal) || 0;
      const jurosCalculado = Number((saldo * 0.01).toFixed(2));
      this.movimentacaoForm.get('valor')?.setValue(jurosCalculado);
    }
  }

  async loadData() {
    try {
      const [categoriasRes, contasRes] = await Promise.all([
        buscarCategorias(),
        buscarContas(),
      ]);

      if (categoriasRes.status === 200) {
        this.categorias = categoriasRes.data;
      }
      if (contasRes.status === 200) {
        this.contas = contasRes.data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  }

  async salvar(criarOutra: boolean = false) {
    if (this.movimentacaoForm.invalid) {
      this.movimentacaoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const formValue = this.movimentacaoForm.getRawValue();
      const dateFormatted = format(formValue.dataMovimentacao!, 'yyyy-MM-dd');
      let response;

      if (this.data.tipo === 'JUROS' || this.data.tipo === 'ACRESCIMO') {
        const dto: CreateJurosEmprestimoDto = {
          valor: formValue.valor!,
          dataCompetencia: dateFormatted,
          idCategoria: formValue.idCategoria || undefined,
          idConta: formValue.idConta || undefined,
          observacoes: formValue.observacoes || undefined,
        };
        if (this.data.tipo === 'JUROS') {
          response = await registrarJurosEmprestimo(this.data.emp.idEmprestimo, dto);
        } else {
          response = await registrarAcrescimoEmprestimo(this.data.emp.idEmprestimo, dto);
        }
      } else {
        const dto: CreatePagamentoEmprestimoDto = {
          valor: formValue.valor!,
          dataPagamento: dateFormatted,
          idConta: formValue.idConta!,
          idCategoria: formValue.idCategoria || undefined,
          meioPagamento: formValue.meioPagamento || undefined,
          observacoes: formValue.observacoes || undefined,
        };
        response = await registrarPagamentoEmprestimo(this.data.emp.idEmprestimo, dto);
      }

      if (response?.status === 201) {
        this.snackBar.open('Movimentação registrada com sucesso!', 'Fechar', { duration: 3000 });
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        
        // Atualiza o saldo localmente para o próximo cálculo
        const valorAdicionado = Number(formValue.valor);
        const saldoAtual = Number(this.data.emp.saldoRestante) || Number(this.data.emp.valorPrincipal) || 0;
        if (this.data.tipo === 'JUROS' || this.data.tipo === 'ACRESCIMO') {
          this.data.emp.saldoRestante = saldoAtual + valorAdicionado;
        } else {
          this.data.emp.saldoRestante = saldoAtual - valorAdicionado;
        }
        
        this.teveAlteracao = true;

        if (criarOutra) {
          if (this.data.tipo === 'JUROS') {
            const novoSaldo = this.data.emp.saldoRestante;
            const jurosCalculado = Number((novoSaldo * 0.01).toFixed(2));
            this.movimentacaoForm.get('valor')?.setValue(jurosCalculado);
          } else {
            this.movimentacaoForm.get('valor')?.reset();
          }
          this.movimentacaoForm.get('observacoes')?.reset();
          this.isSubmitting = false;
        } else {
          this.dialogRef.close(true);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar movimentação de empréstimo', error);
      this.isSubmitting = false;
    }
  }

  calcularValorDigitado(event: any) {
    let val = event.target.value;
    if (!val) return;

    if (typeof val === 'string') {
      try {
        // Substitui vírgulas por pontos (para decimais) e remove espaços
        let exp = val.replace(/\s/g, '').replace(/,/g, '.');
        // Mantém apenas números e operadores matemáticos
        exp = exp.replace(/[^0-9.\+\-\*\/\(\)]/g, '');
        if (exp) {
          const result = new Function('return ' + exp)();
          if (!isNaN(result) && isFinite(result) && result >= 0.01) {
            this.movimentacaoForm.get('valor')?.setValue(Number(result.toFixed(2)));
          }
        }
      } catch (e) {
        // Ignora erros de parse
      }
    }
  }

  fechar() {
    this.dialogRef.close(this.teveAlteracao);
  }
}
