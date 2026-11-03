import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { criarFornecedor, atualizarFornecedor, CreateFornecedorLogisticaDto, FornecedorLogistica } from 'src/services/logistica.service';
import { buscarEmpresas } from 'src/services/empresa.service';

@Component({
  selector: 'app-fornecedor-dialog',
  templateUrl: './fornecedor-dialog.component.html',
  styleUrls: ['./fornecedor-dialog.component.sass']
})
export class FornecedorDialogComponent {
  fornecedorForm = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    tipo: new FormControl('TRANSPORTADORA', [Validators.required]),
    contato: new FormControl<string | null>(null),
    telefone: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null),
    idEmpresa: new FormControl<number | null>(null),
  });

  tiposFornecedor = [
    { nome: 'Transportadora', id: 'TRANSPORTADORA' },
    { nome: 'Correios', id: 'CORREIOS' },
    { nome: 'Entrega Rápida', id: 'ENTREGA_RAPIDA' },
  ];

  empresas: any[] = [];
  isEdit = false;
  fornecedorId?: number;

  constructor(
    public dialogRef: MatDialogRef<FornecedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FornecedorLogistica | null,
    private dialog: MatDialog,
  ) {
    this.loadEmpresas();
    
    if (data) {
      this.isEdit = true;
      this.fornecedorId = data.idFornecedorLogistica;
      this.fornecedorForm.patchValue({
        nome: data.nome,
        tipo: data.tipo,
        contato: data.contato || null,
        telefone: data.telefone || null,
        email: data.email || null,
        idEmpresa: data.idEmpresa || null,
      });
    }
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas = response.data;
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  async salvar() {
    if (this.fornecedorForm.invalid) {
      this.fornecedorForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.fornecedorForm.getRawValue();
      const dto: CreateFornecedorLogisticaDto = {
        nome: formValue.nome!,
        tipo: formValue.tipo as any,
        contato: formValue.contato || undefined,
        telefone: formValue.telefone || undefined,
        email: formValue.email || undefined,
        idEmpresa: formValue.idEmpresa || undefined,
      };

      let response;
      if (this.isEdit && this.fornecedorId) {
        response = await atualizarFornecedor(this.fornecedorId, dto);
      } else {
        response = await criarFornecedor(dto);
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
      console.error('Erro ao salvar fornecedor', error);
    }
  }
}

