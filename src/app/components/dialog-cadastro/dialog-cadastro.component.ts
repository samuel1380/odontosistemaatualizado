import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-cadastro',
  templateUrl: './dialog-cadastro.component.html',
  styleUrls: ['./dialog-cadastro.component.sass']
})
export class DialogCadastroComponent {

  constructor(public dialogRef: MatDialogRef<DialogCadastroComponent>) {}

}
