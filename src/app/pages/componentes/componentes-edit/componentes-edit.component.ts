import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { alterarComponente, buscarComponentePorId } from 'src/services/componente.service';

@Component({
  selector: 'app-componentes-edit',
  templateUrl: './componentes-edit.component.html',
  styleUrls: ['./componentes-edit.component.sass']
})
export class ComponentesEditComponent {
  idComponente: number = 0;
  componente: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {

    const idMarca = this.activatedRoute.snapshot.paramMap.get("id")
    this.idComponente = idMarca && parseInt(idMarca) || 0;
    if (!this.idComponente) {
      return;
    }

    buscarComponentePorId(this.idComponente).then((response: any) => {
      if (response.status === 200) {
        this.componente = response.data;
      }
    });

  }

  async onSave(marcaPayload: any) {
    try {
      const result = await alterarComponente(marcaPayload, this.idComponente);

      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/componente']);
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
