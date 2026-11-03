import { Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { map, Observable, startWith, Subject } from 'rxjs';
import { buscarComponentes } from 'src/services/componente.service';
import { MyErrorStateMatcher } from '../../cadastro-complementar-empresa/cadastro-complementar-empresa.component';
import { ActivatedRoute, Router } from '@angular/router';
import { cadastrarEstoque } from 'src/services/almoxarifado.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buscarEmpresas } from 'src/services/empresa.service';

@Component({
  selector: 'app-estoque-cadastro',
  templateUrl: './estoque-cadastro.component.html',
  styleUrl: './estoque-cadastro.component.sass'
})
export class EstoqueCadastroComponent {
  idAlmoxarifado: number = 0;
  isLoadding = true;

  quantidadeFormControl = new FormControl('', [Validators.required]);
  quantidadeParafusosFormControl = new FormControl('', [Validators.required]);
  descricaoFormControl = new FormControl('', [Validators.required]);
  componenteSelecionado: any = null;
  formControlComponentes = new FormControl<string>({value: '', disabled: false} );

  listComponentes: any[] = [];
  filteredComponentes = new Observable<any[]>();
  options: any[] = [];

  hasParafuso: boolean = false;

  matcher = new MyErrorStateMatcher();

  private _snackBar = inject(MatSnackBar);


  constructor(private activatedRoute: ActivatedRoute, private router: Router) {

    const idAlmoxarifado = this.activatedRoute.snapshot.paramMap.get("id")
    this.idAlmoxarifado = idAlmoxarifado && parseInt(idAlmoxarifado) || 0;
    if (!this.idAlmoxarifado) {
      return;
    }
    buscarComponentes().then((response: any) => {
      if (response.status === 200) {
        this.options = response.data;

        this.filteredComponentes = this.formControlComponentes.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value || '')),
    );
      }
    });
  }

  async ngOnInit() {
    this.isLoadding = false;
  }


  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option?.nome.toLowerCase().includes(filterValue));
  }


  async onSubmitButton(event: any) {
    const quantidade = this.quantidadeFormControl?.value;
    const quantidadeParafusos = this.quantidadeParafusosFormControl?.value;
    const descricao = this.descricaoFormControl?.value;
    const componente = this.componenteSelecionado;

    if(!quantidade || !descricao || !componente || (this.hasParafuso && !quantidadeParafusos)) {
      this.quantidadeParafusosFormControl.markAllAsTouched();
      this.quantidadeFormControl.markAllAsTouched();
      this.descricaoFormControl.markAllAsTouched();
      this.formControlComponentes.markAllAsTouched();
      return;
    }

    const estoque = {
      "nome": componente.nome,
      "descricao": descricao,
      "quantidade": quantidade,
      "idComponente": componente.idComponente,
      "idAlmoxarifado": this.idAlmoxarifado,
      "quantidadeParafusos": quantidadeParafusos || 0
    }

    try {
      const responseEstoque = await cadastrarEstoque(estoque);
      if (responseEstoque.status === 201) {
          this._snackBar.open('Salvo com sucesso', 'fechar', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.router.navigate([`/l/almoxarifado/edit/${this.idAlmoxarifado}`]);
        }
    } catch (error) {
      console.log(error);
       this._snackBar.open('Erro ao salvar estoque', 'fechar', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }


  async selected(event: any) {
    this.componenteSelecionado = this.getItem(event.option.viewValue)[0];
    this.hasParafuso = this.componenteSelecionado.hasParafuso;
  }

  onUpdateListComponentes(list: any[]) {
    this.listComponentes = list;
  }

  cancelarCadastro() {
    this.router.navigate([`/l/almoxarifado/edit/${this.idAlmoxarifado}`]);
  }

  private getItem(value: string): any {
    return this.options.filter(item => item.nome == value);
  }
}
