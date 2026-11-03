import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface AplicarDescontoDialogData {
  idFatura: number;
  descontoAtual?: number;
  valorTotalFatura?: number;
}

@Component({
  selector: 'app-aplicar-desconto-dialog',
  templateUrl: './aplicar-desconto-dialog.component.html',
  styleUrls: ['./aplicar-desconto-dialog.component.sass']
})
export class AplicarDescontoDialogComponent {
  descontoForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AplicarDescontoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AplicarDescontoDialogData
  ) {
    this.descontoForm = new FormGroup({
      desconto: new FormControl(data.descontoAtual || 0, [
        Validators.required,
        Validators.min(0)
      ])
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (this.descontoForm.valid) {
      const desconto = this.descontoForm.get('desconto')?.value;
      this.dialogRef.close(desconto);
    }
  }

  get descontoControl() {
    return this.descontoForm.get('desconto');
  }
}

