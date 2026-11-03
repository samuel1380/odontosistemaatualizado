import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { registrarAbastecimento, CreateAbastecimentoDto, Veiculo } from 'src/services/combustivel.service';
import { listarVeiculos } from 'src/services/combustivel.service';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-abastecimento-dialog',
  templateUrl: './abastecimento-dialog.component.html',
  styleUrls: ['./abastecimento-dialog.component.sass']
})
export class AbastecimentoDialogComponent {
  abastecimentoForm = new FormGroup({
    idVeiculo: new FormControl<number | null>(null, [Validators.required]),
    dataAbastecimento: new FormControl(new Date(), [Validators.required]),
    litros: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    valorLitro: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    quilometragem: new FormControl<number | null>(null),
    local: new FormControl<string | null>(null),
    observacoes: new FormControl<string | null>(null),
  });

  veiculos: Veiculo[] = [];
  
  valorTotal = 0;

  constructor(
    public dialogRef: MatDialogRef<AbastecimentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idVeiculo?: number } | null,
    private dialog: MatDialog,
  ) {
    this.loadData();
    
    if (data?.idVeiculo) {
      this.abastecimentoForm.patchValue({ idVeiculo: data.idVeiculo });
    }

    // Calcular valor total quando litros ou valorLitro mudarem
    this.abastecimentoForm.get('litros')?.valueChanges.subscribe(() => this.calcularTotal());
    this.abastecimentoForm.get('valorLitro')?.valueChanges.subscribe(() => this.calcularTotal());
  }

  async loadData() {
    try {
      const veiculosRes = await listarVeiculos();

      if (veiculosRes.status === 200) {
        this.veiculos = veiculosRes.data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  }

  calcularTotal() {
    const litros = this.abastecimentoForm.get('litros')?.value || 0;
    const valorLitro = this.abastecimentoForm.get('valorLitro')?.value || 0;
    this.valorTotal = litros * valorLitro;
  }

  async salvar() {
    if (this.abastecimentoForm.invalid) {
      this.abastecimentoForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.abastecimentoForm.getRawValue();
      const dto: CreateAbastecimentoDto = {
        idVeiculo: formValue.idVeiculo!,
        dataAbastecimento: format(formValue.dataAbastecimento!, 'yyyy-MM-dd'),
        litros: formValue.litros!,
        valorLitro: formValue.valorLitro!,
        quilometragem: formValue.quilometragem || undefined,
        local: formValue.local || undefined,
        observacoes: formValue.observacoes || undefined,
      };

      const response = await registrarAbastecimento(dto);

      if (response?.status === 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar abastecimento', error);
    }
  }
}

