import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { DialogConfirmacaoExclusaoArquivoComponent } from 'src/app/components/dialog-confirmacao-exclusao-arquivo/dialog-confirmacao-exclusao-arquivo.component';
import { atualizarLancamento, buscarLancamentoPorId, cancelarParcela, confirmarPagamento } from 'src/services/financeiro.contasPagarReceber.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';
import { listarFornecedores } from 'src/services/financeiro.fornecedor.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { ContaElement } from '../../contas/contas.component';
import { format } from 'date-fns';
import { FaturaService } from 'src/services/financeiro.fatura.service';
import { FaturaDetalhesComponent } from '../../fatura/fatura-detalhes/fatura-detalhes.component';
@Component({
  selector: 'app-contas-pagar-receber-edit',
  templateUrl: './contas-pagar-receber-edit.component.html',
  styleUrl: './contas-pagar-receber-edit.component.sass'
})
export class ContasPagarReceberEditComponent implements OnInit {
  lancamentoForm = new FormGroup({
    descricao: new FormControl({ value: '', disabled: true }),
    dataVencimento: new FormControl({ value: '', disabled: true }),
    valor: new FormControl({ value: 0, disabled: false }),
    /** Juros/multa (somente contas a receber); somados ao caixa e gravados em valorAcrescimoAcumulado da parcela. */
    acrescimo: new FormControl({ value: 0, disabled: false }, [Validators.min(0)]),
    meioPagamento: new FormControl({ value: '', disabled: false }),
    dataPagamento: new FormControl<Date | null>(null, [Validators.required]),
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
  isPago = false;
  isCancelado = false;

  /** Categoria, subcategoria e fornecedor/cliente (lançamento pendente ou já pago). */
  classificacaoForm = new FormGroup({
    idCategoriaPai: new FormControl<number | null>(null, [Validators.required]),
    idSubcategoria: new FormControl<number | null>(null),
    idFornecedor: new FormControl<number | null>(null),
    idClienteFornecedor: new FormControl<number | null>(null),
  });

  categorias: any[] = [];
  categoriasPaiFiltradas: any[] = [];
  subcategoriasDaCategoria: any[] = [];
  listaFornecedores: any[] = [];
  listaClientes: any[] = [];
  lancamentoTipo: 'RECEITA' | 'DESPESA' | null = null;
  idLancamentoParaEdicao: number | null = null;
  /** Salvar classificação e/ou confirmação de pagamento (uma única ação). */
  salvando = false;
  /** Histórico de pagamentos parciais da parcela/fatura (carregado de forma assíncrona). */
  pagamentosHistorico: any[] = [];

  get isContasAPagar(): boolean {
    return this.data?.tipo === 'DESPESA';
  }

  get nomeMeioPagamento(): string {
    const id = this.data?.meioPagamento || this.lancamentoForm.get('meioPagamento')?.value;
    const meio = this.meiosPagamento.find(m => m.id === id);
    return meio?.nome ?? id ?? '-';
  }

  /** Rótulo do campo valor na parcela (contas a receber diferencia total recebido vs. valor em aberto). */
  get rotuloValorCampoParcela(): string {
    if (this.isContasAPagar) {
      return 'Valor';
    }
    if (this.data?.tipo !== 'RECEITA') {
      return 'Valor';
    }
    return this.isPago ? 'Valor total recebido (principal + acréscimos)' : 'Valor principal em aberto';
  }

  /** Botão Salvar: válido quando a classificação está ok e, se ainda não pago, o formulário de pagamento também. */
  get podeSalvar(): boolean {
    if (this.isCancelado) {
      return false;
    }
    if (!this.classificacaoForm.valid) {
      return false;
    }
    if (!this.isPago && !this.lancamentoForm.valid) {
      return false;
    }
    return true;
  }

  constructor(
    public dialogRef: MatDialogRef<ContasPagarReceberEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private faturaService: FaturaService,
    private cdr: ChangeDetectorRef
  ) {
    if (this.data) {
      this.lancamentoForm.patchValue(this.data);
      this.aplicarDataPagamentoIgualVencimento();
      if (this.data.status === 'PAGO') {
        this.isPago = true;

        if (this.data.dataLiquidacao) {
          this.lancamentoForm.patchValue({ dataPagamento: this.parseDataLocalParaDatepicker(this.data.dataLiquidacao) }, { emitEvent: false });
        } else if (this.data.dataPagamento) {
          this.lancamentoForm.patchValue({ dataPagamento: this.parseDataLocalParaDatepicker(this.data.dataPagamento) }, { emitEvent: false });
        }

        if (this.data.tipo === 'DESPESA' && this.data.valorPago) {
          this.lancamentoForm.patchValue({ valor: this.data.valorPago }, { emitEvent: false });
        }

        this.lancamentoForm.get('dataPagamento')?.disable();
        this.lancamentoForm.get('idConta')?.disable();
        this.lancamentoForm.get('descricao')?.disable();
        this.lancamentoForm.get('dataVencimento')?.disable();
        this.lancamentoForm.get('valor')?.disable();
        this.lancamentoForm.get('acrescimo')?.disable();
        this.lancamentoForm.get('meioPagamento')?.disable();
      }
      if (this.data.status === 'CANCELADO') {
        this.isCancelado = true;
      }
      if (this.data.tipo === 'DESPESA') {
        this.lancamentoForm.get('acrescimo')?.disable();
      }
      this.aplicarValorParcelaReceitaNoForm();
    }
    buscarContas().then(response => {
      if (response.status === 200) {
        this.listaContas = response.data;
      }
    });
  }

  /**
   * Contas a receber: valor exibido = principal em aberto (pendente) ou principal+acréscimos já recebidos (pago).
   */
  private aplicarValorParcelaReceitaNoForm(): void {
    if (this.isContasAPagar || this.data?.tipo !== 'RECEITA') {
      return;
    }
    const nominal = Number(this.data.valorParcelaNominal ?? this.data.valor ?? 0);
    const vp = Number(this.data.valorPago ?? 0);
    const va = Number(this.data.valorAcrescimoAcumulado ?? 0);
    if (this.isPago) {
      this.lancamentoForm.patchValue({ valor: vp + va, acrescimo: va }, { emitEvent: false });
    } else {
      const principalEmAberto = Math.max(0, nominal - vp);
      this.lancamentoForm.patchValue({ valor: principalEmAberto }, { emitEvent: false });
    }
  }

  /**
   * Para registrar pagamento, pré-preenche a data do pagamento com a data de vencimento da parcela.
   */
  private aplicarDataPagamentoIgualVencimento(): void {
    if (!this.data || this.data.status === 'PAGO' || this.data.status === 'CANCELADO') {
      return;
    }
    const d = this.parseDataLocalParaDatepicker(this.data.dataVencimento);
    if (d) {
      this.lancamentoForm.patchValue({ dataPagamento: d }, { emitEvent: false });
    }
  }

  /** Converte data vinda da API em Date local (meia-noite) para o mat-datepicker. */
  private parseDataLocalParaDatepicker(val: unknown): Date | null {
    if (val == null || val === '') {
      return null;
    }
    if (val instanceof Date) {
      return new Date(val.getFullYear(), val.getMonth(), val.getDate());
    }
    const s = String(val).trim();
    const isoDia = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (isoDia) {
      const y = parseInt(isoDia[1], 10);
      const m = parseInt(isoDia[2], 10) - 1;
      const day = parseInt(isoDia[3], 10);
      return new Date(y, m, day);
    }
    const parsed = new Date(s);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  ngOnInit(): void {
    this.classificacaoForm.get('idCategoriaPai')?.valueChanges.subscribe((idPai) => {
      this.atualizarSubcategorias(idPai, true);
    });

    listarFornecedores(true).then((lista) => {
      this.listaFornecedores = lista || [];
    });

    buscarEmpresas().then((response: any) => {
      this.listaClientes = response?.data || [];
    });

    const idLanc = this.data?.idLancamento;
    if (idLanc) {
      this.idLancamentoParaEdicao = idLanc;
    }

    Promise.all([buscarCategoriasTodas(), idLanc ? buscarLancamentoPorId(idLanc) : Promise.resolve(null)])
      .then(([catRes, lanRes]: any[]) => {
        if (catRes?.status === 200) {
          this.categorias = catRes.data || [];
        }
        if (lanRes?.status === 200) {
          const l = lanRes.data;
          this.lancamentoTipo = l.tipo;
          this.filtrarCategoriasPai(l.tipo || 'RECEITA');
          this.aplicarCategoriaDoLancamento(l.idCategoria);
          if (l.tipo === 'DESPESA') {
            this.classificacaoForm.patchValue({ idFornecedor: l.idFornecedor ?? null });
            this.lancamentoForm.get('acrescimo')?.disable();
          } else {
            this.classificacaoForm.patchValue({ idClienteFornecedor: l.idClienteFornecedor ?? null });
          }
          // Coleta pagamentos: primeiro tenta achar a parcela exata, depois usa todos os pagamentos de qualquer parcela do lançamento
          let todosPagamentos: any[] = [];
          for (const parcela of (l.parcelas || [])) {
            if (parcela.pagamentos && parcela.pagamentos.length > 0) {
              todosPagamentos.push(...parcela.pagamentos);
            }
          }
          // Se tem idParcela específico, tenta filtrar pelo da parcela atual; caso contrário usa todos
          const parcelaAtiva = l.parcelas?.find((p: any) => p.idParcela == this.data?.idParcela);
          const pagamentosFinais = parcelaAtiva?.pagamentos?.length > 0
            ? parcelaAtiva.pagamentos
            : todosPagamentos;

          if (pagamentosFinais.length > 0) {
            this.pagamentosHistorico = pagamentosFinais.map((pag: any) => ({
              ...pag,
              valorTotalCalculado: Number(pag.valor || 0) + Number(pag.valorAcrescimo || 0)
            }));
            this.cdr.detectChanges();
          }
        } else {
          this.lancamentoTipo = this.data?.tipo ?? null;
          this.filtrarCategoriasPai(this.data?.tipo || 'RECEITA');
          if (this.data?.tipo === 'DESPESA') {
            this.lancamentoForm.get('acrescimo')?.disable();
          }
        }
      })
      .catch(() => {
        this.snackBar.open('Erro ao carregar dados do lançamento.', 'Fechar', { duration: 4000 });
      });
  }

  filtrarCategoriasPai(tipo: string): void {
    if (this.categorias?.length) {
      this.categoriasPaiFiltradas = this.categorias.filter(
        (c: any) => c.tipo === tipo && c.idCategoriaPai == null
      );
    } else {
      this.categoriasPaiFiltradas = [];
    }
  }

  atualizarSubcategorias(idCategoriaPai: number | null, limparSubcategoria = true): void {
    if (limparSubcategoria) {
      this.classificacaoForm.get('idSubcategoria')?.setValue(null, { emitEvent: false });
    }
    if (!idCategoriaPai || !this.categorias?.length) {
      this.subcategoriasDaCategoria = [];
      return;
    }
    this.subcategoriasDaCategoria = this.categorias.filter(
      (c: any) => c.idCategoriaPai === idCategoriaPai
    );
  }

  /** Define pai/subcategoria a partir do idCategoria gravado no lançamento. */
  private aplicarCategoriaDoLancamento(idCategoria: number | null | undefined): void {
    if (idCategoria == null || !this.categorias?.length) {
      return;
    }
    const cat = this.categorias.find((c: any) => c.idCategoria === idCategoria);
    if (!cat) {
      return;
    }
    if (cat.idCategoriaPai != null) {
      this.classificacaoForm.patchValue({ idCategoriaPai: cat.idCategoriaPai }, { emitEvent: false });
      this.atualizarSubcategorias(cat.idCategoriaPai, false);
      this.classificacaoForm.patchValue({ idSubcategoria: cat.idCategoria }, { emitEvent: false });
    } else {
      this.classificacaoForm.patchValue({ idCategoriaPai: cat.idCategoria }, { emitEvent: false });
      this.atualizarSubcategorias(cat.idCategoria, false);
      this.classificacaoForm.patchValue({ idSubcategoria: null }, { emitEvent: false });
    }
  }

  private montarPayloadClassificacao(): {
    idCategoria: number | null;
    idFornecedor?: number | null;
    idClienteFornecedor?: number | null;
  } {
    const v = this.classificacaoForm.getRawValue();
    const idCategoria = v.idSubcategoria ?? v.idCategoriaPai;
    const payload: {
      idCategoria: number | null;
      idFornecedor?: number | null;
      idClienteFornecedor?: number | null;
    } = {
      idCategoria: idCategoria ?? null,
    };
    if (this.lancamentoTipo === 'DESPESA') {
      payload.idFornecedor = v.idFornecedor ?? null;
    } else if (this.lancamentoTipo === 'RECEITA') {
      payload.idClienteFornecedor = v.idClienteFornecedor ?? null;
    }
    return payload;
  }

  /** Atualiza categoria/fornecedor/cliente no lançamento (API). */
  private async persistirClassificacao(): Promise<void> {
    if (!this.idLancamentoParaEdicao) {
      throw new Error('LANCAMENTO_NAO_IDENTIFICADO');
    }
    const payload = this.montarPayloadClassificacao();
    const response = await atualizarLancamento(this.idLancamentoParaEdicao, payload);
    if (response?.status !== 200) {
      throw new Error('ATUALIZAR_LANCAMENTO_FALHOU');
    }
    const idCat = payload.idCategoria;
    const catNome =
      idCat != null ? this.categorias.find((c: any) => c.idCategoria === idCat)?.nome ?? '' : '';
    if (this.data) {
      this.data.categoriaNome = catNome;
    }
  }

  /** Confirma pagamento da parcela (API). */
  private async persistirConfirmacaoPagamento(): Promise<void> {
    const { idParcela } = this.data;
    const { idConta, dataPagamento, valor, acrescimo, meioPagamento } = this.lancamentoForm.getRawValue();

    if (!idParcela) {
      throw new Error('PARCELA_NAO_ENCONTRADA');
    }

    const valorNumerico = Number(valor || this.data.valor || 0);
    const payload: Record<string, unknown> = {
      idConta,
      dataPagamento: format(dataPagamento!, 'yyyy-MM-dd'),
      valor: valorNumerico,
      meioPagamento: meioPagamento || undefined,
    };
    if (!this.isContasAPagar) {
      payload['acrescimo'] = Number(acrescimo ?? 0);
    }

    const response = await confirmarPagamento(idParcela, payload);
    if (response.status !== 201) {
      throw new Error('CONFIRMAR_PAGAMENTO_FALHOU');
    }
  }

  /**
   * Uma única ação: salva classificação e, se o pagamento ainda não estiver feito, confirma o pagamento na mesma sequência.
   */
  async salvar(): Promise<void> {
    if (this.isCancelado) {
      return;
    }

    this.classificacaoForm.markAllAsTouched();
    if (this.classificacaoForm.invalid) {
      return;
    }

    if (!this.isPago) {
      this.lancamentoForm.markAllAsTouched();
      if (this.lancamentoForm.invalid) {
        return;
      }
    }

    if (!this.idLancamentoParaEdicao) {
      this.snackBar.open('Lançamento não identificado.', 'Fechar', { duration: 4000 });
      return;
    }

    this.salvando = true;
    try {
      await this.persistirClassificacao();

      if (!this.isPago) {
        await this.persistirConfirmacaoPagamento();
        this.dialog.open(DialogCadastroSucessoComponent, {
          data: {
            titulo: 'Salvo com sucesso!',
            mensagem:
              'A classificação foi atualizada e o pagamento foi registrado.',
          },
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
      } else {
        this.snackBar.open('Alterações salvas.', 'Fechar', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (e: any) {
      if (e?.message === 'LANCAMENTO_NAO_IDENTIFICADO') {
        this.snackBar.open('Lançamento não identificado.', 'Fechar', { duration: 4000 });
        return;
      }
      if (e?.message === 'PARCELA_NAO_ENCONTRADA') {
        this.snackBar.open('Parcela não encontrada.', 'Fechar', { duration: 4000 });
        return;
      }
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.resposta?.message ||
        e?.message ||
        'Falha ao salvar.';
      this.snackBar.open(msg, 'Fechar', { duration: 5000 });
    } finally {
      this.salvando = false;
    }
  }


  removerParcela = () => {
    const titulo = this.isPago ? 'Confirmar Estorno' : 'Confirmar Exclusão';
    const mensagem = this.isPago 
      ? 'Tem certeza que deseja estornar este pagamento? O valor será atualizado na sua conta.' 
      : 'Tem certeza que deseja remover esta parcela?';

    this.dialog.open(DialogConfirmacaoExclusaoArquivoComponent, {
      data: {
        titulo: titulo,
        mensagem: mensagem
      }
    }).afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        try {
          const response = await cancelarParcela(this.data.idParcela);
          if (response.status === 204) {
            this.dialogRef.close(true);
          } else {
            console.error('Falha ao remover parcela:', response);
          }
        } catch (error: any) {
          console.error('Erro ao remover parcela:', error);
          
          // Verificar se o erro contém mensagem sobre parcelas pagas
          // O Axios coloca a resposta em error.response.data
          // A estrutura do NestJS coloca a mensagem em error.response.data.resposta.message
          const errorMessage = error?.response?.data?.resposta?.message 
            || error?.response?.data?.message 
            || error?.message 
            || '';
          
          if (errorMessage.includes('pagamentos realizados') || errorMessage.includes('estorno')) {
            this.snackBar.open(
              'Não é possível remover esta parcela pois já existem pagamentos realizados neste lançamento. É necessário fazer o estorno dos pagamentos primeiro.',
              'Fechar',
              { duration: 7000 }
            );
          } else if (errorMessage) {
            this.snackBar.open(errorMessage, 'Fechar', { duration: 5000 });
          } else {
            this.snackBar.open('Erro ao remover parcela. Tente novamente.', 'Fechar', { duration: 5000 });
          }
        }
      }
    });
  }

  abrirDetalhesFatura() {
    if (!this.data?.idFatura) return;

    this.salvando = true;
    this.faturaService.buscarFaturaPorId(this.data.idFatura).subscribe({
      next: (fatura) => {
        this.salvando = false;
        const dialogRef = this.dialog.open(FaturaDetalhesComponent, {
          data: fatura,
          width: '90%',
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.faturaAlterada) {
            this.dialogRef.close(true); // Close payment dialog and trigger table refresh
          }
        });
      },
      error: (err) => {
        this.salvando = false;
        console.error(err);
        this.snackBar.open('Erro ao buscar fatura.', 'Fechar', { duration: 3000 });
      }
    });
  }
}
