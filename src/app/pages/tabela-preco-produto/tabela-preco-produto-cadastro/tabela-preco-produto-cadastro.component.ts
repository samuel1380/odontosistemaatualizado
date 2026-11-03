import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { cadastrarTabelaPrecoProduto } from 'src/services/tabelaPrecoProduto.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buscarProdutos } from 'src/services/produto.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-tabela-preco-produto-cadastro',
  templateUrl: './tabela-preco-produto-cadastro.component.html',
  styleUrls: ['./tabela-preco-produto-cadastro.component.sass']
})
export class TabelaPrecoProdutoCadastroComponent {

  nomeFormControl = new FormControl('', [Validators.required]);
  numeroVersaoFormControl = new FormControl<string | null>(null);
  dynamicFormProdutos: FormGroup;

  @Input() tabelaPrecoProduto: any;
  @Output() onSave = new EventEmitter<any>();

  produtosTabela = new Subject<any[]>();
  allprodutosTabela$ = this.produtosTabela.asObservable();
  produtosTabelaCompletos : any = [];

  constructor(
    public themeService: CustomizerSettingsService,
    private router: Router,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {

    this.dynamicFormProdutos = this.fb.group({
      items: this.fb.array([])
    });

    buscarProdutos().then((response: any) => {
      if (response.status === 200) {
        this.produtosTabela.next(response.data);
      }
    });
  }

  ngOnInit() {
    if(this.tabelaPrecoProduto) {
      this.nomeFormControl.setValue(this.tabelaPrecoProduto.nome);
      if (this.tabelaPrecoProduto.numeroVersao) {
        this.numeroVersaoFormControl.setValue(this.tabelaPrecoProduto.numeroVersao);
      }
      // Se for versão, tornar numeroVersao obrigatório
      if (this.tabelaPrecoProduto.idTabelaPrecoProdutoOrigem) {
        this.numeroVersaoFormControl.setValidators([Validators.required]);
      }
    }

    this.allprodutosTabela$.subscribe((produtos: any[]) => {
      const precoProdutoTabela = this.tabelaPrecoProduto && this.tabelaPrecoProduto.precoProduto || [];

      this.produtosTabelaCompletos = produtos.map(produto => {
        const precoProdutoExistenteList = precoProdutoTabela.filter((precoProduto: any) => precoProduto.idProduto === produto.idProduto);
        const precoProdutoExistente = precoProdutoExistenteList && precoProdutoExistenteList.length && precoProdutoExistenteList[0];

        if (!this.tabelaPrecoProduto || !precoProdutoExistente) {
          let groupPrecoProduto = {
            preco: [0.0, Validators.required],
            idProduto: [produto.idProduto, Validators.required],
            nome: [{ value: produto.nome, disabled: true }, Validators.required]
          } as any;

          if (this.tabelaPrecoProduto?.idTabelaPrecoProduto) {
            groupPrecoProduto.idTabelaPrecoProduto = [this.tabelaPrecoProduto?.idTabelaPrecoProduto, Validators.required]
          }

          return this.fb.group(groupPrecoProduto);
        }

        return this.fb.group({
          idPrecoProduto: [precoProdutoExistente.idPrecoProduto, Validators.required],
          preco: [precoProdutoExistente.preco, Validators.required],
          idProduto: [produto.idProduto, Validators.required],
          nome: [{ value: produto.nome, disabled: true }, Validators.required],
          idTabelaPrecoProduto: [precoProdutoExistente.idTabelaPrecoProduto, Validators.required],
        });

      });

      this.dynamicFormProdutos = this.fb.group({
        items: this.fb.array(this.produtosTabelaCompletos)
      });

    });
  }

  get items(): FormArray {
    return this.dynamicFormProdutos.get('items') as FormArray;
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

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    const precoProduto = this.dynamicFormProdutos.value;

    let cadastroTabelaPrecoProdutoPayload: any = {
      nome: this.nomeFormControl.value,
      precoProduto: precoProduto.items
    };

    if (this.tabelaPrecoProduto?.idTabelaPrecoProduto) {
      cadastroTabelaPrecoProdutoPayload.idTabelaPrecoProduto = this.tabelaPrecoProduto.idTabelaPrecoProduto;
    }

    if (this.tabelaPrecoProduto?.idTabelaPrecoProdutoOrigem) {
      cadastroTabelaPrecoProdutoPayload.idTabelaPrecoProdutoOrigem = this.tabelaPrecoProduto.idTabelaPrecoProdutoOrigem;
    }

    if (this.numeroVersaoFormControl.value) {
      cadastroTabelaPrecoProdutoPayload.numeroVersao = this.numeroVersaoFormControl.value;
    }

    try {

      let result;
      if(!this.tabelaPrecoProduto) {
        result = await cadastrarTabelaPrecoProduto(cadastroTabelaPrecoProdutoPayload);
      } else {
        this.onSave.emit(cadastroTabelaPrecoProdutoPayload);
      }

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/tabelaprecoproduto']);
        return;
      }

    }
    catch (e: any) {
      console.error('Erro ao salvar tabela de preço', e);
      const mensagemErro = e?.response?.data?.message 
        || e?.response?.data?.resposta?.message
        || e?.error?.message
        || e?.error?.resposta
        || e?.message
        || 'Erro ao salvar tabela de preço. Tente novamente.';
      
      this.snackBar.open(mensagemErro, 'Fechar', { 
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }

  }


  private validaCadastro(): boolean {
    const nomeComponente = this.nomeFormControl.value;

    if(!nomeComponente) {
      this.nomeFormControl.markAllAsTouched();
      return true;
    }

    // Se for versão, validar numeroVersao
    if (this.tabelaPrecoProduto?.idTabelaPrecoProdutoOrigem && !this.numeroVersaoFormControl.value) {
      this.numeroVersaoFormControl.markAllAsTouched();
      return true;
    }

    return false;
  }
}
