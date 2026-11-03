import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-salvo',
  templateUrl: './dialog-salvo.component.html',
  styleUrls: ['./dialog-salvo.component.sass']
})
export class DialogSalvoComponent {

  constructor(public dialogRef: MatDialogRef<DialogSalvoComponent>) {}
}
