import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogCadastroComponent } from 'src/app/components/dialog-cadastro/dialog-cadastro.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { cadastrarComponente } from 'src/services/componente.service';
import { buscarMarcas } from 'src/services/marca.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { ErrorStateMatcher } from '@angular/material/core';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-componentes-cadastro',
  templateUrl: './componentes-cadastro.component.html',
  styleUrls: ['./componentes-cadastro.component.sass']
})
export class ComponentesCadastroComponent {
  marcaList: any = [];
  @Input() componente: any;
  @Output() onSave = new EventEmitter<any>();

  matcher = new MyErrorStateMatcher();

  constructor(private router: Router, private dialog: MatDialog, public themeService: CustomizerSettingsService) {
    buscarMarcas().then((response: any) => {
      if (response.status === 200) {
        this.marcaList = response.data;
      }
    });
  }

  ngOnInit() {
    if(this.componente) {
      this.nomeFormControl.setValue(this.componente.nome);
      this.marcaComponenteFormControl.setValue(this.componente.idMarcaComponente);
      this.precoControl.setValue(this.componente.preco);
      this.hasParafusoFormControl.setValue(this.componente.hasParafuso);
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

  marcaComponenteFormControl = new FormControl('', [Validators.required]);
  nomeFormControl = new FormControl('', [Validators.required]);
  precoControl = new FormControl('', [Validators.required]);
  hasParafusoFormControl = new FormControl(false, [Validators.required]);

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    const preco = this.precoControl.value || '0';
    let cadastroComponentePayload = {
      idMarcaComponente: this.marcaComponenteFormControl.value,
      nome: this.nomeFormControl.value,
      preco: parseFloat(preco),
      hasParafuso: this.hasParafusoFormControl.value
    };

    try {
      let result;
      if(!this.componente) {
        result = await cadastrarComponente(cadastroComponentePayload);
      } else {
        this.onSave.emit(cadastroComponentePayload);
      }

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/componente']);
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
    const nomeComponente = this.nomeFormControl.value;

    if(!nomeComponente) {
      this.marcaComponenteFormControl.markAllAsTouched();
      this.nomeFormControl.markAllAsTouched();
      return true;
    }
    return false;
  }
}


// Cadastro de Cores e Validação da edição de componentes.
