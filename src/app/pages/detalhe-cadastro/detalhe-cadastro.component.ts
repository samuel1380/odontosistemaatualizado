import { Component, Input, OnChanges } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { aprovarEmpresa, buscarEmpresa, desativarEmpresa } from '../../../services/empresa.service';
import { ErroTenteMaisTardeComponent } from '../../components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { DialogEmpresaAprovadaComponent } from '../../components/dialog-empresa-aprovada/dialog-empresa-aprovada.component';
import { CpfCnpjValidator } from '../cadastrar/cpf-cnpj.validator';
import { buscarCEP } from '../../../services/localidade.service';
import { DialogDesativarEmpresaComponent } from '../../components/dialog-desativar-empresa/dialog-desativar-empresa.component';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}


@Component({
  selector: 'app-detalhe-cadastro',
  templateUrl: './detalhe-cadastro.component.html',
  styleUrls: ['./detalhe-cadastro.component.sass']
})
export class DetalheCadastroComponent implements OnChanges {
  idEmpresa: string | null = '';
  empresa: any;

  razaoSocialFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  cnpjFormControl = new FormControl({ value: '', disabled: true }, [Validators.required, CpfCnpjValidator.validate, Validators.minLength(14), Validators.maxLength(14)]);
  cpfFormControl = new FormControl({ value: '', disabled: true }, [Validators.required, CpfCnpjValidator.validate, Validators.minLength(11), Validators.maxLength(11)]);
  nomeFantasiaFormControl = new FormControl('', [Validators.required]);
  tipoEmpresaFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  responsavelTecnicoFormControl = new FormControl('', [Validators.required]);

  cepFormControl = new FormControl({ value: '', disabled: false }, [Validators.required]);
  logradouroFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  complementoFormControl = new FormControl({ value: '', disabled: false });
  bairroFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  cidadeFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  ufFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);

  contatoOperacionalFormControl = new FormControl('', [Validators.required]);
  telefoneOperacionalFormControl = new FormControl('', [Validators.required]);
  emailOperacionalFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);

  contatoFinanceiroFormControl = new FormControl('', [Validators.required]);
  telefoneFinanceiroFormControl = new FormControl('', [Validators.required]);
  emailFinanceiroFormControl = new FormControl('', [Validators.required]);

  numeroDocumentoResponsavel = new FormControl('', [Validators.required]);

  matcher = new MyErrorStateMatcher();

  isEmpresa: boolean = false;
  isPessoa: boolean = false;
  private tempoKeyupBuscaCEP: any;
  aprovado: boolean = false;

  constructor(private router: Router, private dialog: MatDialog, private activatedRoute: ActivatedRoute) {
    this.idEmpresa = this.activatedRoute.snapshot.paramMap.get("id")
    if (!this.idEmpresa) {
      return;
    }

    buscarEmpresa(this.idEmpresa).then((response: any) => {
      this.empresa = response.data;

      this.nomeFantasiaFormControl.setValue(this.empresa.nome);
      this.razaoSocialFormControl.setValue(this.empresa.razaoSocial);
      this.cnpjFormControl.setValue(this.empresa.documento);
      this.cpfFormControl.setValue(this.empresa.documento);
      this.tipoEmpresaFormControl.setValue(this.empresa.tipoEmpresa);

      this.cepFormControl.setValue(this.empresa.cep);
      this.logradouroFormControl.setValue(this.empresa.logradouro);
      this.complementoFormControl.setValue(this.empresa.complemento);
      this.bairroFormControl.setValue(this.empresa.bairro);
      this.cidadeFormControl.setValue(this.empresa.cidadeFormControl);
      this.ufFormControl.setValue(this.empresa.ufFormControl);

      this.responsavelTecnicoFormControl.setValue(this.empresa.responsavelTecnico);
      this.numeroDocumentoResponsavel.setValue(this.empresa.numeroDocumentoResponsavelTecnico);
      this.contatoFinanceiroFormControl.setValue(this.empresa.nomeResponsavelFinanceiro);
      this.telefoneFinanceiroFormControl.setValue(this.empresa.telefoneFinanceiro);
      this.emailFinanceiroFormControl.setValue(this.empresa.emailFinanceiro);
      this.contatoOperacionalFormControl.setValue(this.empresa.nomeResponsavel);
      this.telefoneOperacionalFormControl.setValue(this.empresa.telefone);
      this.emailOperacionalFormControl.setValue(this.empresa.email);

      this.isEmpresa = this.empresa.tipoEmpresa === 'clinica_odontologica' || this.empresa.tipoEmpresa === 'laboratorio_protese_dentaria';
      this.isPessoa = this.empresa.tipoEmpresa === 'cirurgiao_dentista';
      this.aprovado = this.empresa.aprovada;
    })
  }

  ngOnChanges() {
    if (!this.empresa) {
      return;
    }
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    let cadastroEmpresaPayload = {};

    if (this.isEmpresa) {
      cadastroEmpresaPayload = {
        nome: this.nomeFantasiaFormControl.value,
        razaoSocial: this.razaoSocialFormControl.value,
        documento: this.cnpjFormControl.value,
        tipoEmpresa: this.tipoEmpresaFormControl.value,
        responsavelTecnico: this.responsavelTecnicoFormControl.value,
        numeroDocumentoResponsavelTecnico: this.numeroDocumentoResponsavel.value,
        nomeResponsavelFinanceiro: this.contatoFinanceiroFormControl.value,
        telefoneFinanceiro: this.telefoneFinanceiroFormControl.value,
        emailFinanceiro: this.emailFinanceiroFormControl.value,
        nomeResponsavel: this.contatoOperacionalFormControl.value,
        telefone: this.telefoneOperacionalFormControl.value,
        email: this.emailOperacionalFormControl.value,

        cep: this.cepFormControl.value,
        logradouro: this.logradouroFormControl.value,
        bairro: this.bairroFormControl.value,
        cidade: this.cidadeFormControl.value,
        uf: this.ufFormControl.value
      }
    } else {
      cadastroEmpresaPayload = {
        nome: this.nomeFantasiaFormControl.value,
        razaoSocial: this.nomeFantasiaFormControl.value,
        documento: this.cpfFormControl.value,
        tipoEmpresa: this.tipoEmpresaFormControl.value,
        responsavelTecnico: this.responsavelTecnicoFormControl.value,
        numeroDocumentoResponsavelTecnico: this.numeroDocumentoResponsavel.value,
        nomeResponsavelFinanceiro: this.contatoFinanceiroFormControl.value,
        telefoneFinanceiro: this.telefoneFinanceiroFormControl.value,
        emailFinanceiro: this.emailFinanceiroFormControl.value,
        nomeResponsavel: this.contatoOperacionalFormControl.value,
        telefone: this.telefoneOperacionalFormControl.value,
        email: this.emailOperacionalFormControl.value,

        cep: this.cepFormControl.value?.toString(),
        logradouro: this.logradouroFormControl.value,
        bairro: this.bairroFormControl.value,
        cidade: this.cidadeFormControl.value,
        uf: this.ufFormControl.value
      }
    }
    try {
      // const result = await cadastrarEmpresa(cadastroEmpresaPayload);

      // if (result.status == 201) {
      //   this.dialog.open(DialogCadastroComponent, {
      //     width: '50%',
      //     enterAnimationDuration: `100ms`,
      //     exitAnimationDuration: `100ms`,
      //   });
      //   this.router.navigate(['/']);
      //   return;
      // }

    }
    catch (e) {
      // this.dialog.open(ErroTenteMaisTardeComponent, {
      //   width: '50%',
      //   enterAnimationDuration: `100ms`,
      //   exitAnimationDuration: `100ms`,
      // });
    }
  }


  async onChangeBuscaCEP() {
    if (this.tempoKeyupBuscaCEP) {
      clearTimeout(this.tempoKeyupBuscaCEP);
    }

    this.tempoKeyupBuscaCEP = setTimeout(async () => {
      const cep = this.cepFormControl.value;

      if (cep?.toString().length === 8) {
        const endereco = await buscarCEP(cep);
        if (endereco.status !== 200) {
          return;
        }

        if (endereco.data.logradouro) {
          this.logradouroFormControl.setValue(endereco.data.logradouro);
          this.logradouroFormControl.disable();
        } else {
          this.logradouroFormControl.setValue(endereco.data.logradouro);
          this.logradouroFormControl.enable();
        }

        if (endereco.data.bairro) {
          this.bairroFormControl.setValue(endereco.data.bairro);
          this.bairroFormControl.disable();
        } else {
          this.bairroFormControl.setValue(endereco.data.bairro);
          this.bairroFormControl.enable();
        }

        if (endereco.data.localidade) {
          this.cidadeFormControl.setValue(endereco.data.localidade);
          this.cidadeFormControl.disable();
        } else {
          this.cidadeFormControl.setValue(endereco.data.localidade);
          this.cidadeFormControl.enable();
        }

        if (endereco.data.uf) {
          this.ufFormControl.setValue(endereco.data.uf);
          this.ufFormControl.disable();
        } else {
          this.ufFormControl.setValue(endereco.data.uf);
          this.ufFormControl.enable();
        }

        this.complementoFormControl.enable();
      }
    }, 1500)
  }

  async desativar(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.idEmpresa) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
      return;
    }

    try {
      await desativarEmpresa(this.idEmpresa);
      this.dialog.open(DialogDesativarEmpresaComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });

      this.router.navigate(['/l/empresa']);
    } catch (e) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }

  }

  async aprovarParceiro(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.idEmpresa) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
      return;
    }

    try {
      await aprovarEmpresa(this.idEmpresa);
      this.dialog.open(DialogEmpresaAprovadaComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });

      this.router.navigate(['/l/aprovacoes']);
    } catch (e) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }

  }



  private validaCadastro(): boolean {
    const nome = this.nomeFantasiaFormControl.value;
    const razaoSocial = this.razaoSocialFormControl.value;
    const documento = this.cnpjFormControl.value;
    const tipoEmpresa = this.tipoEmpresaFormControl.value;
    const responsavelTecnico = this.responsavelTecnicoFormControl.value;
    const numeroDocumentoResponsavelTecnico = this.numeroDocumentoResponsavel.value;
    const nomeResponsavelFinanceiro = this.contatoFinanceiroFormControl.value;
    const telefoneFinanceiro = this.telefoneFinanceiroFormControl.value;
    const emailFinanceiro = this.emailFinanceiroFormControl.value;
    const nomeResponsavel = this.contatoOperacionalFormControl.value;
    const telefone = this.telefoneOperacionalFormControl.value;
    const email = this.emailOperacionalFormControl.value;
    const cpf = this.cpfFormControl.value;

    const cep = this.cepFormControl.value;
    const logradouro = this.logradouroFormControl.value;
    const bairro = this.bairroFormControl.value;
    const cidade = this.cidadeFormControl.value;
    const uf = this.ufFormControl.value;

    if (!nome || !tipoEmpresa || !logradouro || !responsavelTecnico || !numeroDocumentoResponsavelTecnico
      || !nomeResponsavelFinanceiro || !telefoneFinanceiro || !emailFinanceiro || !nomeResponsavel || !telefone || !email
      || this.isEmpresa && !razaoSocial || this.isEmpresa && !documento || this.isPessoa && !cpf
      || !cep || !logradouro || !bairro || !cidade || !uf) {

      if (this.isEmpresa) {
        this.razaoSocialFormControl.markAllAsTouched();
        this.cnpjFormControl.markAllAsTouched();
      } else if (this.isPessoa) {
        this.cpfFormControl.markAllAsTouched();
      }

      this.nomeFantasiaFormControl.markAllAsTouched();
      this.tipoEmpresaFormControl.markAllAsTouched();
      this.logradouroFormControl.markAllAsTouched();
      this.responsavelTecnicoFormControl.markAllAsTouched();
      this.numeroDocumentoResponsavel.markAllAsTouched();
      this.contatoFinanceiroFormControl.markAllAsTouched();
      this.telefoneFinanceiroFormControl.markAllAsTouched();
      this.emailFinanceiroFormControl.markAllAsTouched();
      this.contatoOperacionalFormControl.markAllAsTouched();
      this.telefoneOperacionalFormControl.markAllAsTouched();
      this.emailOperacionalFormControl.markAllAsTouched();

      this.cepFormControl.markAllAsTouched();
      this.logradouroFormControl.markAllAsTouched();
      this.bairroFormControl.markAllAsTouched();
      this.cidadeFormControl.markAllAsTouched();
      this.ufFormControl.markAllAsTouched();

      return true;
    }

    return false;
  }

}
