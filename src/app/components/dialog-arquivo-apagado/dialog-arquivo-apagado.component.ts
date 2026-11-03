import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-arquivo-apagado',
  templateUrl: './dialog-arquivo-apagado.component.html',
  styleUrls: ['./dialog-arquivo-apagado.component.sass']
})
export class DialogArquivoApagadoComponent {

  constructor(public dialogRef: MatDialogRef<DialogArquivoApagadoComponent>) {}
}
