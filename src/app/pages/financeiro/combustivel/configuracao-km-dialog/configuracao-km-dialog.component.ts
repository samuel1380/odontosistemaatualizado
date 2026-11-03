import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { atualizarConfiguracaoKm, UpdateConfiguracaoKmDto, ConfiguracaoKm } from 'src/services/combustivel.service';

@Component({
  selector: 'app-configuracao-km-dialog',
  templateUrl: './configuracao-km-dialog.component.html',
  styleUrls: ['./configuracao-km-dialog.component.sass']
})
export class ConfiguracaoKmDialogComponent {
  configuracaoForm = new FormGroup({
    valorPorKm: new FormControl(0, [Validators.required, Validators.min(0.01)]),
  });

  constructor(
    public dialogRef: MatDialogRef<ConfiguracaoKmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfiguracaoKm | null,
    private dialog: MatDialog,
  ) {
    if (data) {
      this.configuracaoForm.patchValue({
        valorPorKm: data.valorPorKm,
      });
    }
  }

  async salvar() {
    if (this.configuracaoForm.invalid) {
      this.configuracaoForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.configuracaoForm.getRawValue();
      const dto: UpdateConfiguracaoKmDto = {
        valorPorKm: formValue.valorPorKm!,
      };

      const response = await atualizarConfiguracaoKm(dto);

      if (response?.status === 200 || response?.status === 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar configuração', error);
    }
  }
}

