import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';

import { FormControl, FormGroup, Validators } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { format } from 'date-fns';
import { cadastrarLancamentos } from 'src/services/financeiro.contasPagarReceber.service';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { listarFornecedores } from 'src/services/financeiro.fornecedor.service';
import { listarEmprestimos, Emprestimo } from 'src/services/capital.service';
import { ContaElement } from '../../contas/contas.component';

@Component({
  selector: 'app-contas-pagar-receber-cadastro',
  templateUrl: './contas-pagar-receber-cadastro.component.html',
  styleUrl: './contas-pagar-receber-cadastro.component.sass'
})
export class ContasPagarReceberCadastroComponent implements OnInit {
  @ViewChild('descricaoInput') descricaoInput?: ElementRef<HTMLInputElement>;

  /** Evita cliques duplos durante o POST. */
  salvando = false;

  /** Array de parcelas editáveis pelo usuário. */
  parcelasEditaveis: { valor: number; dataVencimentoStr: string }[] = [{ valor: 0, dataVencimentoStr: '' }];

  lancamentoForm = new FormGroup({
    descricao: new FormControl('', [Validators.required]),
    tipo: new FormControl('RECEITA', [Validators.required]),
    valorTotal: new FormControl(0, [Validators.required]),
    dataCompetencia: new FormControl<Date | null>(null, [Validators.required]),
    idCategoriaPai: new FormControl<number | null>(null, [Validators.required]),
    idSubcategoria: new FormControl<number | null>(null),
    parcelas: new FormControl([]),
    meioPagamento: new FormControl('DINHEIRO', [Validators.required]),
    numeroCheque: new FormControl<string | null>(null),
    gerarJuros: new FormControl(true), // Default true
    pagamentoImediato: new FormControl(false),
    idContaPagamento: new FormControl<number | null>(null),
    idFornecedor: new FormControl<number | null>(null),
    idClienteFornecedor: new FormControl<number | null>(null),
    numeroDocumento: new FormControl<string | null>(null),
    dataEmissao: new FormControl<Date | null>(null),
    idEmprestimo: new FormControl<number | null>(null),
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
  categoriasPaiFiltradas: any[] = [];
  subcategoriasDaCategoria: any[] = [];
  listaContas: ContaElement[] = [];
  listaFornecedores: any[] = [];
  emprestimosParaPagamento: Emprestimo[] = [];

  /**
   * Se verdadeiro, após salvar com sucesso o popup permanece aberto e o foco vai para a descrição
   * com o texto selecionado (até desmarcar ou fechar).
   */
  criarOutro = false;

  constructor(
    public themeService: CustomizerSettingsService,
    public dialogRef: MatDialogRef<ContasPagarReceberCadastroComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      tipo?: 'RECEITA' | 'DESPESA';
      /** Atualiza lista/grid após cada cadastro (útil com "Criar outro"). */
      onRegistrado?: () => void;
    } | null,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    if (data?.tipo) {
      this.lancamentoForm.patchValue({ tipo: data.tipo });
    }
    buscarCategoriasTodas().then(response => {
      if (response.status === 200) {
        this.categorias = response.data || [];
        this.filtrarCategoriasPai(this.lancamentoForm.get('tipo')?.value || 'RECEITA');
        void this.atualizarEmprestimosParaPagamento();
      }
    });

    buscarContas().then(response => {
      if (response.status === 200) {
        this.listaContas = response.data;
      }
    });

    listarFornecedores(true).then(lista => {
      this.listaFornecedores = lista || [];
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Getters para parcelas
  // ──────────────────────────────────────────────────────────────

  /** Soma os valores de todas as parcelas editáveis. */
  get totalParcelasEditaveis(): number {
    return Math.round(this.parcelasEditaveis.reduce((s, p) => s + Number(p.valor || 0), 0) * 100) / 100;
  }

  /** Diferença entre valor total do form e soma das parcelas. */
  get diferencaTotal(): number {
    const valorTotal = Number(this.lancamentoForm.get('valorTotal')?.value || 0);
    return Math.round((valorTotal - this.totalParcelasEditaveis) * 100) / 100;
  }

  /** True se a soma das parcelas bate com o valor total (tolerância de 1 centavo). */
  get parcelasValidas(): boolean {
    return Math.abs(this.diferencaTotal) < 0.01;
  }

  // ──────────────────────────────────────────────────────────────
  // Métodos de controle de parcelas
  // ──────────────────────────────────────────────────────────────

  /** Adiciona uma nova parcela ao final, redistribuindo os valores. */
  adicionarParcela(): void {
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

  /** Remove a última parcela e redistribui os valores. */
  removerUltimaParcela(): void {
    if (this.parcelasEditaveis.length <= 1) return;
    this.parcelasEditaveis.pop();
    this.redistribuirValores();
  }

  /** Remove uma parcela pelo índice e redistribui os valores. */
  removerParcela(i: number): void {
    if (this.parcelasEditaveis.length <= 1) return;
    this.parcelasEditaveis.splice(i, 1);
    this.redistribuirValores();
  }

  /**
   * Divide o valorTotal igualmente entre as parcelas,
   * ajustando a última para compensar diferenças de arredondamento.
   */
  redistribuirValores(quantidadeAlvo?: number): void {
    const n = quantidadeAlvo ?? this.parcelasEditaveis.length;
    if (n <= 0) return;
    const valorTotal = Number(this.lancamentoForm.get('valorTotal')?.value || 0);
    const valorParcela = Math.round((valorTotal / n) * 100) / 100;
    for (let i = 0; i < this.parcelasEditaveis.length; i++) {
      this.parcelasEditaveis[i].valor = valorParcela;
    }
    // Ajusta a última para compensar arredondamento
    if (this.parcelasEditaveis.length > 0) {
      const soma = valorParcela * this.parcelasEditaveis.length;
      this.parcelasEditaveis[this.parcelasEditaveis.length - 1].valor =
        Math.round((valorParcela + (valorTotal - soma)) * 100) / 100;
    }
  }

  /** Chamado quando o valor total muda: redistribui os valores entre as parcelas. */
  onValorTotalChange(): void {
    this.redistribuirValores();
  }

  /**
   * Chamado quando a data da primeira parcela muda:
   * preenche automaticamente as datas das demais parcelas que estiverem vazias.
   */
  onDataPrimeiraParcelaChange(): void {
    const primeira = this.parcelasEditaveis[0];
    if (!primeira?.dataVencimentoStr) return;
    for (let i = 1; i < this.parcelasEditaveis.length; i++) {
      if (!this.parcelasEditaveis[i].dataVencimentoStr) {
        const d = new Date(this.parcelasEditaveis[i - 1].dataVencimentoStr + 'T12:00:00');
        d.setMonth(d.getMonth() + 1);
        this.parcelasEditaveis[i].dataVencimentoStr = d.toISOString().split('T')[0];
      }
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Getters de categoria/empréstimo
  // ──────────────────────────────────────────────────────────────

  get classificacaoCategoriaSelecionada(): string | null {
    const idSub = this.lancamentoForm.get('idSubcategoria')?.value;
    const idPai = this.lancamentoForm.get('idCategoriaPai')?.value;
    const idCat = idSub ?? idPai;
    if (!idCat || !this.categorias?.length) {
      return null;
    }
    const cat = this.categorias.find((c: any) => c.idCategoria === idCat);
    return cat?.classificacaoDre ?? null;
  }

  get exibirSelectEmprestimo(): boolean {
    return (
      this.lancamentoForm.get('tipo')?.value === 'DESPESA' &&
      this.classificacaoCategoriaSelecionada === 'SAIDA_FINANCIAMENTO'
    );
  }

  /** Mantido por compatibilidade; o novo sistema de parcelas está sempre disponível. */
  permitirParcelamento(): boolean {
    return false;
  }

  // ──────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ──────────────────────────────────────────────────────────────

  ngOnInit() {
    this.lancamentoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.filtrarCategoriasPai(tipo || 'RECEITA');
    });
    this.lancamentoForm.get('idCategoriaPai')?.valueChanges.subscribe(idPai => {
      this.atualizarSubcategorias(idPai);
      this.lancamentoForm.patchValue({ idEmprestimo: null }, { emitEvent: false });
      this.atualizarEmprestimosParaPagamento();
    });
    this.lancamentoForm.get('idSubcategoria')?.valueChanges.subscribe(() => {
      this.lancamentoForm.patchValue({ idEmprestimo: null }, { emitEvent: false });
      this.atualizarEmprestimosParaPagamento();
    });
    this.lancamentoForm.get('tipo')?.valueChanges.subscribe(() => {
      this.lancamentoForm.patchValue({ idEmprestimo: null }, { emitEvent: false });
      this.atualizarEmprestimosParaPagamento();
    });

    // Redistribui parcelas quando o valor total muda
    this.lancamentoForm.get('valorTotal')?.valueChanges.subscribe(() => {
      this.redistribuirValores();
    });

    // Adicionar validação condicional para idContaPagamento quando pagamentoImediato estiver marcado
    this.lancamentoForm.get('pagamentoImediato')?.valueChanges.subscribe(pagamentoImediato => {
      if (pagamentoImediato) {
        this.lancamentoForm.get('idContaPagamento')?.setValidators([Validators.required]);
      } else {
        this.lancamentoForm.get('idContaPagamento')?.clearValidators();
      }
      this.lancamentoForm.get('idContaPagamento')?.updateValueAndValidity();
    });

    void this.atualizarEmprestimosParaPagamento();
  }

  // ──────────────────────────────────────────────────────────────
  // Métodos privados
  // ──────────────────────────────────────────────────────────────

  private async atualizarEmprestimosParaPagamento(): Promise<void> {
    if (!this.exibirSelectEmprestimo) {
      this.emprestimosParaPagamento = [];
      this.lancamentoForm.get('idEmprestimo')?.clearValidators();
      this.lancamentoForm.get('idEmprestimo')?.updateValueAndValidity({ emitEvent: false });
      return;
    }
    this.lancamentoForm.get('idEmprestimo')?.setValidators([Validators.required]);
    this.lancamentoForm.get('idEmprestimo')?.updateValueAndValidity({ emitEvent: false });
    try {
      const res = await listarEmprestimos('RECEBIDO', 'ATIVO');
      const lista: Emprestimo[] = res.data || [];
      this.emprestimosParaPagamento = lista.filter((e) => {
        const saldo = Number(e.saldoRestante ?? e.valorPrincipal);
        return saldo > 0.009;
      });
    } catch {
      this.emprestimosParaPagamento = [];
    }
  }

  filtrarCategoriasPai(tipo: string) {
    if (this.categorias?.length) {
      this.categoriasPaiFiltradas = this.categorias.filter((c: any) => c.tipo === tipo && c.idCategoriaPai == null);
    } else {
      this.categoriasPaiFiltradas = [];
    }
    this.lancamentoForm.get('idCategoriaPai')?.setValue(null);
    this.lancamentoForm.get('idSubcategoria')?.setValue(null);
    this.lancamentoForm.patchValue({ idEmprestimo: null }, { emitEvent: false });
    this.subcategoriasDaCategoria = [];
    this.atualizarEmprestimosParaPagamento();
  }

  atualizarSubcategorias(idCategoriaPai: number | null) {
    this.lancamentoForm.get('idSubcategoria')?.setValue(null);
    if (!idCategoriaPai || !this.categorias?.length) {
      this.subcategoriasDaCategoria = [];
      return;
    }
    this.subcategoriasDaCategoria = this.categorias.filter(
      (c: any) => c.idCategoriaPai === idCategoriaPai
    );
  }

  // ──────────────────────────────────────────────────────────────
  // Salvar
  // ──────────────────────────────────────────────────────────────

  async salvar() {
    this.lancamentoForm.markAllAsTouched();
    if (this.lancamentoForm.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios corretamente.', 'Fechar', {
        duration: 5000,
      });
      return;
    }

    const formValue = this.lancamentoForm.getRawValue();

    const valorNum = Number(formValue.valorTotal);
    // Não usar !formValue.valorTotal: o valor 0 é falsy e bloqueava o salvamento sem feedback.
    if (Number.isNaN(valorNum) || valorNum <= 0) {
      this.snackBar.open('Informe um valor total maior que zero.', 'Fechar', { duration: 5000 });
      this.lancamentoForm.get('valorTotal')?.markAsTouched();
      return;
    }

    // Valida parcelas
    const parcelasComErro = this.parcelasEditaveis.some(p => !p.dataVencimentoStr || !p.valor || p.valor <= 0);
    if (parcelasComErro) {
      this.snackBar.open('Preencha a data e o valor de todas as parcelas.', 'Fechar', { duration: 5000 });
      return;
    }
    if (!this.parcelasValidas) {
      this.snackBar.open(
        `A soma das parcelas deve ser igual ao valor total. Diferença: R$ ${this.diferencaTotal.toFixed(2)}`,
        'Fechar',
        { duration: 5000 }
      );
      return;
    }

    // Gera array de parcelas a partir das parcelas editáveis
    const parcelasGeradas = this.parcelasEditaveis.map((p, i) => ({
      numeroParcela: i + 1,
      valor: Number(p.valor),
      dataVencimento: p.dataVencimentoStr, // já está em YYYY-MM-DD
      meioPagamento: formValue.meioPagamento,
      gerarJuros: formValue.gerarJuros !== false, // Default true
      // Adiciona dados do cheque se necessário
      ...(formValue.meioPagamento === 'CHEQUE' && {
        dadosAdicionais: { numeroCheque: `${formValue.numeroCheque}-${i + 1}` }
      })
    }));

    const idCategoria = formValue.idSubcategoria ?? formValue.idCategoriaPai;
    const payload: any = {
      ...formValue,
      idCategoria,
      dataCompetencia: format(new Date(formValue.dataCompetencia!), 'yyyy-MM-dd'),
      dataEmissao: formValue.dataEmissao ? format(new Date(formValue.dataEmissao), 'yyyy-MM-dd') : undefined,
      parcelas: parcelasGeradas,
      pagamentoImediato: formValue.pagamentoImediato && formValue.idContaPagamento ? {
        idConta: formValue.idContaPagamento,
        dataPagamento: format(new Date(), 'yyyy-MM-dd')
      } : undefined
    };
    delete payload.idCategoriaPai;
    delete payload.idSubcategoria;
    if (formValue.tipo === 'DESPESA' && formValue.idFornecedor) {
      payload.idFornecedor = formValue.idFornecedor;
    } else {
      delete payload.idFornecedor;
    }

    if (this.exibirSelectEmprestimo) {
      if (this.emprestimosParaPagamento.length === 0) {
        this.snackBar.open('Não há empréstimo recebido ativo com saldo devedor para vincular.', 'Fechar', {
          duration: 6000,
        });
        return;
      }
      if (formValue.idEmprestimo == null) {
        this.snackBar.open('Selecione o empréstimo que está sendo pago.', 'Fechar', { duration: 5000 });
        return;
      }
      payload.idEmprestimo = formValue.idEmprestimo;
    } else {
      delete payload.idEmprestimo;
    }

    this.salvando = true;
    try {
      const response = await cadastrarLancamentos(payload);
      const ok = response?.status === 201 || response?.status === 200;
      if (!ok) {
        this.snackBar.open('Não foi possível salvar o lançamento. Tente novamente.', 'Fechar', {
          duration: 5000,
        });
        return;
      }

      if (this.criarOutro) {
        this.data?.onRegistrado?.();
        this.snackBar.open('Lançamento salvo com sucesso. Você pode preencher o próximo.', 'Fechar', {
          duration: 5000,
        });
        this.focarDescricaoESelecionarTexto();
        return;
      }

      this.dialogRef.close(true);
      this.dialog.open(DialogCadastroSucessoComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.resposta?.message ||
        e?.message ||
        'Erro ao salvar o lançamento.';
      this.snackBar.open(msg, 'Fechar', { duration: 6000 });
    } finally {
      this.salvando = false;
    }
  }

  /** Foca a descrição e seleciona todo o texto (para digitar o próximo lançamento sem limpar os demais campos). */
  private focarDescricaoESelecionarTexto(): void {
    setTimeout(() => {
      const el = this.descricaoInput?.nativeElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }
}
