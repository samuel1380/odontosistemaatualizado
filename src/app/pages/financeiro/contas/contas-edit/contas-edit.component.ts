import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { buscarContasPorId } from 'src/services/financeiro.conta.service';

@Component({
  selector: 'app-contas-edit',
  templateUrl: './contas-edit.component.html',
  styleUrl: './contas-edit.component.sass'
})
export class ContasEditComponent {
  idConta: number = 0;
  conta: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {

    const idConta = this.activatedRoute.snapshot.paramMap.get("id")
    this.idConta = idConta && parseInt(idConta) || 0;
    if (!this.idConta) {
      return;
    }

    buscarContasPorId(this.idConta).then((response: any) => {
      if (response.status === 200) {
        this.conta = response.data;
      }
    });

  }

  async onSave(marcaPayload: any) {
      // try {
        // const result = await alterarComponente(marcaPayload, this.idComponente);

      //   if (result.status == 200) {
      //     this.dialog.open(DialogCadastroSucessoComponent, {
      //       width: '50%',
      //       enterAnimationDuration: `100ms`,
      //       exitAnimationDuration: `100ms`,
      //     });
      //     this.router.navigate(['/l/componente']);
      //     return;
      //   }
      // }
      // catch (e) {
      //   this.dialog.open(DialogCadastroErroComponent, {
      //     width: '50%',
      //     enterAnimationDuration: `100ms`,
      //     exitAnimationDuration: `100ms`,
      //   });
      // }
    }
}
