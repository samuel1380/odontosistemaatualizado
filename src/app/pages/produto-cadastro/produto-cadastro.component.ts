import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { buscarCategorias } from '../../../services/categoriaproduto.service';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { cadastrarProduto } from 'src/services/produto.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { CustomizerSettingsService } from '../externalComponents/customizer-settings/customizer-settings.service';
import { buscarMarcas } from 'src/services/marca.service';


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-produto-cadastro',
  templateUrl: './produto-cadastro.component.html',
  styleUrls: ['./produto-cadastro.component.sass']
})
export class ProdutoCadastroComponent implements OnInit {
  nomeProdutoControl = new FormControl('', [Validators.required]);
  prazoEntregaDiasControl = new FormControl('', [Validators.required]);
  precoCustoControl = new FormControl('', [Validators.required]);
  precoControl = new FormControl('', [Validators.required]);
  categoriaProdutoFormControl = new FormControl('', [Validators.required]);

  categoriaList: any = [];
  marcaList: any = [];
  marcasProduto: any = [];

  matcher = new MyErrorStateMatcher();

  ativo: boolean = false;

  @Input() produto: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(private router: Router, private dialog: MatDialog, public themeService: CustomizerSettingsService) {
    buscarCategorias().then((response: any) => {
      if (response.status === 200) {
        this.categoriaList = response.data;
      }
    });

    buscarMarcas().then((response: any) => {
      if (response.status === 200) {
        this.marcaList = response.data;
      }
    });
  }

  ngOnInit() {
    if(this.produto) {
      this.nomeProdutoControl.setValue(this.produto.nome);
      this.prazoEntregaDiasControl.setValue(this.produto.prazoEntregaDias);
      this.precoCustoControl.setValue(this.produto.precoCusto);
      this.precoControl.setValue(this.produto.preco);
      this.categoriaProdutoFormControl.setValue(this.produto.idCategoriaProduto);
    }
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    const preco = this.precoControl?.value || "0"

    let produtoPayload = {
      idProduto: this.produto?.idProduto,
      nome: this.nomeProdutoControl.value,
      prazoEntregaDias: 5,
      precoCusto: 0.0,
      // precoCusto: this.precoCustoControl.value,
      preco: parseFloat(preco),
      idCategoriaProduto: this.categoriaProdutoFormControl.value,
      ativo: true,
      customProduto: this.marcasProduto
    };

    try {
      let result;
      if(!this.produto) {
        result = await cadastrarProduto(produtoPayload);
      } else {
        this.onSave.emit(produtoPayload);
      }

      if (result?.status == 201) {
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


  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleCardBorderTheme() {
      this.themeService.toggleCardBorderTheme();
  }

  toggleCardBorderRadiusTheme() {
      this.themeService.toggleCardBorderRadiusTheme();
  }

  toggleRTLEnabledTheme() {
      this.themeService.toggleRTLEnabledTheme();
  }


  private validaCadastro(): boolean {
    const nome = this.nomeProdutoControl.value;
    const prazoEntregaDias = this.prazoEntregaDiasControl.value;
    const precoCusto = this.precoCustoControl.value;
    const preco = this.precoControl.value;
    const tipoProduto = this.categoriaProdutoFormControl.value;

    if (!nome || !preco || !tipoProduto ) {

      this.nomeProdutoControl.markAllAsTouched();
      this.prazoEntregaDiasControl.markAllAsTouched();
      this.precoCustoControl.markAllAsTouched();
      this.precoControl.markAllAsTouched();
      this.categoriaProdutoFormControl.markAllAsTouched();

      return true;
    }

    return false;
  }

  hasActiveMarca(idMarca: number) {
    return this.produto.customProduto.some((custom: any) => {
      return parseInt(custom.customValue) == idMarca;
    });
  }

  async setMarcas(checked: boolean, idMarca: number) {
    if (checked) {
      this.marcasProduto.push({ customName: "marcasProdutos", customValue: idMarca, idProduto: this.produto?.idProduto });
    } else {
      const index = this.marcasProduto.map((marca: any) => marca.customValue).indexOf(idMarca);
      this.marcasProduto.splice(index, 1);
    }
  }
}
// Entender por que nào está salvando marcas custom
