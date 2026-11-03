import { Component, OnChanges } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { buscarCadastroComplementar, buscarInfosCadastroComplementar, cadastrarCadastroComplementar } from '../../../services/empresa.service';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { AuthUserService } from 'src/app/serviceStorage/authUser.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}


@Component({
  selector: 'app-cadastro-complementar-empresa',
  templateUrl: './cadastro-complementar-empresa.component.html',
  styleUrls: ['./cadastro-complementar-empresa.component.sass']
})
export class CadastroComplementarEmpresaComponent implements OnChanges {
  idEmpresa: string | null = '';

  cadastroComplementarEmpresa: any = null;

  produtosList: any[] = [];
  componentesList: any[] = [];
  coresList: any[] = [];
  tabelaPrecoProdutoList: any[] = [];

  produtosEmpresa: any = [];
  componenteEmpresa: any = [];
  dentistaEmpresa: any[] = [{ nome: "", email: "" }];

  matcher = new MyErrorStateMatcher();

  descontoFormControl = new FormControl({ value: '', disabled: false }, []);
  tabelaDePrecoProdutoFormControl = new FormControl({ value: '', disabled: false }, []);
  interfacesTBaseFormControl: boolean = false;
  scannerProprioFormControl: boolean = false;
  coresControl = new FormControl();

  constructor(private router: Router, private dialog: MatDialog, private activatedRoute: ActivatedRoute) {

    const idEmpresaString = this.activatedRoute.snapshot.paramMap.get("id")
    this.idEmpresa = idEmpresaString || '';
    if (!this.idEmpresa) {
      return;
    }

    buscarCadastroComplementar(this.idEmpresa).then((response: any) => {
      if (response.status === 200) {
        this.cadastroComplementarEmpresa = response.data;
        this.produtosEmpresa = Array.apply([], this.cadastroComplementarEmpresa?.produtosEmpresa);
        this.componenteEmpresa = Array.apply([], this.cadastroComplementarEmpresa?.componenteEmpresa);
        this.coresControl.setValue(this.cadastroComplementarEmpresa?.corEmpresa[0]?.idCor);
        this.dentistaEmpresa = Array.apply([], this.cadastroComplementarEmpresa?.dentistaEmpresa);
        this.descontoFormControl.setValue(this.cadastroComplementarEmpresa?.porcentagemDesconto);
        this.tabelaDePrecoProdutoFormControl.setValue(this.cadastroComplementarEmpresa?.tabelaPrecoProduto?.idTabelaPrecoProduto);
        this.coresControl.setValue(this.cadastroComplementarEmpresa?.corEmpresa[0]?.idCor);
      }
    });

    buscarInfosCadastroComplementar().then((response: any) => {
      if (!response || !response.data) {
        return;
      }

      this.produtosList = response.data.produtos;
      this.componentesList = response.data.componentes;
      this.coresList = response.data.cores;
      this.tabelaPrecoProdutoList = response.data.tabelaPrecoProduto;

    });
  }

  ngOnChanges() {
    if (!this.idEmpresa) {
      return;
    }
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const componenteEmpresaExistente = this.cadastroComplementarEmpresa?.componenteEmpresa || [];
    const produtosEmpresaExistente = this.cadastroComplementarEmpresa?.produtosEmpresa || [];
    const coresEmpresaExistente = this.cadastroComplementarEmpresa?.corEmpresa || [];

    const produtos = this.produtosEmpresa.map((produtoAtual: { idProduto: number }) => {
      const produtoExistente = produtosEmpresaExistente.find((produto: { idProduto: number }) => produtoAtual.idProduto == produto.idProduto);

      return {
        idProdutoEmpresa: produtoExistente && produtoExistente.idProdutoEmpresa,
        idProduto: produtoAtual.idProduto
      }
    });

    const componentes = this.componenteEmpresa.map((componenteAtual: { idComponente: number }) => {
      const componenteExistente = componenteEmpresaExistente.find((produto: { idComponente: number }) => componenteAtual.idComponente == produto.idComponente);

      return {
        idComponenteEmpresa: componenteExistente && componenteExistente.idComponenteEmpresa,
        idComponente: componenteAtual.idComponente
      }
    });

    const cor = this.coresControl.getRawValue();

    const dentistas = this.dentistaEmpresa.map((dentista) => {
      return { ...dentista, idEmpresa: this.idEmpresa }
    });

    const dadosComplementaresDto = {
      idCadastroComplementarEmpresa: this.idEmpresa,
      porcentagemDesconto: this.descontoFormControl.value,
      utilizaInterfaces: this.interfacesTBaseFormControl,
      scannerProprio: this.scannerProprioFormControl,
      produtos,
      componentes,
      cores: [{ idCor: cor }],
      dentistas,
      idTabelaPrecoProduto: this.tabelaDePrecoProdutoFormControl.value,
    };

      try {

      const result = await cadastrarCadastroComplementar(dadosComplementaresDto, this.idEmpresa);

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate([`/l/empresa/edit/${this.idEmpresa}`]);
        return;
      }

    }
    catch (e) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

  hasActiveProduto(idProduto: number) {
    return this.produtosEmpresa?.some((produto: { idProduto: number }) => produto.idProduto == idProduto);
  }

  hasActiveComponent(idComponente: number) {
    const componenteEmpresa: any[] = this.cadastroComplementarEmpresa?.componenteEmpresa;

    return componenteEmpresa?.some(componente => componente.idComponente == idComponente);
  }

  async setProduto(checked: boolean, idProduto: number) {
    if (checked) {
      this.produtosEmpresa.push({ idProduto });
    } else {
      const index = this.produtosEmpresa.map((produto: any) => produto.idProduto).indexOf(idProduto);
      this.produtosEmpresa.splice(index, 1);
    }
  }

  async setComponentes(checked: boolean, idComponente: number) {
    if (checked) {
      this.componenteEmpresa.push({ idComponente });
    } else {
      const index = this.componenteEmpresa.map((componente: any) => componente.idComponente).indexOf(idComponente);
      this.componenteEmpresa.splice(index, 1);
    }
  }

  async setDentistaEmpresa(event: any, tipoCampo: string, dentista: any) {
    event.preventDefault();
    event.stopPropagation();

    dentista[tipoCampo] = event.target.value;
  }

  async removeDentista(event: Event, dentista: any) {
    event.preventDefault();
    event.stopPropagation();

    const index = this.dentistaEmpresa.indexOf(dentista);

    this.dentistaEmpresa.splice(index, 1);
  }

  async addDentista(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.dentistaEmpresa.push({ nome: "", email: "" });
  }

  toogleScanner() {
    this.scannerProprioFormControl = !this.scannerProprioFormControl;
  }

  toogleInterfacesTBase() {
    this.interfacesTBaseFormControl = !this.interfacesTBaseFormControl;
  }

}
