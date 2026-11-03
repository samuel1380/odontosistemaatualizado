import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarMotivos } from 'src/services/motivo.service';

@Component({
  selector: 'app-motivos',
  templateUrl: './motivos.component.html',
  styleUrls: ['./motivos.component.sass']
})
export class MotivosComponent {
  listaMotivos = new MatTableDataSource<any>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "tipo", titulo: "Tipo" },
  ];

  constructor(private router: Router) {
    buscarMotivos({ todas: true }).then((response: any) => {
      this.listaMotivos.data = response.data;
    });
  }

  abrirCadastro() {
    this.router.navigate([`/l/motivo/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/motivo/edit/${event.idMotivo}`]);
  }
}

