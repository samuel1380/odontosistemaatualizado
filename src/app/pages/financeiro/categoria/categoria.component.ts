import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { CategoriaCadastroComponent } from './categoria-cadastro/categoria-cadastro.component';
import { CategoriaEditComponent } from './categoria-edit/categoria-edit.component';

@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.sass'
})
export class CategoriaComponent {
  listaCategorias = new MatTableDataSource<ContaElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "tipo", titulo: "Tipo" },
    { coluna: "classificacaoDespesa", titulo: "Classificação Despesa" }
  ]

  constructor(private router: Router, private dialog: MatDialog) {
    this.buscarCategorias();
  }

  abrirCadastro() {
    this.dialog.open(CategoriaCadastroComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe(() => {
      this.buscarCategorias();
    });
  }

  async buscarCategorias() {
    buscarCategorias().then((response: any) => {
      this.listaCategorias.data = response.data || [];
    })
  }

  abrirDetalhesCadastro(event: any) {
    this.dialog.open(CategoriaEditComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: event.idCategoria
    }).afterClosed().subscribe(() => {
      this.buscarCategorias();
    });
  }
}

export interface ContaElement {
  idConta?: number;
  nome: string;
  tipo: string;
  saldoInicial: string;
}
