import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarTrabalhos, buscarTrabalhosPendentes, trocaOrdemFila } from 'src/services/trabalho.service';

@Component({
  selector: 'app-trabalho',
  templateUrl: './trabalho.component.html',
  styleUrl: './trabalho.component.sass'
})
export class TrabalhoComponent {


  constructor(private router: Router) {}


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
