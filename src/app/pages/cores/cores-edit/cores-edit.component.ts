import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { alterarCor, buscarCorPorId } from 'src/services/cor.service';

@Component({
  selector: 'app-cores-edit',
  templateUrl: './cores-edit.component.html',
  styleUrls: ['./cores-edit.component.sass']
})
export class CoresEditComponent {
  idCor: number = 0;
  cor: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {

    const idCor = this.activatedRoute.snapshot.paramMap.get("id")
    this.idCor = idCor && parseInt(idCor) || 0;
    if (!this.idCor) {
      return;
    }

    buscarCorPorId(this.idCor).then((response: any) => {
      if (response.status === 200) {
        this.cor = response.data;
      }
    });

  }

  async onSave(corPayload: any) {
    try {
      const result = await alterarCor(corPayload, this.idCor);

      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/cor']);
        return;
      }
    }
    catch (e) {
      this.dialog.open(DialogCadastroErroComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

}
