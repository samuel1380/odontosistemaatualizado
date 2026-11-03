import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { buscarEmpresas } from '../../../services/empresa.service';

@Component({
  selector: 'app-aprovacao-cadastro',
  templateUrl: './aprovacao-cadastro.component.html',
  styleUrls: ['./aprovacao-cadastro.component.sass']
})
export class AprovacaoCadastroComponent {
  listaParceiros: any[] = [];

  constructor(private router: Router) {
    buscarEmpresas().then((response: any) => {
      this.listaParceiros = response.data;
    })
  }

  abrirDetalhesCadastro(idEmpresa: number) {
    this.router.navigate([`/l/empresa/edit/${idEmpresa}`]);
  }

  abrirCadastro() {
    this.router.navigate([`/l/empresa/cadastro`]);
  }
}
