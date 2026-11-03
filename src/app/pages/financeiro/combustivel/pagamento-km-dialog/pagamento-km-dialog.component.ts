import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { registrarPagamentoKm, CreatePagamentoKmDto, ConfiguracaoKm } from 'src/services/combustivel.service';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-pagamento-km-dialog',
  templateUrl: './pagamento-km-dialog.component.html',
  styleUrls: ['./pagamento-km-dialog.component.sass']
})
export class PagamentoKmDialogComponent {
  pagamentoForm = new FormGroup({
    nomePessoa: new FormControl('', [Validators.required]),
    quantidadeKm: new FormControl(0, [Validators.required, Validators.min(1)]),
    dataPagamento: new FormControl(new Date(), [Validators.required]),
    observacoes: new FormControl<string | null>(null),
    idCategoria: new FormControl<number | null>(null),
    idConta: new FormControl<number | null>(null),
    meioPagamento: new FormControl('DINHEIRO', [Validators.required]),
  });

  categorias: any[] = [];
  contas: any[] = [];
  configuracaoKm: ConfiguracaoKm | null = null;
  valorTotal = 0;

  meiosPagamento = [
    { nome: 'Dinheiro', id: 'DINHEIRO' },
    { nome: 'Cartão de Crédito', id: 'CARTAO_CREDITO' },
    { nome: 'Cartão de Débito', id: 'CARTAO_DEBITO' },
    { nome: 'Pix', id: 'PIX' },
    { nome: 'Boleto', id: 'BOLETO' },
    { nome: 'Transferência Bancária', id: 'TRANSFERENCIA' },
  ];

  constructor(
    public dialogRef: MatDialogRef<PagamentoKmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { configuracaoKm?: ConfiguracaoKm } | null,
    private dialog: MatDialog,
  ) {
    this.loadData();
    
    if (data?.configuracaoKm) {
      this.configuracaoKm = data.configuracaoKm;
    }

    // Calcular valor total quando quantidade de KM mudar
    this.pagamentoForm.get('quantidadeKm')?.valueChanges.subscribe(() => this.calcularTotal());
  }

  async loadData() {
    try {
      const [categoriasRes, contasRes] = await Promise.all([
        buscarCategorias(),
        buscarContas(),
      ]);

      if (categoriasRes.status === 200) {
        this.categorias = categoriasRes.data.filter((c: any) => c.tipo === 'DESPESA');
      }
      if (contasRes.status === 200) {
        this.contas = contasRes.data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  }

  calcularTotal() {
    const quantidadeKm = this.pagamentoForm.get('quantidadeKm')?.value || 0;
    const valorPorKm = this.configuracaoKm?.valorPorKm || 0;
    this.valorTotal = quantidadeKm * valorPorKm;
  }

  async salvar() {
    if (this.pagamentoForm.invalid) {
      this.pagamentoForm.markAllAsTouched();
      return;
    }

    if (!this.configuracaoKm) {
      alert('Configuração de valor por KM não encontrada. Configure o valor por KM antes de registrar pagamentos.');
      return;
    }

    try {
      const formValue = this.pagamentoForm.getRawValue();
      const dto: CreatePagamentoKmDto = {
        nomePessoa: formValue.nomePessoa!,
        quantidadeKm: formValue.quantidadeKm!,
        dataPagamento: format(formValue.dataPagamento!, 'yyyy-MM-dd'),
        observacoes: formValue.observacoes || undefined,
        idCategoria: formValue.idCategoria || undefined,
        idConta: formValue.idConta || undefined,
        meioPagamento: formValue.meioPagamento || undefined,
      };

      const response = await registrarPagamentoKm(dto);

      if (response?.status === 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar pagamento de KM', error);
    }
  }
}

