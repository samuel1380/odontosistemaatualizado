import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarContas } from 'src/services/financeiro.conta.service';

@Component({
  selector: 'app-contas',
  templateUrl: './contas.component.html',
  styleUrl: './contas.component.sass'
})
export class ContasComponent {
  listaContas = new MatTableDataSource<ContaElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "tipo", titulo: "Tipo Conta" },
    { coluna: "saldoInicial", titulo: "Saldo Inicial" },
  ]

  constructor(private router: Router) {
    buscarContas().then((response: any) => {
      this.listaContas.data = response.data;
    })
  }

  abrirCadastro() {
    this.router.navigate([`/l/contas/cadastro`]);
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/contas/edit/${event.idConta}`]);
  }
}

export interface ContaElement {
  idConta?: number;
  nome: string;
  tipo: string;
  saldoInicial: string;
  saldoAtual: string;
}
