import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarTrabalhosConcluidos } from 'src/services/trabalho.service';

@Component({
  selector: 'app-trabalho-concluido',
  templateUrl: './trabalhoConcluido.component.html',
  styleUrl: './trabalhoConcluido.component.sass'
})
export class TrabalhoConcluidoComponent {
  listaTrabalhos = new MatTableDataSource<TrabalhoElement>([]);
  listaTrabalhosPendentes = new MatTableDataSource<TrabalhoElement>([]);
  displayedColumns: string[] = [ 'idTrabalho', 'nomeProfissional', 'nomePaciente', 'dataInclusao', 'status' ];

  constructor(private router: Router) {
    buscarTrabalhosConcluidos().then((response: any) => {
      this.listaTrabalhos.data = response.data;
    });
  }

  abrirDetalhesTrabalho(idTrabalho: number) {
    this.router.navigate([`/l/trabalho/edit/${idTrabalho}`]);
  }

  criarTrabalho() {
    this.router.navigate([`/l/trabalho/cadastro`]);
  }
}

export interface TrabalhoElement {
  position: string;
  idTrabalho: number;
  customer: string;
  dataInclusao: string;
  status: string;
}
