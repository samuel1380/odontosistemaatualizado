import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarTabelasMatriz } from 'src/services/tabelaPrecoProduto.service';
import { MatDialog } from '@angular/material/dialog';
import { SelecionarVersaoDialogComponent } from './selecionar-versao-dialog/selecionar-versao-dialog.component';
import { CriarVersaoDialogComponent } from './criar-versao-dialog/criar-versao-dialog.component';

@Component({
  selector: 'app-tabela-preco-produto',
  templateUrl: './tabela-preco-produto.component.html',
  styleUrls: ['./tabela-preco-produto.component.sass']
})
export class TabelaPrecoProdutoComponent {
  tabelasMatriz: any[] = [];
  tabelasComVersoes: any[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {
    this.carregarTabelas();
  }

  async carregarTabelas() {
    try {
      const response = await buscarTabelasMatriz();
      if (response.status === 200) {
        this.tabelasMatriz = response.data;

        // As versões já vêm carregadas na resposta do backend
        // Apenas organizar os dados
        this.tabelasMatriz.forEach((tabela: any) => {
          console.log('Tabela:', tabela.nome, 'Versões recebidas:', tabela.versoes);

          if (tabela.versoes && Array.isArray(tabela.versoes) && tabela.versoes.length > 0) {
            // Filtrar apenas versões ativas e ordenar por id (ordem de criação)
            tabela.versoes = tabela.versoes
              .filter((v: any) => v.ativo === 1 || v.ativo === true)
              .sort((a: any, b: any) => (a.idTabelaPrecoProduto || 0) - (b.idTabelaPrecoProduto || 0));
            tabela.totalVersoes = tabela.versoes.length;
            console.log('Versões processadas:', tabela.versoes.length);
          } else {
            tabela.versoes = [];
            tabela.totalVersoes = 0;
          }
        });

        this.tabelasComVersoes = this.tabelasMatriz;
        console.log('Tabelas finais:', this.tabelasComVersoes);
      }
    } catch (error) {
      console.error('Erro ao carregar tabelas', error);
    }
  }

  /** Vigência é definida na associação empresa-tabela; aqui apenas indicamos se está ativa. */
  calcularStatus(item: any): string {
    return (item.ativo === 1 || item.ativo === true) ? 'Ativa' : 'Inativa';
  }

  calcularStatusVersao(versao: any): string {
    return this.calcularStatus(versao);
  }

  abrirCadastro() {
    this.router.navigate([`/l/tabelaprecoproduto/cadastro`]);
  }

  async abrirDetalhesCadastro(tabela: any) {
    // Se tem apenas a matriz (sem versões), abrir edição direto
    if (!tabela.versoes || tabela.versoes.length === 0) {
      this.router.navigate([`/l/tabelaprecoproduto/edit/${tabela.idTabelaPrecoProduto}`]);
      return;
    }

    // Se tem versões, mostrar diálogo de seleção
    const dialogRef = this.dialog.open(SelecionarVersaoDialogComponent, {
      width: '50%',
      data: {
        tabelaMatriz: tabela,
        versoes: tabela.versoes
      }
    });

    dialogRef.afterClosed().subscribe((versaoSelecionada) => {
      if (versaoSelecionada) {
        this.router.navigate([`/l/tabelaprecoproduto/edit/${versaoSelecionada.idTabelaPrecoProduto}`]);
      }
    });
  }

  criarNovaVersao(event: Event, tabela: any) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(CriarVersaoDialogComponent, {
      width: '50%',
      data: {
        idTabelaOrigem: tabela.idTabelaPrecoProduto,
        nomeTabela: tabela.nome
      }
    });

    dialogRef.afterClosed().subscribe((novaVersao) => {
      if (novaVersao) {
        // Recarregar tabelas e redirecionar para edição
        this.carregarTabelas();
        this.router.navigate([`/l/tabelaprecoproduto/edit/${novaVersao.idTabelaPrecoProduto}`]);
      }
    });
  }

  abrirEdicaoVersao(versao: any) {
    this.router.navigate([`/l/tabelaprecoproduto/edit/${versao.idTabelaPrecoProduto}`]);
  }
}
