import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { alterarMotivo, buscarMotivoPorId } from 'src/services/motivo.service';

@Component({
  selector: 'app-motivos-edit',
  templateUrl: './motivos-edit.component.html',
  styleUrls: ['./motivos-edit.component.sass']
})
export class MotivosEditComponent {
  idMotivo: number = 0;
  motivo: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {
    const idMotivo = this.activatedRoute.snapshot.paramMap.get("id");
    this.idMotivo = (idMotivo && parseInt(idMotivo)) || 0;
    if (!this.idMotivo) return;

    buscarMotivoPorId(this.idMotivo).then((response: any) => {
      if (response.status === 200) {
        this.motivo = response.data;
      }
    });
  }

  async onSave(payload: any) {
    try {
      const result = await alterarMotivo(payload, this.idMotivo);
      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/motivo']);
      }
    } catch (e) {
      this.dialog.open(DialogCadastroErroComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }
}

