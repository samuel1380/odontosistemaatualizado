import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FaturaService,
  RelatorioFaturasPendentesResponse,
  EmpresaFaturasPendentes,
  FaturaPendenteItem
} from 'src/services/financeiro.fatura.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

(pdfMake as any).vfs = pdfFonts;

@Component({
  selector: 'app-faturas-pendentes',
  templateUrl: './faturas-pendentes.component.html',
  styleUrls: ['./faturas-pendentes.component.sass']
})
export class FaturasPendentesComponent implements OnInit {
  relatorio: RelatorioFaturasPendentesResponse | null = null;
  carregando = true;
  erro: string | null = null;

  displayedColumns: string[] = [
    'idFatura',
    'vigencia',
    'dataVencimento',
    'valorTotal',
    'valorPago',
    'valorPendente'
  ];

  constructor(
    private faturaService: FaturaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = null;
    this.faturaService.buscarRelatorioFaturasPendentes().subscribe({
      next: (res) => {
        this.relatorio = res;
        this.carregando = false;
      },
      error: (err) => {
        this.erro = err?.error?.resposta || err?.message || 'Falha ao carregar o relatório.';
        this.carregando = false;
        this.snackBar.open(this.erro ?? 'Erro ao carregar.', 'Fechar', { duration: 5000 });
      }
    });
  }

  temDados(): boolean {
    return !!(this.relatorio?.empresas?.length);
  }

  formatarData(isoDate: string): string {
    if (!isoDate) return '—';
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatarVigencia(f: FaturaPendenteItem): string {
    return `${this.formatarData(f.dataInicio)} a ${this.formatarData(f.dataFim)}`;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor ?? 0);
  }

  imprimirPdf(): void {
    if (!this.relatorio || !this.temDados()) {
      this.snackBar.open('Nenhum dado para imprimir.', 'Fechar', { duration: 3000 });
      return;
    }
    this.gerarPdf(this.relatorio);
  }

  private gerarPdf(data: RelatorioFaturasPendentesResponse): void {
    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const content: TDocumentDefinitions['content'] = [
      {
        text: 'Relatório de Faturas Pendentes',
        style: 'header'
      },
      {
        text: `Emitido em: ${dataEmissao}`,
        margin: [0, 5, 0, 20]
      }
    ];

    for (const emp of data.empresas) {
      content.push({
        text: emp.nomeEmpresa,
        style: 'subheader',
        margin: [0, 15, 0, 5]
      });
      content.push({
        text: `Contato: ${emp.contato || '—'}`,
        margin: [0, 0, 0, 8],
        fontSize: 10
      });

      const tableBody = [
        [
          { text: 'ID', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Vigência', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Valor Total', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Valor Pago', style: 'tableHeader', fillColor: '#f5f5f5' },
          { text: 'Valor Pendente', style: 'tableHeader', fillColor: '#f5f5f5' }
        ],
        ...emp.faturas.map((f) => [
          String(f.idFatura),
          `${this.formatarData(f.dataInicio)} a ${this.formatarData(f.dataFim)}`,
          this.formatarMoeda(f.valorTotal),
          this.formatarMoeda(f.valorPago),
          this.formatarMoeda(f.valorPendente)
        ])
      ];

      content.push({
        table: {
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 5]
      });
      content.push({
        text: `Total da empresa: ${this.formatarMoeda(emp.totalPendenteEmpresa)}`,
        bold: true,
        margin: [0, 5, 0, 15],
        alignment: 'right'
      });
    }

    content.push({
      text: `Total geral pendente: ${this.formatarMoeda(data.totalGeralPendente)}`,
      style: 'header',
      margin: [0, 25, 0, 0],
      alignment: 'right'
    });

    const docDefinition: TDocumentDefinitions = {
      pageMargins: [40, 40, 40, 40],
      content,
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 12, bold: true },
        tableHeader: { bold: true }
      }
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    const nomeArquivo = `Faturas_Pendentes_${new Date().toISOString().slice(0, 10)}.pdf`;
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
}
