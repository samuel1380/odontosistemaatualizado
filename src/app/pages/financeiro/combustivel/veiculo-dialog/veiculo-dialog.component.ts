import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { criarVeiculo, atualizarVeiculo, CreateVeiculoDto, Veiculo } from 'src/services/combustivel.service';

@Component({
  selector: 'app-veiculo-dialog',
  templateUrl: './veiculo-dialog.component.html',
  styleUrls: ['./veiculo-dialog.component.sass']
})
export class VeiculoDialogComponent {
  veiculoForm = new FormGroup({
    nome: new FormControl('', [Validators.required]),
  });

  isEdit = false;
  veiculoId?: number;

  constructor(
    public dialogRef: MatDialogRef<VeiculoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Veiculo | null,
    private dialog: MatDialog,
  ) {
    if (data) {
      this.isEdit = true;
      this.veiculoId = data.idVeiculo;
      this.veiculoForm.patchValue({
        nome: data.nome,
      });
    }
  }

  async salvar() {
    if (this.veiculoForm.invalid) {
      this.veiculoForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.veiculoForm.getRawValue();
      const dto: CreateVeiculoDto = {
        nome: formValue.nome!,
      };

      let response;
      if (this.isEdit && this.veiculoId) {
        response = await atualizarVeiculo(this.veiculoId, dto);
      } else {
        response = await criarVeiculo(dto);
      }

      if (response?.status === 201 || response?.status === 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar veículo', error);
      // TODO: Mostrar mensagem de erro
    }
  }
}

