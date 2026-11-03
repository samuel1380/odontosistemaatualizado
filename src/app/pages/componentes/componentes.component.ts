import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarComponentes } from 'src/services/componente.service';

@Component({
  selector: 'app-componentes',
  templateUrl: './componentes.component.html',
  styleUrls: ['./componentes.component.sass']
})
export class ComponentesComponent {
  listaComponentes = new MatTableDataSource<ComponenteElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "marcaNome", titulo: "Marca" },
    { coluna: "preco", titulo: "Preço", price: 'BRL' }
  ]

  constructor(private router: Router) {
    buscarComponentes().then((response: any) => {
      response.data.forEach((componente: any) => {
        componente.marcaNome = componente.marca.nome;
      });

      this.listaComponentes.data = response.data;
    })
  }

  abrirCadastro() {
    this.router.navigate([`/l/componente/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/componente/edit/${event.idComponente}`]);
  }
}

export interface ComponenteElement {
  nome: string;
}
