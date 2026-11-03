import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { atualizarLancamento } from 'src/services/financeiro.contasPagarReceber.service';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';
import { listarFornecedores } from 'src/services/financeiro.fornecedor.service';
import { buscarEmpresas } from 'src/services/empresa.service';

@Component({
  selector: 'app-contas-pagar-receber-edit-lancamento',
  templateUrl: './contas-pagar-receber-edit-lancamento.component.html',
  styleUrl: './contas-pagar-receber-edit-lancamento.component.sass'
})
export class ContasPagarReceberEditLancamentoComponent {
  lancamentoForm = new FormGroup({
    descricao: new FormControl('', [Validators.required]),
    tipo: new FormControl('RECEITA', [Validators.required]),
    valorTotal: new FormControl(0, [Validators.required]),
    dataCompetencia: new FormControl<Date | null>(null, [Validators.required]),
    dataEmissao: new FormControl<Date | null>(null),
    idCategoria: new FormControl<number | null>(null, [Validators.required]),
    idFornecedor: new FormControl<number | null>(null),
    idClienteFornecedor: new FormControl<number | null>(null),
    numeroDocumento: new FormControl<string | null>(null),
    numeroParcelasAdicionais: new FormControl(0, [Validators.min(0)]),
    meioPagamento: new FormControl('DINHEIRO', [Validators.required]),
    dataPrimeiroVencimento: new FormControl<Date | null>(null),
    numeroCheque: new FormControl<string | null>(null),
    gerarJuros: new FormControl(true),
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

  tiposLancamento = [
    { nome: 'Receita', id: 'RECEITA' },
    { nome: 'Despesa', id: 'DESPESA' },
  ];

  categorias: any[] = [];
  categoriasFiltradas: any[] = [];
  listaFornecedores: any[] = [];
  listaClientes: any[] = [];
  parcelasExistentes: any[] = [];
  idLancamento: number = 0;

  constructor(
    public themeService: CustomizerSettingsService,
    public dialogRef: MatDialogRef<ContasPagarReceberEditLancamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) {
    this.idLancamento = data.idLancamento;
    this.parcelasExistentes = data.parcelas || [];

    // Carregar dados do lançamento no formulário
    this.lancamentoForm.patchValue({
      descricao: data.descricao,
      tipo: data.tipo,
      valorTotal: data.valorTotal,
      dataCompetencia: new Date(data.dataCompetencia),
      idCategoria: data.idCategoria,
      idFornecedor: data.fornecedor?.idFornecedor ?? data.idFornecedor ?? null,
      idClienteFornecedor: data.clienteEmpresa?.idEmpresa ?? data.idClienteFornecedor ?? null,
      numeroDocumento: data.numeroDocumento ?? null,
      dataEmissao: (data.dataEmissao || data.dataInclusao) ? new Date(data.dataEmissao || data.dataInclusao) : null,
    });

    // Sanitização no frontend: só permitir edição de categoria + fornecedor/cliente.
    this.lancamentoForm.get('descricao')?.disable();
    this.lancamentoForm.get('tipo')?.disable();
    this.lancamentoForm.get('valorTotal')?.disable();
    this.lancamentoForm.get('dataCompetencia')?.disable();
    this.lancamentoForm.get('numeroDocumento')?.disable();
    this.lancamentoForm.get('dataEmissao')?.disable();
    this.lancamentoForm.get('numeroParcelasAdicionais')?.disable();
    this.lancamentoForm.get('meioPagamento')?.disable();
    this.lancamentoForm.get('dataPrimeiroVencimento')?.disable();
    this.lancamentoForm.get('numeroCheque')?.disable();
    this.lancamentoForm.get('gerarJuros')?.disable();

    listarFornecedores(true).then(lista => {
      this.listaFornecedores = lista || [];
    });
    buscarEmpresas().then((response: any) => {
      this.listaClientes = response?.data || [];
    });

    buscarCategoriasTodas().then(response => {
      if (response.status === 200) {
        this.categorias = response.data || [];
        this.filtrarCategorias(data.tipo || 'RECEITA');
      }
    });
  }

  ngOnInit() {
    this.lancamentoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.filtrarCategorias(tipo || 'RECEITA');
    });
  }

  filtrarCategorias(tipo: string) {
    if (this.categorias) {
      this.categoriasFiltradas = this.categorias.filter(c => c.tipo === tipo);
    }
  }

  async salvar() {
    const formValue = this.lancamentoForm.getRawValue();
    const payload: any = {
      idCategoria: formValue.idCategoria ?? null,
      ...(formValue.tipo === 'DESPESA'
        ? { idFornecedor: formValue.idFornecedor ?? null }
        : { idClienteFornecedor: formValue.idClienteFornecedor ?? null }),
    };
    const response = await atualizarLancamento(this.idLancamento, payload);
    if (response?.status == 200) {
      this.dialogRef.close();
      this.dialog.open(DialogCadastroSucessoComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
      return;
    }
  }
}

