import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { cadastrarCor } from 'src/services/cor.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-cores-cadastro',
  templateUrl: './cores-cadastro.component.html',
  styleUrls: ['./cores-cadastro.component.sass']
})
export class CoresCadastroComponent {

  nomeFormControl = new FormControl('', [Validators.required]);

  @Input() cor: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    public themeService: CustomizerSettingsService,
    private router: Router,
    private dialog: MatDialog
  ) {}


  ngOnInit() {
    if(this.cor) {
      this.nomeFormControl.setValue(this.cor.nome);
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

    let cadastroCorPayload = {
      nome: this.nomeFormControl.value
    };


    try {

      let result;
      if(!this.cor) {
        result = await cadastrarCor(cadastroCorPayload);
      } else {
        this.onSave.emit(cadastroCorPayload);
      }

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/cor']);
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
