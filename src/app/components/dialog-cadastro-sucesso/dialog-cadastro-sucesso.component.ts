import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-cadastro-sucesso',
  templateUrl: './dialog-cadastro-sucesso.component.html',
  styleUrls: ['./dialog-cadastro-sucesso.component.sass']
})
export class DialogCadastroSucessoComponent {

  constructor(public dialogRef: MatDialogRef<DialogCadastroSucessoComponent>) {}
}
