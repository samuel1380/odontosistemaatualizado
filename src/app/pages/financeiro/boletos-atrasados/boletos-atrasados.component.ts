import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { listarBoletosAtrasados, BoletoAtrasado } from 'src/services/boleto-atrasado.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { QuitarBoletoDialogComponent } from './quitar-boleto-dialog/quitar-boleto-dialog.component';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

(pdfMake as any).vfs = pdfFonts;

interface Empresa {
  idEmpresa: number;
  nome: string;
}

@Component({
  selector: 'app-boletos-atrasados',
  templateUrl: './boletos-atrasados.component.html',
  styleUrls: ['./boletos-atrasados.component.sass']
})
export class BoletosAtrasadosComponent implements OnInit, OnDestroy {
  listaBoletos = new MatTableDataSource<BoletoAtrasado>([]);
  empresas$ = new BehaviorSubject<Empresa[]>([]);
  empresaFilter = new FormControl<number | null>(null);
  tipoFilter = new FormControl<string | null>(null);
  carregando = false;

  displayedColumns = [
    { coluna: 'dataVencimento', titulo: 'Data Vencimento', date: true },
    { coluna: 'nomeEmpresa', titulo: 'Empresa/Fornecedor' },
    { coluna: 'descricao', titulo: 'Descrição' },
    { coluna: 'tipo', titulo: 'Tipo' },
    { coluna: 'valorRestante', titulo: 'Valor Restante', price: 'BRL' },
    { coluna: 'diasAtraso', titulo: 'Dias Atraso' },
    { coluna: 'juros', titulo: 'Juros', price: 'BRL' },
    { coluna: 'multa', titulo: 'Multa', price: 'BRL' },
    { coluna: 'valorTotalComJuros', titulo: 'Total com Juros', price: 'BRL' },
  ];

  displayedColumnsWithActions = [
    'dataVencimento',
    'nomeEmpresa',
    'descricao',
    'tipo',
    'valorRestante',
    'diasAtraso',
    'juros',
    'multa',
    'valorTotalComJuros',
    'acoes'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit() {
    this.loadEmpresas();
    this.carregarBoletos();

    this.empresaFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarBoletos());

    this.tipoFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarBoletos());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  async carregarBoletos() {
    this.carregando = true;
    try {
      const response = await listarBoletosAtrasados(
        this.empresaFilter.value || undefined,
        this.tipoFilter.value || undefined
      );
      // Garantir que valores numéricos estão presentes
      const boletosProcessados = response.data.map((boleto: any) => ({
        ...boleto,
        juros: boleto.juros || 0,
        multa: boleto.multa || 0,
        valorTotalComJuros: boleto.valorTotalComJuros || boleto.valorRestante
      }));

      // Ordenar do mais antigo para o mais recente (crescente por dataVencimento)
      boletosProcessados.sort((a, b) => {
        const timeA = new Date(a.dataVencimento).getTime();
        const timeB = new Date(b.dataVencimento).getTime();
        return timeA - timeB;
      });

      this.listaBoletos.data = boletosProcessados;
    } catch (error) {
      console.error('Erro ao carregar boletos atrasados', error);
      this.snackBar.open('Erro ao carregar boletos atrasados.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  quitarBoleto(boleto: BoletoAtrasado) {
    this.dialog.open(QuitarBoletoDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: boleto
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarBoletos();
      }
    });
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor ?? 0);
  }

  formatarData(dataIso: string): string {
    if (!dataIso) return '-';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return new Date(dataIso).toLocaleDateString('pt-BR');
  }

  imprimirPdf(): void {
    const boletos = this.listaBoletos.data;
    if (boletos.length === 0) {
      this.snackBar.open('Nenhum dado para imprimir.', 'Fechar', { duration: 3000 });
      return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const content: TDocumentDefinitions['content'] = [
      { text: 'Relatório de Boletos Atrasados', style: 'header' },
      { text: `Emitido em: ${dataEmissao}`, margin: [0, 5, 0, 20] }
    ];

    // Agrupar por nomeEmpresa
    const agrupados = boletos.reduce((acc, boleto) => {
      const nome = boleto.nomeEmpresa || 'Não Informado';
      if (!acc[nome]) {
        acc[nome] = [];
      }
      acc[nome].push(boleto);
      return acc;
    }, {} as Record<string, BoletoAtrasado[]>);

    let totalGeralRestante = 0;

    for (const [empresa, boletosEmpresa] of Object.entries(agrupados)) {
      content.push({ text: empresa, style: 'subheader', margin: [0, 15, 0, 5] });

      const tableBody: any[] = [
        [
          { text: 'Vencimento', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Descrição', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Dias Atraso', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Valor', style: 'tableHeader', fillColor: '#f5f5f5' }
        ]
      ];

      let somaRestante = 0;

      for (const b of boletosEmpresa) {
        somaRestante += b.valorRestante;

        tableBody.push([
          this.formatarData(b.dataVencimento),
          b.descricao || '-',
          String(b.diasAtraso),
          this.formatarMoeda(b.valorRestante)
        ]);
      }

      totalGeralRestante += somaRestante;

      content.push({
        table: {
          widths: ['auto', '*', 'auto', 'auto'],
          body: tableBody
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 5]
      });

      content.push({
        text: `Total: ${this.formatarMoeda(somaRestante)}`,
        bold: true,
        alignment: 'right',
        margin: [0, 0, 0, 10],
        fontSize: 10
      });
    }

    content.push({
      text: `TOTAL GERAL: ${this.formatarMoeda(totalGeralRestante)}`,
      style: 'header',
      alignment: 'right',
      margin: [0, 20, 0, 20],
      fontSize: 14
    });

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true, color: '#333333' },
        tableHeader: { bold: true, fontSize: 10, color: '#000000' }
      },
      defaultStyle: { fontSize: 9 }
    };

    pdfMake.createPdf(docDefinition).open();
  }
}

