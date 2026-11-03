import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Fatura } from 'src/services/financeiro.fatura.service';

export interface DividirFaturaDialogData {
  fatura: Fatura;
}

@Component({
  selector: 'app-dividir-fatura-dialog',
  templateUrl: './dividir-fatura-dialog.component.html',
  styleUrls: ['./dividir-fatura-dialog.component.sass']
})
export class DividirFaturaDialogComponent {
  descricao: string = '';
  trabalhosSelecionados: { [idOrdemServico: number]: boolean } = {};

  constructor(
    public dialogRef: MatDialogRef<DividirFaturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DividirFaturaDialogData
  ) {
    // Inicializa o mapa de seleção com falso para todas as OSs
    if (this.data.fatura?.ordensDeServico) {
      this.data.fatura.ordensDeServico.forEach(os => {
        this.trabalhosSelecionados[os.idOrdemServico] = false;
      });
    }
  }

  get totalOrdensCount(): number {
    return this.data.fatura?.ordensDeServico?.length || 0;
  }

  get selectedCount(): number {
    return Object.values(this.trabalhosSelecionados).filter(val => val).length;
  }

  isValid(): boolean {
    const descricaoValida = this.descricao.trim().length > 0;
    const selecaoValida = this.selectedCount > 0 && this.selectedCount < this.totalOrdensCount;
    return descricaoValida && selecaoValida;
  }

  onConfirm(): void {
    if (!this.isValid()) return;
    
    const selectedIds = Object.keys(this.trabalhosSelecionados)
      .map(Number)
      .filter(id => this.trabalhosSelecionados[id]);

    this.dialogRef.close({
      descricao: this.descricao.trim(),
      idsOrdemServico: selectedIds
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
