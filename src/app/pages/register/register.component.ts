import { Component } from '@angular/core';
import { CustomizerSettingsService } from '../externalComponents/customizer-settings/customizer-settings.service';
import { FormControl, Validators } from '@angular/forms';
import { CpfCnpjValidator } from '../cadastrar/cpf-cnpj.validator';
import { buscarCEP } from 'src/services/localidade.service';
import { cadastrarEmpresa } from 'src/services/empresa.service';
import { DialogCadastroComponent } from 'src/app/components/dialog-cadastro/dialog-cadastro.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  razaoSocialFormControl = new FormControl('', [Validators.required]);
  cnpjFormControl = new FormControl('', [Validators.required, CpfCnpjValidator.validate, Validators.minLength(14), Validators.maxLength(14)]);
  cpfFormControl = new FormControl('', [Validators.required, CpfCnpjValidator.validate, Validators.minLength(11), Validators.maxLength(11)]);
  nomeFantasiaFormControl = new FormControl('', [Validators.required]);
  tipoEmpresaFormControl = new FormControl('', [Validators.required]);
  responsavelTecnicoFormControl = new FormControl('', [Validators.required]);

  cepFormControl = new FormControl({ value: '', disabled: false }, [Validators.required]);
  logradouroFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  complementoFormControl = new FormControl({ value: '', disabled: false });
  bairroFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  cidadeFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  ufFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);

  contatoOperacionalFormControl = new FormControl('', [Validators.required]);
  telefoneOperacionalFormControl = new FormControl('', [Validators.required]);
  emailOperacionalFormControl = new FormControl('', [Validators.required, Validators.email]);

  contatoFinanceiroFormControl = new FormControl('', [Validators.required]);
  telefoneFinanceiroFormControl = new FormControl('', [Validators.required]);
  emailFinanceiroFormControl = new FormControl('', [Validators.required, Validators.email]);

  numeroDocumentoResponsavel = new FormControl('', [Validators.required]);

  isEmpresa: boolean = false;
  isPessoa: boolean = false;
  private tempoKeyupBuscaCEP: any;

  hide = true;

  constructor(
      public themeService: CustomizerSettingsService,
      private router: Router,
      private dialog: MatDialog
  ) {}

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

        cep: this.cepFormControl.value?.toString(),
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
      const result = await cadastrarEmpresa(cadastroEmpresaPayload);

      if (result.status == 201) {
        this.dialog.open(DialogCadastroComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/']);
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


  onChangeTipoEmpresa() {
    const value = this.tipoEmpresaFormControl.getRawValue();

    this.isEmpresa = value === 'clinica_odontologica' || value === 'laboratorio_protese_dentaria';
    this.isPessoa = value === 'cirurgiao_dentista';
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
