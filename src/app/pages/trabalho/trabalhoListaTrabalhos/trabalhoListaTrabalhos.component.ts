import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { buscarTrabalhos } from '../../../../services/trabalho.service';
import { TrabalhoElement } from '../trabalho/trabalho.component';

@Component({
  selector: 'app-trabalho-lista-trabalho',
  templateUrl: './trabalhoListaTrabalhos.component.html',
  styleUrl: './trabalhoListaTrabalhos.component.scss'
})
export class TrabalhoListaTrabalhosComponent implements OnInit {
  @Input() statusTrabalho: any;

  nomeLista = '';
  listaTrabalhos = new MatTableDataSource<TrabalhoElement>([]);
  displayedColumns: string[] = [ 'idTrabalho', 'nomeClinica', 'componentes', 'cor', 'nomePaciente', 'dataInclusao', 'status' ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    if(this.statusTrabalho) {
      this.nomeLista = this.statusTrabalho?.join(", ")
      buscarTrabalhos(this.statusTrabalho).then((response: any) => {
        this.listaTrabalhos.data = response.data;
      });
    }
  }

  abrirDetalhesTrabalho(trabalho: any) {
    this.router.navigate([`/l/paciente/edit/${trabalho.idPaciente}`]);
  }


  getComponentes(element: any) {
    const componentesTrabalho: any[] = element.componentes;
    if (element.status !== 'FRESAGEM' && element.status !== 'AGUARDANDO_COMPONENTE') {
      return '-';
    }
    if (!componentesTrabalho?.length) {
      return '-';
    }
    return componentesTrabalho
      .map((ct: any) => {
        const id = ct?.componente?.idComponente ?? ct?.idComponente;
        const nomeRaw = ct?.componente?.nome ?? ct?.nome;
        const idNum = id != null && id !== '' ? Number(id) : NaN;
        const idOk = !Number.isNaN(idNum) && idNum > 0;
        if (!idOk) {
          return 'Indefinido';
        }
        const nome = nomeRaw != null ? String(nomeRaw).trim() : '';
        if (!nome || nome.toLowerCase() === 'indefinido') {
          return 'Indefinido';
        }
        return nome;
      })
      .join(', ');
  }

  getCor(element: any) {
    const cor: any[] = element.cor;
    if (element.status == 'FRESAGEM' || element.status == 'AGUARDANDO_COMPONENTE' )
      return cor

    return '-'
  }
}
