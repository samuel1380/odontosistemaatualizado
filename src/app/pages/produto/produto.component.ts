import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarProdutos } from 'src/services/produto.service';

@Component({
  selector: 'app-produto',
  templateUrl: './produto.component.html',
  styleUrls: ['./produto.component.sass']
})
export class ProdutoComponent {
  listaProdutos = new MatTableDataSource<ProdutoElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "preco", titulo: "Preço", price: 'BRL' },
  ]

  constructor(private router: Router) {
    buscarProdutos().then((response: any) => {
      this.listaProdutos.data = response.data;
    })
  }

  abrirCadastro() {
    this.router.navigate([`/l/produto/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/produto/edit/${event.idProduto}`]);
  }
}

export interface ProdutoElement {
  nome: string;
}
