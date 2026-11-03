import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CriarVersaoDialogComponent } from '../criar-versao-dialog/criar-versao-dialog.component';

@Component({
  selector: 'app-selecionar-versao-dialog',
  templateUrl: './selecionar-versao-dialog.component.html',
  styleUrls: ['./selecionar-versao-dialog.component.sass']
})
export class SelecionarVersaoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SelecionarVersaoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      tabelaMatriz: any; 
      versoes: any[] 
    },
    private router: Router,
    private dialog: MatDialog
  ) {}

  selecionarVersao(versao: any) {
    this.dialogRef.close(versao);
  }

  selecionarMatriz() {
    this.dialogRef.close(this.data.tabelaMatriz);
  }

  criarNovaVersao() {
    const dialogRef = this.dialog.open(CriarVersaoDialogComponent, {
      width: '50%',
      data: {
        idTabelaOrigem: this.data.tabelaMatriz.idTabelaPrecoProduto,
        nomeTabela: this.data.tabelaMatriz.nome
      }
    });

    dialogRef.afterClosed().subscribe((novaVersao) => {
      if (novaVersao) {
        // Redirecionar para edição da nova versão
        this.router.navigate([`/l/tabelaprecoproduto/edit/${novaVersao.idTabelaPrecoProduto}`]);
        this.dialogRef.close();
      }
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
