import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarAlmoxarifados } from 'src/services/almoxarifado.service';

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.sass'
})
export class EstoqueComponent {
  listaAlmoxarifados = new MatTableDataSource<AlmoxarifadoElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "descricao", titulo: "Descricao" },
  ]

  constructor(private router: Router) {
    buscarAlmoxarifados().then((response: any) => {
      this.listaAlmoxarifados.data = response.data;
    })
  }

  abrirCadastro() {
    this.router.navigate([`/l/almoxarifado/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/almoxarifado/edit/${event.idAlmoxarifado}`]);
  }
}

export interface AlmoxarifadoElement {
  nome: string;
  descricao: string;
}
