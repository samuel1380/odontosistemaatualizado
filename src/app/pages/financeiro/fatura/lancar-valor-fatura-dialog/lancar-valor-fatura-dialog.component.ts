import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { FaturaService, Fatura, LancarValorFaturaDto } from 'src/services/financeiro.fatura.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { ContaElement } from '../../contas/contas.component';
import { format } from 'date-fns';

@Component({
  selector: 'app-lancar-valor-fatura-dialog',
  templateUrl: './lancar-valor-fatura-dialog.component.html',
  styleUrls: ['./lancar-valor-fatura-dialog.component.sass']
})
export class LancarValorFaturaDialogComponent implements OnInit {
  lancarForm = new FormGroup({
    valorTotal: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    idConta: new FormControl<number | null>(null, [Validators.required]),
    meioPagamento: new FormControl('DINHEIRO'),
  });

  meiosPagamento = [
    { nome: 'Dinheiro', id: 'DINHEIRO' },
    { nome: 'Cartão de Crédito', id: 'CARTAO_CREDITO' },
    { nome: 'Cartão de Débito', id: 'CARTAO_DEBITO' },
    { nome: 'Pix', id: 'PIX' },
    { nome: 'Boleto', id: 'BOLETO' },
    { nome: 'Transferência Bancária', id: 'TRANSFERENCIA' },
    { nome: 'Cheque', id: 'CHEQUE' },
  ];

  listaContas: ContaElement[] = [];
  fatura: Fatura;
  valorRestante: number = 0;

  parcelasEditaveis: { valor: number; dataVencimentoStr: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<LancarValorFaturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Fatura,
    private dialog: MatDialog,
    private faturaService: FaturaService,
  ) {
    try {
      if (!data) {
        throw new Error('Dados da fatura não fornecidos');
      }

      this.fatura = data;

      const valorTotal = parseFloat(this.fatura.valorTotal || '0');
      const valorPago = parseFloat((this.fatura as any).valorPago || '0');
      this.valorRestante = Math.round((valorTotal - valorPago) * 100) / 100;

      this.lancarForm.patchValue({
        valorTotal: this.valorRestante > 0 ? this.valorRestante : 0,
      });

      // Initialize first parcela on the 20th of the current month
      const hoje = new Date();
      const data20 = new Date(hoje.getFullYear(), hoje.getMonth(), 20, 12, 0, 0);
      const dataVencimentoStr = data20.toISOString().split('T')[0];

      this.parcelasEditaveis = [
        { valor: this.valorRestante > 0 ? this.valorRestante : 0, dataVencimentoStr }
      ];

      buscarContas().then(response => {
        if (response.status === 200) {
          this.listaContas = response.data;
        }
      }).catch(error => {
        console.error('Erro ao carregar contas:', error);
      });
    } catch (error: any) {
      console.error('Erro no construtor do diálogo:', error);
      throw error;
    }
  }

  ngOnInit() {
    this.lancarForm.get('valorTotal')?.valueChanges.subscribe(() => {
      this.redistribuirValores();
    });
  }

  get totalParcelasEditaveis(): number {
    return Math.round(this.parcelasEditaveis.reduce((s, p) => s + Number(p.valor || 0), 0) * 100) / 100;
  }

  get diferencaTotal(): number {
    const valorTotal = Number(this.lancarForm.get('valorTotal')?.value || 0);
    return Math.round((valorTotal - this.totalParcelasEditaveis) * 100) / 100;
  }

  get parcelasValidas(): boolean {
    return Math.abs(this.diferencaTotal) < 0.01;
  }

  adicionarParcela(): void {
    this.redistribuirValores(this.parcelasEditaveis.length + 1);
    const ultima = this.parcelasEditaveis[this.parcelasEditaveis.length - 1];
    let proximaData = '';
    if (ultima?.dataVencimentoStr) {
      const d = new Date(ultima.dataVencimentoStr + 'T12:00:00');
      d.setMonth(d.getMonth() + 1);
      proximaData = d.toISOString().split('T')[0];
    }
    this.parcelasEditaveis.push({ valor: 0, dataVencimentoStr: proximaData });
    this.redistribuirValores();
  }

  removerUltimaParcela(): void {
    if (this.parcelasEditaveis.length <= 1) return;
    this.parcelasEditaveis.pop();
    this.redistribuirValores();
  }

  redistribuirValores(quantidadeAlvo?: number): void {
    const n = quantidadeAlvo ?? this.parcelasEditaveis.length;
    if (n <= 0) return;
    const valorTotal = Number(this.lancarForm.get('valorTotal')?.value || 0);
    const valorParcela = Math.round((valorTotal / n) * 100) / 100;
    
    for (let i = 0; i < this.parcelasEditaveis.length; i++) {
      this.parcelasEditaveis[i].valor = valorParcela;
    }
    
    if (this.parcelasEditaveis.length > 0) {
      const soma = valorParcela * this.parcelasEditaveis.length;
      this.parcelasEditaveis[this.parcelasEditaveis.length - 1].valor = Math.round((valorParcela + (valorTotal - soma)) * 100) / 100;
    }
  }

  onDataPrimeiraParcelaChange(): void {
    if (this.parcelasEditaveis.length <= 1) return;
    const primeiraData = this.parcelasEditaveis[0].dataVencimentoStr;
    if (!primeiraData) return;

    let currentDate = new Date(primeiraData + 'T12:00:00');
    for (let i = 1; i < this.parcelasEditaveis.length; i++) {
      if (!this.parcelasEditaveis[i].dataVencimentoStr) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        this.parcelasEditaveis[i].dataVencimentoStr = currentDate.toISOString().split('T')[0];
      } else {
        currentDate = new Date(this.parcelasEditaveis[i].dataVencimentoStr + 'T12:00:00');
      }
    }
  }

  async salvar() {
    if (this.lancarForm.invalid) {
      this.lancarForm.markAllAsTouched();
      return;
    }

    const parcelasComErro = this.parcelasEditaveis.some(p => !p.dataVencimentoStr || !p.valor || p.valor <= 0);
    if (parcelasComErro) {
      alert('Preencha a data e o valor de todas as parcelas.');
      return;
    }

    if (!this.parcelasValidas) {
      alert(`A soma das parcelas deve ser igual ao valor total. Diferença: ${this.diferencaTotal.toFixed(2)}`);
      return;
    }

    const formValue = this.lancarForm.getRawValue();
    const valorTotal = Number(formValue.valorTotal);

    if (valorTotal > this.valorRestante + 0.01) {
      alert(`O valor total (R$ ${valorTotal}) não pode ser maior que o valor restante da fatura (R$ ${this.valorRestante}).`);
      return;
    }

    const parcelasFormatadas = this.parcelasEditaveis.map(p => ({
      valor: Number(p.valor),
      dataVencimento: p.dataVencimentoStr
    }));

    const dto: LancarValorFaturaDto = {
      valor: valorTotal,
      idConta: formValue.idConta!,
      meioPagamento: formValue.meioPagamento || undefined,
      dataPagamento: new Date().toISOString(),
      parcelas: parcelasFormatadas
    };

    try {
      await this.faturaService.lancarValorFatura(this.fatura.idFatura, dto).toPromise();

      this.dialog.open(DialogCadastroSucessoComponent, {
        width: '400px',
        data: { mensagem: 'Valor lançado com sucesso!' }
      });

      this.dialogRef.close({ sucesso: true });
    } catch (error: any) {
      console.error('Erro ao lançar valor da fatura', error);
      const mensagem = error?.error?.resposta || error?.error?.message || 'Falha ao lançar valor da fatura.';
      alert(mensagem);
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  getValorTotalFormatado(): string {
    return this.formatarMoeda(parseFloat(this.fatura.valorTotal || '0'));
  }

  getValorPagoFormatado(): string {
    const valorPago = parseFloat((this.fatura as any).valorPago || '0');
    return this.formatarMoeda(valorPago);
  }

  getValorRestanteFormatado(): string {
    return this.formatarMoeda(this.valorRestante);
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}

