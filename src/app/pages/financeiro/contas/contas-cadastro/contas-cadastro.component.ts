import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { cadastrarConta } from 'src/services/financeiro.conta.service';

@Component({
  selector: 'app-contas-cadastro',
  templateUrl: './contas-cadastro.component.html',
  styleUrl: './contas-cadastro.component.sass'
})
export class ContasCadastroComponent {

  tiposConta = [
    { nome: "CONTA_CORRENTE", id: 'CONTA_CORRENTE' },
    { nome: "POUPANCA", id: 'POUPANCA' },
    { nome: "CAIXA_INTERNO", id: 'CAIXA_INTERNO' },
    { nome: "CARTEIRA_DIGITAL", id: 'CARTEIRA_DIGITAL' },
  ];

  contasFormControl = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    tipo: new FormControl('', [Validators.required]),
    saldoInicial: new FormControl(0, [Validators.required]),
  });

  @Input() conta: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    public themeService: CustomizerSettingsService,
    private router: Router,
    private dialog: MatDialog
  ) { }


  ngOnInit() {
    if (this.conta) {
      this.contasFormControl.get('nome')?.setValue(this.conta.nome);
      this.contasFormControl.get('tipo')?.setValue(this.conta.tipo);
      this.contasFormControl.get('saldoInicial')?.setValue(this.conta.saldoInicial);

      this.contasFormControl.get('nome')?.disable();
      this.contasFormControl.get('tipo')?.disable();
      this.contasFormControl.get('saldoInicial')?.disable();

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

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    let cadastroContaPayload = {
      nome: this.contasFormControl.get('nome')?.value,
      tipo: this.contasFormControl.get('tipo')?.value,
      saldoInicial: this.contasFormControl.get('saldoInicial')?.value
    };


    try {

      let result;
      if (!this.conta) {
        result = await cadastrarConta(cadastroContaPayload);
      } else {
        this.onSave.emit(cadastroContaPayload);
      }

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/contas']);
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


  private validaCadastro(): boolean {
    const nome = this.contasFormControl.get('nome')?.value;
    const tipo = this.contasFormControl.get('tipo')?.value;
    const saldoInicial = this.contasFormControl.get('saldoInicial')?.value;

    if (!nome || !tipo || !saldoInicial && saldoInicial != 0) {
      this.contasFormControl.markAllAsTouched();
      return true;
    }
    return false;
  }
}
