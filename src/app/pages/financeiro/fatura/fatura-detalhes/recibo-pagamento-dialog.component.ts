import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { envFront } from 'src/services/envfile';
import { LOGO_ODONTOPRINT_BASE64 } from 'src/assets/logo-base64';

(pdfMake as any).vfs = pdfFonts;

export interface ReciboPagamentoDialogData {
  idFatura: number;
  valorPago: number;
  nomeEmpresa: string;
  /** Data de vencimento da fatura (ex.: ISO) para sugerir em "Data do pagamento" */
  dataVencimento?: string | null;
}

@Component({
  selector: 'app-recibo-pagamento-dialog',
  templateUrl: './recibo-pagamento-dialog.component.html',
  styleUrls: ['./recibo-pagamento-dialog.component.sass']
})
export class ReciboPagamentoDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ReciboPagamentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReciboPagamentoDialogData
  ) {
    const descricaoPadrao = `referente à fatura ${data.idFatura}`;
    const dataPagamentoInicial = ReciboPagamentoDialogComponent.dataSugestaoPorVencimento(data.dataVencimento);
    this.form = new FormGroup({
      dataPagamento: new FormControl(dataPagamentoInicial, [Validators.required]),
      descricao: new FormControl(descricaoPadrao, [Validators.required])
    });
  }

  /** Converte data de vencimento da fatura em Date local (evita deslocar um dia em YYYY-MM-DD). */
  private static dataSugestaoPorVencimento(dataVencimento?: string | null): Date {
    if (dataVencimento == null || String(dataVencimento).trim() === '') {
      return new Date();
    }
    const s = String(dataVencimento).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    const t = Date.parse(s);
    return Number.isNaN(t) ? new Date() : new Date(t);
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  async imprimir(): Promise<void> {
    if (!this.form.valid) return;

    const valorPago = this.data.valorPago;
    const descricao = this.form.get('descricao')?.value?.trim() || `referente à fatura ${this.data.idFatura}`;
    const nomeEmpresa = this.data.nomeEmpresa || 'Cliente';
    const valorExtenso = this.valorPorExtenso(valorPago);
    const dataPagamento = this.form.get('dataPagamento')?.value as Date;
    const dataEmissao = dataPagamento
      ? new Date(dataPagamento).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

    const blobToDataUrl = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    let logoBase64 = LOGO_ODONTOPRINT_BASE64;

    let assinaturaBase64 = '';
    try {
      const assinaturaUrl = `${envFront.BASE_URL}/assets/img/assinatura_carol.png`;
      const response = await fetch(assinaturaUrl);
      const blob = await response.blob();
      assinaturaBase64 = await blobToDataUrl(blob);
    } catch {
      // Fallback para linha de assinatura se a imagem não carregar
    }

    const linhaAssinaturaW = 200;
    const colunaLinhaERotulo = {
      columns: [
        { width: '*' as const, text: '' },
        {
          width: linhaAssinaturaW,
          stack: [
            {
              canvas: [
                {
                  type: 'line' as const,
                  x1: 0,
                  y1: 0,
                  x2: linhaAssinaturaW,
                  y2: 0,
                  lineWidth: 0.5
                }
              ],
              margin: [0, 0, 0, 3] as [number, number, number, number]
            },
            {
              text: 'Assinatura',
              fontSize: 9,
              alignment: 'center' as const
            }
          ]
        },
        { width: '*' as const, text: '' }
      ]
    };

    const blocoAssinatura = {
      stack: [
        ...(assinaturaBase64
          ? [
              {
                image: assinaturaBase64,
                width: 170,
                alignment: 'center' as const,
                margin: [0, 60, 0, 0] as [number, number, number, number]
              }
            ]
          : []),
        assinaturaBase64
          ? {
              ...colunaLinhaERotulo,
              margin: [0, 0, 0, 0] as [number, number, number, number]
            }
          : colunaLinhaERotulo
      ],
      unbreakable: true,
      margin: [0, assinaturaBase64 ? 6 : 10, 0, 0] as [number, number, number, number]
    };

    const content: TDocumentDefinitions['content'] = [
      ...(logoBase64
        ? [
            {
              image: logoBase64,
              width: 165,
              alignment: 'left' as const,
              margin: [0, 0, 0, 12] as [number, number, number, number]
            }
          ]
        : []),
      {
        text: 'RECIBO DE PAGAMENTO',
        style: 'header',
        alignment: 'center' as const,
        margin: [0, 0, 0, 24] as [number, number, number, number]
      },
      {
        text: `Data do pagamento: ${dataEmissao}`,
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      {
        text: [
          { text: 'Recebemos de ' },
          { text: nomeEmpresa, bold: true },
          { text: ` a quantia de ` },
          { text: this.formatarMoeda(valorPago), bold: true },
          { text: `, ${descricao}.` }
        ],
        margin: [0, 0, 0, 12] as [number, number, number, number],
        alignment: 'justify' as const
      },
      {
        text: `(${valorExtenso})`,
        italics: true,
        margin: [0, 0, 0, 8] as [number, number, number, number],
        alignment: 'justify' as const
      },
      blocoAssinatura
    ];

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A5',
      pageOrientation: 'landscape',
      pageMargins: [40, 36, 40, 44],
      content,
      styles: {
        header: {
          fontSize: 16,
          bold: true
        }
      }
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.open();
    this.dialogRef.close();
  }

  private valorPorExtenso(valor: number): string {
    const reais = Math.floor(valor);
    const centavos = Math.round((valor - reais) * 100);
    const reaisStr = this.numeroPorExtenso(reais);
    const centavosStr = this.numeroPorExtenso(centavos);
    const parteReais = reais === 1 ? '1 real' : `${reaisStr} reais`;
    const parteCentavos = centavos === 0 ? '' : centavos === 1 ? ' e 1 centavo' : ` e ${centavosStr} centavos`;
    return parteReais + parteCentavos;
  }

  private numeroPorExtenso(n: number): string {
    if (n === 0) return 'zero';
    const un = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dez = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const dezEspeciais = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const cen = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    if (n < 10) return un[n];
    if (n < 20) return dezEspeciais[n - 10];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? dez[d] : `${dez[d]} e ${un[u]}`;
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const rest = n % 100;
      const centena = c === 1 && rest === 0 ? 'cem' : cen[c];
      return rest === 0 ? centena : `${centena} e ${this.numeroPorExtenso(rest)}`;
    }
    if (n < 1_000_000) {
      const mil = Math.floor(n / 1000);
      const rest = n % 1000;
      const milStr = mil === 1 ? 'mil' : `${this.numeroPorExtenso(mil)} mil`;
      return rest === 0 ? milStr : `${milStr} e ${this.numeroPorExtenso(rest)}`;
    }
    return String(n);
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
