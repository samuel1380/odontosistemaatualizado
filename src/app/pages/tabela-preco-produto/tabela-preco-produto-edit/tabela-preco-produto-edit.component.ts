import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { atualizarTabelaPrecoProduto, buscartabelaPrecoProdutoPorId } from 'src/services/tabelaPrecoProduto.service';
import { PdfMakeWrapper, Txt, Img, Table, Columns } from 'pdfmake-wrapper';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { envFront } from 'src/services/envfile';

(pdfMake as any).vfs = pdfFonts;

@Component({
  selector: 'app-tabela-preco-produto-edit',
  templateUrl: './tabela-preco-produto-edit.component.html',
  styleUrls: ['./tabela-preco-produto-edit.component.sass']
})
export class TabelaPrecoProdutoEditComponent {
  idTabelaPrecoProduto: number = 0;
  tabelaPrecoProduto: any = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {

    const idTabelaPrecoProduto = this.activatedRoute.snapshot.paramMap.get("id")
    this.idTabelaPrecoProduto = idTabelaPrecoProduto && parseInt(idTabelaPrecoProduto) || 0;
    if (!this.idTabelaPrecoProduto) {
      return;
    }

    buscartabelaPrecoProdutoPorId(this.idTabelaPrecoProduto).then((response: any) => {
      if (response.status === 200) {
        this.tabelaPrecoProduto = response.data;
      }
    });

  }

  async onSave(tabelaPrecoProdutoPayload: any) {
    try {
      const result = await atualizarTabelaPrecoProduto(tabelaPrecoProdutoPayload, this.idTabelaPrecoProduto);

      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/tabelaprecoproduto']);
        return;
      }
    }
    catch (e: any) {
      console.error('Erro ao atualizar tabela de preço', e);
      const mensagemErro = e?.response?.data?.message
        || e?.response?.data?.resposta?.message
        || e?.error?.message
        || e?.error?.resposta
        || e?.message
        || 'Erro ao atualizar tabela de preço. Tente novamente.';

      this.snackBar.open(mensagemErro, 'Fechar', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  async imprimirTabelaPreco() {
    if (!this.tabelaPrecoProduto) {
      this.snackBar.open('Carregando dados da tabela...', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }

    try {
      const pdf = new PdfMakeWrapper();

      // Tentar adicionar logo (se disponível)
      try {
        pdf.images({
          logo: await new Img(`${envFront.BASE_URL}/assets/img/odontoprint.png`).build(),
        });
      } catch (logoError) {
        console.warn('Logo não encontrada, continuando sem logo', logoError);
      }

      pdf.pageMargins([20, 20, 20, 20]);

      // Logo no canto superior esquerdo (se disponível)
      try {
        pdf.add(
          await new Img('logo', true)
            .width(200)
            .alignment('center')
            .margin([0, 0, 0, 10])
            .build()
        );
      } catch (logoError) {
        // Se logo não carregar, continua sem ela
      }

      // Título centralizado
      pdf.add(
        new Txt('Tabela de Preço')
          .fontSize(20)
          .bold()
          .alignment('center')
          .margin([0, 0, 0, 10])
          .end
      );

      // Versão se houver
      if (this.tabelaPrecoProduto.numeroVersao) {
        pdf.add(new Txt(`Versão: ${this.tabelaPrecoProduto.numeroVersao}`).fontSize(12).alignment('center').margin([0, 5, 0, 20]).end);
      }

      // Preparar dados da tabela de produtos
      if (this.tabelaPrecoProduto.precoProduto && this.tabelaPrecoProduto.precoProduto.length > 0) {
        // Ordenar produtos por nome
        const produtosOrdenados = [...this.tabelaPrecoProduto.precoProduto].sort((a: any, b: any) => {
          const nomeA = a.produto?.nome || '';
          const nomeB = b.produto?.nome || '';
          return nomeA.localeCompare(nomeB, 'pt-BR');
        });

        // Cabeçalho da tabela
        const tableData: any[] = [
          [
            { text: 'Produto', style: 'tableHeader', fillColor: '#4a90e2', color: '#ffffff' },
            { text: 'Preço', style: 'tableHeader', fillColor: '#4a90e2', color: '#ffffff', alignment: 'right' }
          ]
        ];

        // Adicionar produtos com linhas alternadas
        produtosOrdenados.forEach((precoProduto: any, index: number) => {
          const nomeProduto = precoProduto.produto?.nome || 'Produto sem nome';
          const preco = precoProduto.preco ? parseFloat(precoProduto.preco).toString() : '0,00';

          // Linhas alternadas: índice par = branco, índice ímpar = cinza claro
          const fillColor = index % 2 === 0 ? '#ffffff' : '#f5f5f5';

          tableData.push([
            { text: String(nomeProduto), fillColor: fillColor },
            { text: `R$ ${preco.replace('.', ',')}`, fillColor: fillColor, alignment: 'right' as const }
          ]);
        });

        pdf.add(
          new Table(tableData)
            .widths(['*', 120])
            .layout({
              hLineWidth: (i?: number, node?: any) => {
                if (i === undefined || node === undefined) return 0.5;
                if (i === 0 || i === node.table.body.length) {
                  return 0.5;
                }
                return 0.3;
              },
              vLineWidth: (i?: number, node?: any) => {
                if (i === undefined || node === undefined) return 0.5;
                if (i === 0 || i === node.table.widths.length) {
                  return 0.5;
                }
                return 0.5; // Linha vertical entre as colunas
              },
              hLineColor: () => '#cccccc',
              vLineColor: () => '#cccccc',
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 5,
              paddingBottom: () => 5,
            })
            .end
        );
      } else {
        pdf.add(new Txt('Nenhum produto cadastrado nesta tabela.').fontSize(11).alignment('center').margin([0, 20, 0, 0]).end);
      }

      // Footer com número de página
      pdf.footer((currentPage: number, pageCount: number) => {
        return new Txt(`Página ${currentPage} de ${pageCount}`).fontSize(9).alignment('center').margin([0, 10, 0, 0]).end;
      });

      // Gerar e abrir PDF
      pdf.create().open();
    } catch (error) {
      console.error('Erro ao gerar PDF', error);
      this.snackBar.open('Erro ao gerar PDF. Tente novamente.', 'Fechar', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

}
