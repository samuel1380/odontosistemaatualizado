import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarCor } from 'src/services/cor.service';

@Component({
  selector: 'app-cores',
  templateUrl: './cores.component.html',
  styleUrls: ['./cores.component.sass']
})
export class CoresComponent {
  listaCores = new MatTableDataSource<ComponenteElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" }
  ]

  constructor(private router: Router) {
    buscarCor().then((response: any) => {
      this.listaCores.data = response.data;
    })
  }

  abrirCadastro() {
    this.router.navigate([`/l/cor/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/cor/edit/${event.idCor}`]);
  }
}

export interface ComponenteElement {
  nome: string;
}
