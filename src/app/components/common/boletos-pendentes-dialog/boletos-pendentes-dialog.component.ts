import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BoletoAtrasado, listarBoletosAtrasados } from 'src/services/boleto-atrasado.service';

@Component({
  selector: 'app-boletos-pendentes-dialog',
  templateUrl: './boletos-pendentes-dialog.component.html',
  styleUrls: ['./boletos-pendentes-dialog.component.sass']
})
export class BoletosPendentesDialogComponent implements OnInit {
  boletos: BoletoAtrasado[] = [];
  carregando = true;
  displayedColumns = ['descricao', 'dataVencimento', 'diasAtraso', 'valor'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idEmpresa: number, nomeEmpresa: string },
    public dialogRef: MatDialogRef<BoletosPendentesDialogComponent>
  ) {}

  async ngOnInit() {
    try {
      const response = await listarBoletosAtrasados(this.data.idEmpresa);
      this.boletos = response.data || [];
    } catch (error) {
      console.error('Erro ao buscar boletos atrasados', error);
    } finally {
      this.carregando = false;
    }
  }

  fechar() {
    this.dialogRef.close();
  }
}
