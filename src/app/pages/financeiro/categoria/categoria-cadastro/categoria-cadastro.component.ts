import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { cadastrarCategoria, buscarCategorias } from 'src/services/financeiro.categoria.service';

@Component({
  selector: 'app-categoria-cadastro',
  templateUrl: './categoria-cadastro.component.html',
  styleUrl: './categoria-cadastro.component.sass'
})
export class CategoriaCadastroComponent implements OnInit {

  @Input() categoria: any;
  @Output() onSave = new EventEmitter<any>();

  @Output() onDelete = new EventEmitter<any>();

  categoriaForm = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    tipo: new FormControl<'RECEITA' | 'DESPESA'>('RECEITA', [Validators.required]),
    classificacaoDre: new FormControl<
      'OPERACIONAL_RECEITA' | 'OPERACIONAL_DESPESA' | 'INVESTIMENTO' | 'APORTE' | 'SAIDA_FINANCIAMENTO' | null
    >('OPERACIONAL_RECEITA', [Validators.required]),
    classificacaoDespesa: new FormControl<'FIXA' | 'VARIAVEL' | null>(null),
    idCategoriaPai: new FormControl<number | null>(null),
    subcategorias: new FormArray<FormGroup<{ nome: FormControl<string | null> }>>([]),
  });

  get subcategorias(): FormArray {
    return this.categoriaForm.get('subcategorias') as FormArray;
  }

  adicionarSubcategoria(nome: string = '') {
    this.subcategorias.push(
      new FormGroup({ nome: new FormControl<string | null>(nome, [Validators.required]) })
    );
  }

  removerSubcategoria(index: number) {
    this.subcategorias.removeAt(index);
  }

  ehCategoriaPrincipal(): boolean {
    if (this.categoria) {
      return this.categoria.idCategoriaPai == null;
    }
    return this.categoriaForm.get('idCategoriaPai')?.value == null;
  }

  tiposCategoria = [
    { nome: 'Receita', id: 'RECEITA' },
    { nome: 'Despesa', id: 'DESPESA' },
  ];

  classificacoesDre = [
    { nome: 'Operacional (Receitas)', id: 'OPERACIONAL_RECEITA', tipo: 'RECEITA' },
    { nome: 'Operacional (Despesas)', id: 'OPERACIONAL_DESPESA', tipo: 'DESPESA' },
    { nome: 'Investimentos', id: 'INVESTIMENTO', tipo: 'DESPESA' },
    { nome: 'Aportes', id: 'APORTE', tipo: 'RECEITA' },
    { nome: 'Saídas de financiamento/juros/empréstimos', id: 'SAIDA_FINANCIAMENTO', tipo: 'DESPESA' },
  ] as const;

  classificacoesDespesa = [
    { nome: 'Fixa', id: 'FIXA' },
    { nome: 'Variável', id: 'VARIAVEL' },
  ];

  categoriasPai: any[] = [];

  constructor(
    public themeService: CustomizerSettingsService,
    public dialogRef: MatDialogRef<CategoriaCadastroComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.carregarCategoriasPai();
    if (this.categoria) {
      this.categoriaForm.patchValue({
        nome: this.categoria.nome,
        tipo: this.categoria.tipo,
        classificacaoDre: this.categoria.classificacaoDre ?? null,
        classificacaoDespesa: this.categoria.classificacaoDespesa ?? null,
        idCategoriaPai: this.categoria.idCategoriaPai ?? null,
      });
      if (!this.categoria.idCategoriaPai && this.categoria.subcategorias?.length) {
        this.subcategorias.clear();
        for (const sub of this.categoria.subcategorias) {
          this.adicionarSubcategoria(sub.nome);
        }
      }
    }

    // Ajusta a classificação default quando o tipo muda (evita combinações inválidas).
    this.categoriaForm.get('tipo')?.valueChanges.subscribe((tipo) => {
      const current = this.categoriaForm.get('classificacaoDre')?.value;
      if (tipo === 'RECEITA') {
        this.categoriaForm.get('classificacaoDespesa')?.setValue(null);
        if (current !== 'OPERACIONAL_RECEITA' && current !== 'APORTE') {
          this.categoriaForm.get('classificacaoDre')?.setValue('OPERACIONAL_RECEITA');
        }
      } else if (tipo === 'DESPESA') {
        if (
          current !== 'OPERACIONAL_DESPESA' &&
          current !== 'INVESTIMENTO' &&
          current !== 'SAIDA_FINANCIAMENTO'
        ) {
          this.categoriaForm.get('classificacaoDre')?.setValue('OPERACIONAL_DESPESA');
        }
      }
    });
  }

  async carregarCategoriasPai() {
    try {
      const res = await buscarCategorias();
      let list = (res as any)?.data ?? [];
      if (this.categoria?.idCategoria) {
        list = list.filter((c: any) => c.idCategoria !== this.categoria.idCategoria);
      }
      this.categoriasPai = list.filter((c: any) => !c.idCategoriaPai);
    } catch (_) {
      this.categoriasPai = [];
    }
  }

  excluir() {
    if (this.categoria) {
      this.onDelete.emit(this.categoria);
    }
  }

  async salvar() {
    const formValue = this.categoriaForm.getRawValue();
    const payload: any = {
      nome: formValue.nome,
      tipo: formValue.tipo,
      classificacaoDre: formValue.classificacaoDre,
      classificacaoDespesa: formValue.classificacaoDespesa,
    };
    if (formValue.idCategoriaPai != null) {
      payload.idCategoriaPai = formValue.idCategoriaPai;
    } else {
      const list = (formValue.subcategorias || [])
        .map((s: any) => s?.nome?.trim())
        .filter((n: string) => n);
      payload.subcategorias = list.map((nome: string) => ({ nome }));
    }

    let response;
    if (!this.categoria) {
      response = await cadastrarCategoria(payload);
    } else {
      this.onSave.emit(payload);
    }

    if (response?.status === 201) {
      this.dialogRef.close(true);
      this.dialog.open(DialogCadastroSucessoComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }
}
