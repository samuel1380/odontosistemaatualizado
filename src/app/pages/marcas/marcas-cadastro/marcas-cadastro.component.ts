import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { FormControl, Validators } from '@angular/forms';
import { cadastrarMarca } from 'src/services/marca.service';
import { DialogCadastroComponent } from 'src/app/components/dialog-cadastro/dialog-cadastro.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';

@Component({
  selector: 'app-marcas-cadastro',
  templateUrl: './marcas-cadastro.component.html',
  styleUrls: ['./marcas-cadastro.component.sass']
})
export class MarcasCadastroComponent implements OnInit {

  nomeFormControl = new FormControl('', [Validators.required]);

  @Input() marca: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    public themeService: CustomizerSettingsService,
    private router: Router,
    private dialog: MatDialog
  ) {}


  ngOnInit() {
    if(this.marca) {
      this.nomeFormControl.setValue(this.marca.nome);
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

    let cadastroMarcaPayload = {
      nome: this.nomeFormControl.value
    };


    try {

      let result;
      if(!this.marca) {
        result = await cadastrarMarca(cadastroMarcaPayload);
      } else {
        this.onSave.emit(cadastroMarcaPayload);
      }

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/marca']);
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
      this.nomeFormControl.markAllAsTouched();
      return true;
    }
    return false;
  }
}
