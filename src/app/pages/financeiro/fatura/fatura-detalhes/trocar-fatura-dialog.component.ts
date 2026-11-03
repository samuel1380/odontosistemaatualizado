import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface TrocarFaturaDialogData {
  idFaturaAtual: number;
  idOrdemServico: number;
  idEmpresa: number;
}

@Component({
  selector: 'app-trocar-fatura-dialog',
  templateUrl: './trocar-fatura-dialog.component.html',
  styleUrls: ['./trocar-fatura-dialog.component.sass']
})
export class TrocarFaturaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TrocarFaturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TrocarFaturaDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

