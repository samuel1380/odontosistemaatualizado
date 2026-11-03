import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { DateAdapter } from '@angular/material/core';
import { buscarLancamentos, classificarLancamentosSemCategoria } from 'src/services/financeiro.contasPagarReceber.service';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ContasPagarReceberCadastroComponent } from '../contas-pagar-receber/contas-pagar-receber-cadastro/contas-pagar-receber-cadastro.component';
import { ContasPagarReceberEditComponent } from '../contas-pagar-receber/contas-pagar-receber-edit/contas-pagar-receber-edit.component';
import { ContasPagarReceberEditLancamentoComponent } from '../contas-pagar-receber/contas-pagar-receber-edit-lancamento/contas-pagar-receber-edit-lancamento.component';
import { buscarLancamentoPorId } from 'src/services/financeiro.contasPagarReceber.service';
import { ImportarOfxContasPagarDialogComponent } from './importar-ofx-contas-pagar-dialog/importar-ofx-contas-pagar-dialog.component';
import { ImportarCsvHistoricoDialogComponent } from '../contas-pagar-receber/importar-csv-historico-dialog/importar-csv-historico-dialog.component';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';
import { combineLatest, startWith, debounceTime } from 'rxjs';

/** Categoria pai + subcategoria conforme vínculo do lançamento (para conferência na grade). */
function exibirCategoriaSub(retorno: { categoria?: any }, categoriasPai: any[]): { categoria: string; subcategoria: string } {
  const cat = retorno?.categoria;
  if (!cat) {
    return { categoria: '—', subcategoria: '—' };
  }
  if (cat.idCategoriaPai) {
    const paiNome = cat.categoriaPai?.nome || categoriasPai.find(c => c.idCategoria === cat.idCategoriaPai)?.nome || '—';
    return { categoria: paiNome, subcategoria: cat.nome };
  }
  return { categoria: cat.nome, subcategoria: '—' };
}

@Component({
  selector: 'app-contas-a-pagar',
  templateUrl: './contas-a-pagar.component.html',
  styleUrl: './contas-a-pagar.component.sass'
})
export class ContasAPagarComponent {
  lancamentoList = new MatTableDataSource<any>([]);
  totalSomatoria = 0;

  displayedColumnsLancamento: any[] = [
    { coluna: 'dataEmissao', titulo: 'Data Emissão', date: true },
    { coluna: 'dataVencimento', titulo: 'Data Vencimento', date: true },
    { coluna: 'descricao', titulo: 'Descrição' },
    { coluna: 'categoriaExibicao', titulo: 'Categoria' },
    { coluna: 'subcategoriaExibicao', titulo: 'Subcategoria' },
    { coluna: 'numeroDocumento', titulo: 'Nº Doc.' },
    { coluna: 'fornecedor', titulo: 'Fornecedor' },
    { coluna: 'valor', titulo: 'Valor Bruto', price: 'BRL' },
    { coluna: 'dataLiquidacao', titulo: 'Data Liquidação', date: true },
    { coluna: 'valorPago', titulo: 'Valor Pago', price: 'BRL' },
    { coluna: 'status', titulo: 'Status' },
  ];

  lancamentoSelecionado: any = null;

  listaAnos = [2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].map(id => ({ nome: String(id), id }));
  listaMeses = [
    { nome: 'Janeiro', id: 1 }, { nome: 'Fevereiro', id: 2 }, { nome: 'Março', id: 3 }, { nome: 'Abril', id: 4 },
    { nome: 'Maio', id: 5 }, { nome: 'Junho', id: 6 }, { nome: 'Julho', id: 7 }, { nome: 'Agosto', id: 8 },
    { nome: 'Setembro', id: 9 }, { nome: 'Outubro', id: 10 }, { nome: 'Novembro', id: 11 }, { nome: 'Dezembro', id: 12 },
  ];

  anoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number>(new Date().getMonth() + 1);
  statusControl = new FormControl<string | null>(null);
  categoriaPaiControl = new FormControl<number | null>(null);
  subcategoriaControl = new FormControl<number | null>(null);

  categoriasPai: any[] = [];
  subcategorias: any[] = [];

  statusOptions = [
    { id: null, nome: 'Todos' },
    { id: 'ABERTO', nome: 'Aberto' },
    { id: 'PAGO', nome: 'Pago' },
    { id: 'CANCELADO', nome: 'Cancelado' },
    { id: 'VENCIDO', nome: 'Vencido' },
  ];

  classificandoCategoria = false;

  todasCategorias: any[] = [];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public themeService: CustomizerSettingsService,
    private dateAdapter: DateAdapter<unknown>,
  ) {
    this.dateAdapter.setLocale('pt-br');
    this.carregarCategorias();

    combineLatest([
      this.anoControl.valueChanges.pipe(startWith(this.anoControl.value)),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value)),
      this.statusControl.valueChanges.pipe(startWith(this.statusControl.value)),
      this.categoriaPaiControl.valueChanges.pipe(startWith(this.categoriaPaiControl.value)),
      this.subcategoriaControl.valueChanges.pipe(startWith(this.subcategoriaControl.value)),
    ])
      .pipe(debounceTime(250))
      .subscribe(() => this.buscarLancamentos());

    this.categoriaPaiControl.valueChanges.subscribe((idPai) => {
      this.atualizarSubcategorias(idPai ?? null);
      // quando troca a categoria pai, limpa a subcategoria para não ficar inconsistente
      this.subcategoriaControl.setValue(null, { emitEvent: false });
    });
  }

  async carregarCategorias() {
    try {
      const resp: any = await buscarCategoriasTodas();
      this.todasCategorias = resp?.data || [];
      this.categoriasPai = (this.todasCategorias || []).filter((c: any) => !c?.idCategoriaPai);
      this.atualizarSubcategorias(this.categoriaPaiControl.value ?? null);
    } catch {
      this.todasCategorias = [];
      this.categoriasPai = [];
      this.subcategorias = [];
    }
  }

  atualizarSubcategorias(idCategoriaPai: number | null) {
    if (!idCategoriaPai) {
      this.subcategorias = [];
      return;
    }
    this.subcategorias = (this.todasCategorias || [])
      .filter((c: any) => Number(c?.idCategoriaPai) === Number(idCategoriaPai));
  }

  buscarLancamentos() {
    const query = {
      ano: this.anoControl.value,
      mes: this.mesControl.value,
      tipo: 'DESPESA',
      incluirTotais: '1',
      statusParcela: this.statusControl.value || undefined,
      idCategoriaPai: this.categoriaPaiControl.value || undefined,
      idCategoria: this.subcategoriaControl.value || undefined,
    };
    buscarLancamentos(query).then((response: any) => {
      if (response.status === 200) {
        const payload = response.data;
        const dados = Array.isArray(payload) ? payload : (payload?.dados || []);
        this.totalSomatoria = Number(payload?.totais?.valor ?? 0);

        const data = (dados || []).flatMap((retorno: any) =>
          (retorno.parcelas || []).map((parcela: any) => {
            const catSub = exibirCategoriaSub(retorno, this.categoriasPai);
            return {
            ...parcela,
            idParcela: parcela.idParcela,
              idLancamento: retorno.idLancamento,
              descricao: retorno.totalParcelas > 1 ? `${retorno.descricao.replace(/\s*\(\d+ parcelas\)/g, '')} - ${parcela.numeroParcela}/${retorno.totalParcelas}` : retorno.descricao,
              numeroDocumento: retorno.numeroDocumento ?? '-',
            dataEmissao: retorno.dataEmissao || retorno.dataInclusao,
            dataCompetencia: retorno.dataCompetencia,
            dataVencimento: parcela.dataVencimento,
            dataLiquidacao: parcela.dataPagamento,
            valor: parcela.valor,
            valorTotal: retorno.valorTotal,
            valorPago: parcela.valorPago ?? 0,
            status: parcela.status,
            fornecedor: retorno.fornecedor ? (retorno.fornecedor.nomeFantasia || retorno.fornecedor.razaoSocial) : '-',
            categoriaExibicao: catSub.categoria,
            subcategoriaExibicao: catSub.subcategoria,
            idConta: parcela.movimentacao?.idConta,
            numeroParcela: `${parcela.numeroParcela}/${retorno.totalParcelas}`,
            totalParcelas: retorno.totalParcelas,
            meioPagamento: parcela.meioPagamento,
            tipo: retorno.tipo,
          };
          })
        );
        this.lancamentoList.data = data;
      }
    });
  }

  importarOfx() {
    this.dialog
      .open(ImportarOfxContasPagarDialogComponent, {
        width: 'min(560px, 95vw)',
        maxHeight: '90vh',
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.buscarLancamentos();
      });
  }

  importarCsvHistorico() {
    this.dialog
      .open(ImportarCsvHistoricoDialogComponent, {
        width: 'min(560px, 95vw)',
        maxHeight: '90vh',
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.buscarLancamentos();
      });
  }

  async classificarSemCategoria() {
    this.classificandoCategoria = true;
    try {
      const resultado = await classificarLancamentosSemCategoria();
      const msg = resultado.classificados > 0
        ? `✅ ${resultado.classificados} lançamento(s) classificado(s) de ${resultado.processados} analisado(s).`
        : `ℹ️ Nenhum lançamento foi classificado (${resultado.processados} analisado(s) sem match).`;
      this.snackBar.open(msg, 'Fechar', { duration: 6000 });
      if (resultado.classificados > 0) {
        this.buscarLancamentos();
      }
    } catch (e: any) {
      this.snackBar.open('Erro ao classificar lançamentos. Tente novamente.', 'Fechar', { duration: 5000 });
    } finally {
      this.classificandoCategoria = false;
    }
  }

  adicionarLancamento() {
    this.dialog.open(ContasPagarReceberCadastroComponent, {
      width: 'min(720px, 95vw)',
      maxHeight: '90vh',
      panelClass: 'contas-pagar-receber-cadastro-dialog',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: {
        tipo: 'DESPESA',
        onRegistrado: () => this.buscarLancamentos(),
      },
    }).afterClosed().subscribe(() => {
      this.buscarLancamentos();
    });
  }

  realizarPagamento(event: any) {
    this.lancamentoSelecionado = event;
    this.dialog.open(ContasPagarReceberEditComponent, {
      width: 'min(720px, 95vw)',
      maxHeight: '90vh',
      panelClass: 'contas-pagar-receber-edit-dialog',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: event
    }).afterClosed().subscribe(() => {
      this.buscarLancamentos();
      this.lancamentoSelecionado = null;
    });
  }

  editarLancamento(event: any) {
    if (!event?.idLancamento) return;
    buscarLancamentoPorId(event.idLancamento).then((response: any) => {
      if (response.status === 200) {
        this.dialog.open(ContasPagarReceberEditLancamentoComponent, {
          width: '50%',
          enterAnimationDuration: '100ms',
          exitAnimationDuration: '100ms',
          data: response.data
        }).afterClosed().subscribe(() => {
          this.buscarLancamentos();
        });
      }
    });
  }

  getRowClass = (row: any) => (row?.status === 'CANCELADO' ? { 'linha-cancelada': true } : {});
}
