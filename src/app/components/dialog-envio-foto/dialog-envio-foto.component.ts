import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-envio-foto',
  templateUrl: './dialog-envio-foto.component.html',
  styleUrls: ['./dialog-envio-foto.component.sass']
})
export class DialogEnvioFotoComponent {
  constructor(public dialogRef: MatDialogRef<DialogEnvioFotoComponent>) {}

}
