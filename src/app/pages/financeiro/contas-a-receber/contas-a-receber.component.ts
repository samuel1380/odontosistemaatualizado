import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { DateAdapter } from '@angular/material/core';
import { buscarLancamentos } from 'src/services/financeiro.contasPagarReceber.service';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ContasPagarReceberCadastroComponent } from '../contas-pagar-receber/contas-pagar-receber-cadastro/contas-pagar-receber-cadastro.component';
import { ContasPagarReceberEditComponent } from '../contas-pagar-receber/contas-pagar-receber-edit/contas-pagar-receber-edit.component';
import { ContasPagarReceberEditLancamentoComponent } from '../contas-pagar-receber/contas-pagar-receber-edit-lancamento/contas-pagar-receber-edit-lancamento.component';
import { buscarLancamentoPorId } from 'src/services/financeiro.contasPagarReceber.service';
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
  selector: 'app-contas-a-receber',
  templateUrl: './contas-a-receber.component.html',
  styleUrl: './contas-a-receber.component.sass'
})
export class ContasAReceberComponent {
  lancamentoList = new MatTableDataSource<any>([]);
  totalSomatoria = 0;

  displayedColumnsLancamento: any[] = [
    { coluna: 'dataEmissao', titulo: 'Data Emissão', date: true },
    { coluna: 'dataVencimento', titulo: 'Data Vencimento', date: true },
    { coluna: 'descricao', titulo: 'Descrição' },
    { coluna: 'categoriaExibicao', titulo: 'Categoria' },
    { coluna: 'subcategoriaExibicao', titulo: 'Subcategoria' },
    { coluna: 'numeroDocumento', titulo: 'Nº Doc.' },
    { coluna: 'nomeEmpresa', titulo: 'Empresa', whatsapp: true, whatsappLinkField: 'linkWhatsApp' },
    { coluna: 'valor', titulo: 'Valor', price: 'BRL' },
    { coluna: 'valorAcrescimoAcumulado', titulo: 'Valor acrescido', price: 'BRL' },
    { coluna: 'valorTotalParcela', titulo: 'Valor total', price: 'BRL' },
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

  constructor(
    private dialog: MatDialog,
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
      this.subcategoriaControl.setValue(null, { emitEvent: false });
    });
  }

  async carregarCategorias() {
    try {
      const resp: any = await buscarCategoriasTodas();
      const todas = resp?.data || [];
      this.categoriasPai = (todas || []).filter((c: any) => !c?.idCategoriaPai);
      this.atualizarSubcategorias(this.categoriaPaiControl.value ?? null, todas);
    } catch {
      this.categoriasPai = [];
      this.subcategorias = [];
    }
  }

  atualizarSubcategorias(idCategoriaPai: number | null, todasCategorias?: any[]) {
    const todas = todasCategorias ?? ([] as any[]);
    if (!idCategoriaPai) {
      this.subcategorias = [];
      return;
    }
    this.subcategorias = (todas || [])
      .filter((c: any) => Number(c?.idCategoriaPai) === Number(idCategoriaPai));
  }

  buscarLancamentos() {
    const query = {
      ano: this.anoControl.value,
      mes: this.mesControl.value,
      tipo: 'RECEITA',
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
            const nominal = Number(parcela.valor);
            const va = Number(parcela.valorAcrescimoAcumulado ?? 0);
            const telefoneFinanceiro = retorno.clienteEmpresa?.telefoneFinanceiro
              ? String(retorno.clienteEmpresa.telefoneFinanceiro)
              : '';
            const linkWhatsApp = (() => {
              if (!telefoneFinanceiro) return '';
              let digits = telefoneFinanceiro.replace(/\D/g, '').replace(/^0+/, '');
              if (digits.length <= 11) digits = '55' + digits;
              return digits ? `whatsapp://send/?phone=${digits}&text&type=phone_number&app_absent=0` : '';
            })();
            return {
            ...parcela,
            idParcela: parcela.idParcela,
              idLancamento: retorno.idLancamento,
              idFatura: retorno.idFatura,
              descricao: retorno.totalParcelas > 1 ? `${retorno.descricao.replace(/\s*\(\d+ parcelas\)/g, '')} - ${parcela.numeroParcela}/${retorno.totalParcelas}` : retorno.descricao,
              numeroDocumento: retorno.numeroDocumento ?? '-',
            dataEmissao: retorno.dataEmissao || retorno.dataInclusao,
            dataCompetencia: retorno.dataCompetencia,
            dataVencimento: parcela.dataVencimento,
            dataLiquidacao: parcela.dataPagamento,
            valor: nominal,
            valorTotalParcela: nominal + va,
            valorTotal: retorno.valorTotal,
            valorPago: parcela.valorPago ?? 0,
            valorAcrescimoAcumulado: va,
            status: parcela.status,
            nomeEmpresa: retorno.clienteEmpresa ? (retorno.clienteEmpresa.nomeFantasia || retorno.clienteEmpresa.nome) : (retorno.nomeCliente ?? (retorno.idClienteFornecedor ? `Empresa #${retorno.idClienteFornecedor}` : '-')),
            telefoneFinanceiro,
            linkWhatsApp,
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

  adicionarLancamento() {
    this.dialog.open(ContasPagarReceberCadastroComponent, {
      width: 'min(720px, 95vw)',
      maxHeight: '90vh',
      panelClass: 'contas-pagar-receber-cadastro-dialog',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: {
        tipo: 'RECEITA',
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
