import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-desativar-empresa',
  templateUrl: './dialog-desativar-empresa.component.html',
  styleUrls: ['./dialog-desativar-empresa.component.sass']
})
export class DialogDesativarEmpresaComponent {

  constructor(public dialogRef: MatDialogRef<DialogDesativarEmpresaComponent>) {}
}
