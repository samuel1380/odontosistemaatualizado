import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { atualizarCategoria, buscarCategoriasPorId, deletarCategoria } from 'src/services/financeiro.categoria.service';

@Component({
  selector: 'app-categoria-edit',
  templateUrl: './categoria-edit.component.html',
  styleUrl: './categoria-edit.component.sass'
})
export class CategoriaEditComponent {
  idCategoria: number = 0;
  categoria: any = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialogRef: MatDialogRef<CategoriaEditComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: string
  ) {
    const idMarca = data
    this.idCategoria = idMarca && parseInt(idMarca) || 0;
    if (!this.idCategoria) {
      return;
    }

    buscarCategoriasPorId(this.idCategoria).then((response: any) => {
      if (response.status === 200) {
        this.categoria = response.data;
      }
    });

  }

  async onSave(marcaPayload: any) {
    try {
      const result = await atualizarCategoria(marcaPayload, this.idCategoria);

      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
        return;
      }
    }
    catch (e) {
      this.dialog.open(DialogCadastroErroComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

  async onDelete(categoria: any) {
    const confirm = window.confirm('Atenção\n\nDeseja realmente excluir esta categoria?');

    if (confirm) {
      try {
        const result = await deletarCategoria(this.idCategoria);
        if (result.status === 204 || result.status === 200) {
          this.dialog.open(DialogCadastroSucessoComponent, {
            width: '50%',
            enterAnimationDuration: `100ms`,
            exitAnimationDuration: `100ms`,
          });
          this.dialogRef.close(true);
        }
      } catch (e: any) {
        window.alert(e?.response?.data?.message || 'Erro ao excluir a categoria.');
      }
    }
  }
}
