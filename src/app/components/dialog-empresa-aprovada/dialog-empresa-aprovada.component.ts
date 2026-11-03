import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroComponent } from '../dialog-cadastro/dialog-cadastro.component';

@Component({
  selector: 'app-dialog-empresa-aprovada',
  templateUrl: './dialog-empresa-aprovada.component.html',
  styleUrls: ['./dialog-empresa-aprovada.component.sass']
})
export class DialogEmpresaAprovadaComponent {

  constructor(public dialogRef: MatDialogRef<DialogEmpresaAprovadaComponent>) {}

}
