import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { alterarMarca, buscarMarca } from 'src/services/marca.service';

@Component({
  selector: 'app-marcas-edit',
  templateUrl: './marcas-edit.component.html',
  styleUrls: ['./marcas-edit.component.sass']
})
export class MarcasEditComponent {
  idMarca: number = 0;
  marca: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {

    const idMarca = this.activatedRoute.snapshot.paramMap.get("id")
    this.idMarca = idMarca && parseInt(idMarca) || 0;
    if (!this.idMarca) {
      return;
    }

    buscarMarca(this.idMarca).then((response: any) => {
      if (response.status === 200) {
        this.marca = response.data;
      }
    });

  }

  async onSave(marcaPayload: any) {
    try {
      const result = await alterarMarca(marcaPayload, this.idMarca);

      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/marca']);
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
