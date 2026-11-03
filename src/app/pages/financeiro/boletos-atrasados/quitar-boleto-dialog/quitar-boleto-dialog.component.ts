import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { confirmarPagamento } from 'src/services/financeiro.contasPagarReceber.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { ContaElement } from '../../contas/contas.component';
import { BoletoAtrasado } from 'src/services/boleto-atrasado.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-quitar-boleto-dialog',
  templateUrl: './quitar-boleto-dialog.component.html',
  styleUrls: ['./quitar-boleto-dialog.component.sass']
})
export class QuitarBoletoDialogComponent {
  quitarForm = new FormGroup({
    descricao: new FormControl({ value: '', disabled: true }),
    dataVencimento: new FormControl({ value: '', disabled: true }),
    valorRestante: new FormControl({ value: 0, disabled: true }),
    juros: new FormControl({ value: 0, disabled: true }),
    multa: new FormControl({ value: 0, disabled: true }),
    valorTotalComJuros: new FormControl({ value: 0, disabled: true }),
    gerarJuros: new FormControl(true),
    meioPagamento: new FormControl({ value: '', disabled: false }),
    dataPagamento: new FormControl(new Date(), [Validators.required]),
    idConta: new FormControl<number | null>(null, [Validators.required]),
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
  boleto: BoletoAtrasado;

  constructor(
    public dialogRef: MatDialogRef<QuitarBoletoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BoletoAtrasado,
    private dialog: MatDialog,
  ) {
    this.boleto = data;
    // Formatar data de vencimento para exibição
    const dataVencimentoFormatada = data.dataVencimento
      ? format(new Date(data.dataVencimento), 'dd/MM/yyyy')
      : '';

    // Calcular valores iniciais
    const gerarJuros = data.gerarJuros !== false; // Default true se não especificado
    const juros = gerarJuros ? (data.juros || 0) : 0;
    const multa = gerarJuros ? (data.multa || 0) : 0;
    const valorTotalComJuros = gerarJuros
      ? (data.valorTotalComJuros || data.valorRestante)
      : data.valorRestante;

    const dataPagamentoInicial = data.dataVencimento
      ? new Date(data.dataVencimento)
      : new Date();

    this.quitarForm.patchValue({
      descricao: data.descricao,
      dataVencimento: dataVencimentoFormatada,
      valorRestante: data.valorRestante,
      juros,
      multa,
      valorTotalComJuros,
      gerarJuros,
      dataPagamento: dataPagamentoInicial
    });

    // Observar mudanças no checkbox de gerar juros
    this.quitarForm.get('gerarJuros')?.valueChanges.subscribe(gerar => {
      if (!gerar) {
        this.quitarForm.patchValue({
          juros: 0,
          multa: 0,
          valorTotalComJuros: this.quitarForm.get('valorRestante')?.value || 0
        }, { emitEvent: false });
      } else {
        // Recalcular juros e multa se habilitar
        const valorRestante = this.quitarForm.get('valorRestante')?.value || 0;
        const diasAtraso = data.diasAtraso || 0;
        const multaPercentual = 0.01; // 1%
        const jurosDiarioPercentual = 0.00033; // 0.033% ao dia
        const novaMulta = valorRestante * multaPercentual;
        const novosJuros = valorRestante * jurosDiarioPercentual * diasAtraso;
        const novoTotal = valorRestante + novosJuros + novaMulta;

        this.quitarForm.patchValue({
          juros: Math.round(novosJuros * 100) / 100,
          multa: Math.round(novaMulta * 100) / 100,
          valorTotalComJuros: Math.round(novoTotal * 100) / 100
        }, { emitEvent: false });
      }
    });

    buscarContas().then(response => {
      if (response.status === 200) {
        this.listaContas = response.data;
      }
    });
  }

  async confirmarQuitacao() {
    if (this.quitarForm.invalid) {
      this.quitarForm.markAllAsTouched();
      return;
    }

    const { idParcela } = this.boleto;
    const { idConta, dataPagamento, valorRestante, juros, multa, gerarJuros, meioPagamento } =
      this.quitarForm.getRawValue();

    if (!idParcela) {
      console.error("ID da parcela não encontrado.");
      return;
    }

    try {
      // Se desabilitou juros, atualizar a parcela antes de pagar
      if (gerarJuros === false && this.boleto.gerarJuros !== false) {
        // TODO: Criar endpoint para atualizar gerarJuros da parcela
        // Por enquanto, apenas pagamos com o valor sem juros
      }

      const principal = Number(valorRestante ?? this.boleto.valorRestante ?? 0);
      const acrescimo = gerarJuros
        ? Math.max(0, Number(juros ?? 0) + Number(multa ?? 0))
        : 0;

      const response = await confirmarPagamento(idParcela, {
        idConta,
        dataPagamento: format(dataPagamento!, 'yyyy-MM-dd'),
        valor: principal,
        acrescimo,
        meioPagamento: meioPagamento || undefined
      });

      if (response.status === 201) {
        const mensagem = gerarJuros === false
          ? 'O boleto foi quitado com sucesso sem juros e multa.'
          : 'O boleto foi quitado com sucesso, incluindo juros e multa.';

        this.dialog.open(DialogCadastroSucessoComponent, {
          data: {
            titulo: 'Boleto Quitado!',
            mensagem
          },
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      } else {
        console.error('Falha ao quitar boleto:', response);
      }
    } catch (error) {
      console.error('Erro ao quitar boleto:', error);
    }
  }
}

