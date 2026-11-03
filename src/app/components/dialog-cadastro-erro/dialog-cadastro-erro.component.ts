import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-cadastro-erro',
  templateUrl: './dialog-cadastro-erro.component.html',
  styleUrls: ['./dialog-cadastro-erro.component.sass']
})
export class DialogCadastroErroComponent {

  constructor(public dialogRef: MatDialogRef<DialogCadastroErroComponent>) {}
}
