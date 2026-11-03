import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { buscarDebitosPorAlmoxarifado, buscarEstoquePorAlmoxarifado, buscarHistoricoPorAlmoxarifado } from 'src/services/almoxarifado.service';

@Component({
  selector: 'app-almoxarifado-cadastro',
  templateUrl: './almoxarifado-cadastro.component.html',
  styleUrl: './almoxarifado-cadastro.component.sass'
})
export class AlmoxarifadoCadastroComponent {
  idAlmoxarifado: number = 0;
  listaEstoques = new MatTableDataSource<EstoqueElement>([]);
  displayedColumns = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "quantidade", titulo: "Quantidade" },
  ]

  listaDebitos = new MatTableDataSource<DebitosElement>([]);
  displayedColumnsDebitos = [
    { coluna: "nome", titulo: "Nome" },
    { coluna: "quantidade", titulo: "Quantidade" },
    { coluna: "dataTransferencia", titulo: "Data Emprestimo", datetime: true},
  ]

  listaHistorico = new MatTableDataSource<DebitosElement>([]);
  displayedColumnsHistorico = [
    { coluna: "motivo", titulo: "Motivo" },
    { coluna: "quantidade", titulo: "Quantidade" },
    { coluna: "dataConsumo", titulo: "Data Consumo", datetime: true},
  ]

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    const idAlmoxarifado = this.activatedRoute.snapshot.paramMap.get("id")
    this.idAlmoxarifado = idAlmoxarifado && parseInt(idAlmoxarifado) || 0;
    if (!this.idAlmoxarifado) {
      return;
    }

    buscarEstoquePorAlmoxarifado(idAlmoxarifado).then((response: any) => {
      this.listaEstoques.data = response.data;
    });

    buscarDebitosPorAlmoxarifado(idAlmoxarifado).then((response: any) => {
      const debitos = response.data.map((debito: any) => {
        return {
          nome: `Emprestimo de componente ${debito?.nome}`,
          quantidade: debito?.quantidade * -1,
          dataTransferencia: debito.dataTransferencia
        }
      });
      this.listaDebitos.data = debitos;
    });

    buscarHistoricoPorAlmoxarifado(idAlmoxarifado).then((response: any) => {
      const debitos = response.data.map((debito: any) => {
        return {
          motivo: debito.motivo,
          quantidade: debito.quantidadeConsumida,
          dataConsumo: debito.dataConsumo
        }
      });
      this.listaHistorico.data = debitos;
    });
  }

  inserirEstoque(idAlmoxarifado: any) {
    this.router.navigate([`/l/estoque/cadastro/${idAlmoxarifado}`]);
  }

}


export interface EstoqueElement {
  nome: string;
  quantidade: number;
}

export interface DebitosElement {
  nome: string;
  quantidade: number;
}
