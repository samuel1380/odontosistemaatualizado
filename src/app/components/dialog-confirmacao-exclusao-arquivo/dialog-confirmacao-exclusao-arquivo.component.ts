import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-confirmacao-exclusao-arquivo',
  templateUrl: './dialog-confirmacao-exclusao-arquivo.component.html',
  styleUrls: ['./dialog-confirmacao-exclusao-arquivo.component.sass']
})
export class DialogConfirmacaoExclusaoArquivoComponent {

  constructor(public dialogRef: MatDialogRef<DialogConfirmacaoExclusaoArquivoComponent>) {}

}
