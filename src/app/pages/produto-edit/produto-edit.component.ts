import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { alterarProduto, buscarProduto } from 'src/services/produto.service';

@Component({
  selector: 'app-produto-edit',
  templateUrl: './produto-edit.component.html',
  styleUrls: ['./produto-edit.component.sass']
})
export class ProdutoEditComponent {
  idProduto: number = 0;
  produto: any = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {

    const idProduto = this.activatedRoute.snapshot.paramMap.get("id")
    this.idProduto = idProduto && parseInt(idProduto) || 0;
    if (!this.idProduto) {
      return;
    }

    buscarProduto(this.idProduto).then((response: any) => {
      if (response.status === 200) {
        this.produto = response.data;
      }
    });

  }

  async onSave(produtoPayload: any) {
    try {
      const result = await alterarProduto(produtoPayload, this.idProduto);

      if (result.status == 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/produto']);
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

}
