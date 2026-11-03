import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { DialogCadastroErroComponent } from 'src/app/components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { cadastrarMotivo } from 'src/services/motivo.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';

@Component({
  selector: 'app-motivos-cadastro',
  templateUrl: './motivos-cadastro.component.html',
  styleUrls: ['./motivos-cadastro.component.sass']
})
export class MotivosCadastroComponent {
  nomeFormControl = new FormControl('', [Validators.required]);
  tipoFormControl = new FormControl<'RETRABALHO' | 'BONIFICACAO'>('RETRABALHO', [Validators.required]);

  @Input() motivo: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    public themeService: CustomizerSettingsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.motivo) {
      this.nomeFormControl.setValue(this.motivo.nome);
      this.tipoFormControl.setValue(this.motivo.tipo);
    }
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) return;

    const payload = {
      nome: this.nomeFormControl.value,
      tipo: this.tipoFormControl.value,
    };

    try {
      let result;
      if (!this.motivo) {
        result = await cadastrarMotivo(payload);
      } else {
        this.onSave.emit(payload);
        return;
      }

      if (result?.status == 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.router.navigate(['/l/motivo']);
      }
    } catch (e) {
      this.dialog.open(DialogCadastroErroComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

  private validaCadastro(): boolean {
    const nome = this.nomeFormControl.value;
    const tipo = this.tipoFormControl.value;
    if (!nome || !tipo) {
      this.nomeFormControl.markAllAsTouched();
      this.tipoFormControl.markAllAsTouched();
      return true;
    }
    return false;
  }
}

