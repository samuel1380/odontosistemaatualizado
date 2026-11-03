import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarMarcas } from 'src/services/marca.service';

@Component({
  selector: 'app-marcas',
  templateUrl: './marcas.component.html',
  styleUrls: ['./marcas.component.sass']
})
export class MarcasComponent {
  listaMarcas = new MatTableDataSource<ComponenteElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" }
  ]

  constructor(private router: Router) {
    buscarMarcas().then((response: any) => {
      this.listaMarcas.data = response.data;
    })
  }

  abrirCadastro() {
    this.router.navigate([`/l/marca/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/marca/edit/${event.idMarcaComponente}`]);
  }
}

export interface ComponenteElement {
  nome: string;
}
