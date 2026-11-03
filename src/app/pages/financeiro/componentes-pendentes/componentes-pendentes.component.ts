import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, BehaviorSubject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DevolucaoComponenteService, DevolucaoComponente } from 'src/services/devolucao-componente.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { ConfirmacaoDialogComponent } from 'src/app/components/common/componentsconfirmacao-dialog.component';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces';

(pdfMake as any).vfs = pdfFonts;

interface Empresa {
  idEmpresa: number;
  nome: string;
}

/** Agrupamento por tipo de componente (referência + descrição) para resumo e impressão. */
interface AgrupamentoTipoComponente {
  idReferencia: number;
  descricao: string;
  totalQuantidade: number;
  linhas: LinhaDetalheComponente[];
}

/** Linha detalhada por solicitação de devolução. */
interface LinhaDetalheComponente {
  nomePaciente: string;
  nomeEmpresa: string;
  quantidade: number;
  dataEntradaControle: Date | string | null;
  labelFatura: string;
}

/** Empresa (clínica) com solicitações de devolução ainda pendentes — aguardando envio físico / conferência da reposição. */
interface EmpresaReposicaoPendente {
  idEmpresa: number;
  nomeEmpresa: string;
  totalSolicitacoes: number;
  totalQuantidade: number;
  dataPrimeiraSolicitacao: Date | string | null;
}

@Component({
  selector: 'app-componentes-pendentes',
  templateUrl: './componentes-pendentes.component.html',
  styleUrls: ['./componentes-pendentes.component.sass'],
  providers: [DatePipe]
})
export class ComponentesPendentesComponent implements OnInit, OnDestroy {
  empresaFilter = new FormControl<number | null>(null);
  empresas$ = new BehaviorSubject<Empresa[]>([]);
  listaComponentes = new MatTableDataSource<DevolucaoComponente>([]);
  listaConcluidas = new MatTableDataSource<DevolucaoComponente>([]);
  /** Atualizado junto com a lista (não usar getter no template — recria painéis a cada CD e trava o browser). */
  agrupamentosPorTipo: AgrupamentoTipoComponente[] = [];
  /** Empresas com pelo menos uma devolução pendente (reposição ainda não enviada/conferida). */
  resumoEmpresasReposicaoPendente: EmpresaReposicaoPendente[] = [];
  loading = false;

  displayedColumns = [
    'empresa',
    'componente',
    'paciente',
    'quantidade',
    'entradaControle',
    'fatura',
    'observacao',
    'acoes'
  ];

  displayedColumnsConcluidas = [
    'empresa',
    'componente',
    'paciente',
    'quantidade',
    'resolucao',
    'fatura',
    'observacao'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private devolucaoService: DevolucaoComponenteService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadEmpresas();
    this.buscar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
      this.snackBar.open('Falha ao carregar empresas.', 'Fechar', { duration: 3000 });
    }
  }

  buscar() {
    this.loading = true;
    this.agrupamentosPorTipo = [];
    this.resumoEmpresasReposicaoPendente = [];
    this.listaConcluidas.data = [];
    const idEmpresa = this.empresaFilter.value || undefined;

    forkJoin({
      pendentes: this.devolucaoService.listarPendentes(idEmpresa),
      concluidas: this.devolucaoService.listarConcluidas(idEmpresa)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ pendentes, concluidas }) => {
          this.listaComponentes.data = pendentes;
          this.agrupamentosPorTipo = this.montarAgrupamentos(pendentes);
          this.resumoEmpresasReposicaoPendente = this.montarResumoEmpresas(pendentes);
          this.listaConcluidas.data = concluidas;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao buscar componentes', error);
          this.snackBar.open('Erro ao buscar componentes.', 'Fechar', { duration: 3000 });
          this.listaComponentes.data = [];
          this.agrupamentosPorTipo = [];
          this.resumoEmpresasReposicaoPendente = [];
          this.listaConcluidas.data = [];
          this.loading = false;
        }
      });
  }

  getNomeEmpresa(componente: DevolucaoComponente): string {
    return componente.fatura?.empresa?.nome || 'N/A';
  }

  getNomeComponente(componente: DevolucaoComponente): string {
    return componente.ordemServicoItem?.descricao || 'N/A';
  }

  getNomePaciente(componente: DevolucaoComponente): string {
    return componente.ordemServicoItem?.ordemServico?.trabalho?.nomePaciente || 'N/A';
  }

  formatarData(data: Date | string | undefined): string {
    if (!data) return 'N/A';
    return this.datePipe.transform(data, 'dd/MM/yyyy') || 'N/A';
  }

  formatarLabelFatura(componente: DevolucaoComponente): string {
    const id = componente.fatura?.idFatura ?? componente.idFatura;
    if (!id) {
      return '—';
    }
    const ini = componente.fatura?.dataInicio;
    const fim = componente.fatura?.dataFim;
    if (ini && fim) {
      return `#${id} (${this.formatarData(ini)} a ${this.formatarData(fim)})`;
    }
    return `#${id}`;
  }

  trackByGrupo(_index: number, g: AgrupamentoTipoComponente): string {
    return `${g.idReferencia}::${g.descricao}`;
  }

  trackByLinha(_index: number, linha: LinhaDetalheComponente): string {
    return `${linha.nomeEmpresa}|||${linha.nomePaciente}|||${linha.dataEntradaControle}|||${linha.labelFatura}`;
  }

  trackByDevolucao(_index: number, row: DevolucaoComponente): number {
    return row.idDevolucao;
  }

  trackByEmpresaResumo(_index: number, e: EmpresaReposicaoPendente): number {
    return e.idEmpresa;
  }

  private montarResumoEmpresas(itens: DevolucaoComponente[]): EmpresaReposicaoPendente[] {
    const mapa = new Map<
      number,
      { nomeEmpresa: string; totalSolicitacoes: number; totalQuantidade: number; primeira: Date | null }
    >();

    for (const d of itens) {
      const idEmpresa = d.fatura?.idEmpresa;
      if (idEmpresa == null || Number.isNaN(Number(idEmpresa))) {
        continue;
      }
      const nomeEmpresa =
        d.fatura?.empresa?.nome?.trim() ||
        this.getNomeEmpresa(d) ||
        `Empresa #${idEmpresa}`;
      const qtd = Number(d.quantidadeDevolvida ?? 0) || 0;
      const dataSol = d.dataSolicitacao ? new Date(d.dataSolicitacao as unknown as string) : null;

      if (!mapa.has(idEmpresa)) {
        mapa.set(idEmpresa, {
          nomeEmpresa,
          totalSolicitacoes: 0,
          totalQuantidade: 0,
          primeira: dataSol && !Number.isNaN(dataSol.getTime()) ? dataSol : null,
        });
      }
      const agg = mapa.get(idEmpresa)!;
      agg.totalSolicitacoes += 1;
      agg.totalQuantidade += qtd;
      if (dataSol && !Number.isNaN(dataSol.getTime())) {
        if (!agg.primeira || dataSol.getTime() < agg.primeira.getTime()) {
          agg.primeira = dataSol;
        }
      }
    }

    const lista: EmpresaReposicaoPendente[] = [];
    for (const [idEmpresa, v] of mapa) {
      lista.push({
        idEmpresa,
        nomeEmpresa: v.nomeEmpresa,
        totalSolicitacoes: v.totalSolicitacoes,
        totalQuantidade: v.totalQuantidade,
        dataPrimeiraSolicitacao: v.primeira,
      });
    }
    lista.sort((a, b) =>
      a.nomeEmpresa.localeCompare(b.nomeEmpresa, 'pt-BR', { sensitivity: 'base' }),
    );
    return lista;
  }

  private montarAgrupamentos(itens: DevolucaoComponente[]): AgrupamentoTipoComponente[] {
    const mapa = new Map<string, { idRef: number; desc: string; total: number; itens: DevolucaoComponente[] }>();

    for (const d of itens) {
      const osItem = d.ordemServicoItem;
      const idRef = osItem?.idReferencia ?? 0;
      const desc = (osItem?.descricao || 'Sem descrição').trim();
      const chave = `${idRef}::${desc.toLowerCase()}`;
      const qtd = Number(d.quantidadeDevolvida ?? 0) || 0;

      if (!mapa.has(chave)) {
        mapa.set(chave, { idRef, desc, total: 0, itens: [] });
      }
      const g = mapa.get(chave)!;
      g.total += qtd;
      g.itens.push(d);
    }

    const lista: AgrupamentoTipoComponente[] = [];
    for (const [, v] of mapa) {
      lista.push({
        idReferencia: v.idRef,
        descricao: v.desc,
        totalQuantidade: v.total,
        linhas: this.montarLinhasDetalhe(v.itens),
      });
    }
    lista.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' }));
    return lista;
  }

  private montarLinhasDetalhe(itens: DevolucaoComponente[]): LinhaDetalheComponente[] {
    return itens
      .map((d) => ({
        nomePaciente: this.getNomePaciente(d),
        nomeEmpresa: this.getNomeEmpresa(d),
        quantidade: Number(d.quantidadeDevolvida ?? 0) || 0,
        dataEntradaControle: d.dataSolicitacao ?? null,
        labelFatura: this.formatarLabelFatura(d),
      }))
      .sort((a, b) => {
        const da = this.toTimestamp(a.dataEntradaControle);
        const db = this.toTimestamp(b.dataEntradaControle);
        if (da !== db) {
          return da - db;
        }
        return a.nomePaciente.localeCompare(b.nomePaciente, 'pt-BR', { sensitivity: 'base' });
      });
  }

  private toTimestamp(data: Date | string | null | undefined): number {
    if (!data) {
      return 0;
    }
    const t = new Date(data).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  imprimirRelatorio(): void {
    const dados = this.listaComponentes.data;
    const concluidasDados = this.listaConcluidas.data;
    if (!dados.length && !concluidasDados.length) {
      this.snackBar.open('Nenhum dado para imprimir.', 'Fechar', { duration: 3000 });
      return;
    }
    const agrupados = this.montarAgrupamentos(dados);
    const porEmpresa = this.montarResumoEmpresas(dados);
    const dataEmissao = new Date().toLocaleString('pt-BR');
    const filtroEmpresa = this.empresaFilter.value
      ? this.empresas$.value.find((e) => e.idEmpresa === this.empresaFilter.value)?.nome || 'Empresa filtrada'
      : 'Todas as empresas';

    const content: TDocumentDefinitions['content'] = [
      { text: 'Componentes pendentes de devolução', style: 'header' },
      { text: `Emitido em: ${dataEmissao}`, margin: [0, 5, 0, 4], fontSize: 10 },
      { text: `Filtro: ${filtroEmpresa}`, margin: [0, 0, 0, 8], fontSize: 10 },
    ];

    if (porEmpresa.length > 0) {
      content.push({
        text: 'Empresas com reposição pendente de envio',
        style: 'subheader',
        margin: [0, 8, 0, 4],
      });
      content.push({
        text: 'Clínicas com solicitação de devolução ainda não conferida (aguardando envio físico ao laboratório).',
        margin: [0, 0, 0, 6],
        fontSize: 9,
        italics: true,
      });
      const tabelaEmpresas: TableCell[][] = [
        [
          { text: 'Empresa', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Solicitações', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Qtd. total', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: '1ª solicitação', style: 'tableHeader', fillColor: '#f0f0f0' },
        ],
        ...porEmpresa.map(
          (e) =>
            [
              e.nomeEmpresa,
              String(e.totalSolicitacoes),
              String(e.totalQuantidade),
              e.dataPrimeiraSolicitacao
                ? this.datePipe.transform(e.dataPrimeiraSolicitacao, 'dd/MM/yyyy') || '—'
                : '—',
            ] as TableCell[],
        ),
      ];
      content.push({
        table: { widths: ['*', 70, 70, 80], body: tabelaEmpresas },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      });
    }

    if (agrupados.length > 0) {
      content.push({ text: 'Resumo por tipo de componente', style: 'subheader', margin: [0, 4, 0, 0] });

      for (const g of agrupados) {
        content.push({
          text: `${g.descricao} (ref. ${g.idReferencia || '—'})`,
          style: 'subheader',
          margin: [0, 12, 0, 4],
        });
        content.push({
          text: `Quantidade total pendente: ${g.totalQuantidade}`,
          bold: true,
          margin: [0, 0, 0, 6],
          fontSize: 10,
        });
        const linhasDetalhe = g.linhas;
        const corpoTabela: TableCell[][] = [
          [
            { text: 'Paciente', style: 'tableHeader', fillColor: '#f0f0f0' },
            { text: 'Empresa', style: 'tableHeader', fillColor: '#f0f0f0' },
            { text: 'Qtd.', style: 'tableHeader', fillColor: '#f0f0f0' },
            { text: 'Entrada no controle', style: 'tableHeader', fillColor: '#f0f0f0' },
            { text: 'Fatura', style: 'tableHeader', fillColor: '#f0f0f0' },
          ],
          ...linhasDetalhe.map(
            (linha) =>
              [
                linha.nomePaciente,
                linha.nomeEmpresa,
                String(linha.quantidade),
                linha.dataEntradaControle
                  ? this.datePipe.transform(linha.dataEntradaControle, 'dd/MM/yyyy') || '—'
                  : '—',
                linha.labelFatura,
              ] as TableCell[],
          ),
        ];
        content.push({
          table: {
            widths: ['*', '*', 32, 72, 95],
            body: corpoTabela,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 8],
        });
      }
    }

    if (concluidasDados.length > 0) {
      content.push({ text: 'Histórico de Devoluções Concluídas', style: 'subheader', margin: [0, 16, 0, 4] });
      const corpoConcluidas: TableCell[][] = [
        [
          { text: 'Empresa', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Componente', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Paciente', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Qtd.', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Devolução', style: 'tableHeader', fillColor: '#f0f0f0' },
          { text: 'Fatura', style: 'tableHeader', fillColor: '#f0f0f0' },
        ],
        ...concluidasDados.map(
          (c) =>
            [
              this.getNomeEmpresa(c),
              this.getNomeComponente(c),
              this.getNomePaciente(c),
              String(c.quantidadeDevolvida),
              c.dataConferencia
                ? this.datePipe.transform(c.dataConferencia, 'dd/MM/yyyy') || '—'
                : '—',
              this.formatarLabelFatura(c),
            ] as TableCell[],
        ),
      ];
      content.push({
        table: {
          widths: ['*', '*', '*', 30, 65, 90],
          body: corpoConcluidas,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 8],
      });
    }

    const docDefinition: TDocumentDefinitions = {
      pageMargins: [40, 40, 40, 40],
      content,
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 12, bold: true },
        tableHeader: { bold: true, fontSize: 9 },
      },
      defaultStyle: { fontSize: 9 },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    const nomeArquivo = `Componentes_Pendentes_Devolucao_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdfDoc.getDataUrl((dataUrl: string) => {
      const byteCharacters = atob(dataUrl.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.open(dataUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  darBaixa(componente: DevolucaoComponente) {
    const dialogRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Baixa',
        mensagem: `Deseja realmente dar baixa no componente "${this.getNomeComponente(componente)}" da empresa "${this.getNomeEmpresa(componente)}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.devolucaoService.confirmarRecebimento(componente.idDevolucao)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Baixa realizada com sucesso!', 'Fechar', { duration: 3000 });
              this.buscar(); // Atualiza a lista
            },
            error: (error) => {
              console.error('Erro ao dar baixa', error);
              this.snackBar.open('Erro ao dar baixa no componente.', 'Fechar', { duration: 3000 });
              this.loading = false;
            }
          });
      }
    });
  }
}

