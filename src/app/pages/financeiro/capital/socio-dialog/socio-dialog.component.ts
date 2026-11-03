import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { criarSocio, atualizarSocio, CreateSocioDto, Socio } from 'src/services/capital.service';
import { buscarEmpresas } from 'src/services/empresa.service';

@Component({
  selector: 'app-socio-dialog',
  templateUrl: './socio-dialog.component.html',
  styleUrls: ['./socio-dialog.component.sass']
})
export class SocioDialogComponent {
  socioForm = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    cpf: new FormControl<string | null>(null),
    cnpj: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null),
    telefone: new FormControl<string | null>(null),
    endereco: new FormControl<string | null>(null),
    idEmpresa: new FormControl<number | null>(null),
  });

  empresas: any[] = [];
  isEdit = false;
  socioId?: number;

  constructor(
    public dialogRef: MatDialogRef<SocioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Socio | null,
    private dialog: MatDialog,
  ) {
    this.loadEmpresas();
    
    if (data) {
      this.isEdit = true;
      this.socioId = data.idSocio;
      this.socioForm.patchValue({
        nome: data.nome,
        cpf: data.cpf || null,
        cnpj: data.cnpj || null,
        email: data.email || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
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
    if (this.socioForm.invalid) {
      this.socioForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.socioForm.getRawValue();
      const dto: CreateSocioDto = {
        nome: formValue.nome!,
        cpf: formValue.cpf || undefined,
        cnpj: formValue.cnpj || undefined,
        email: formValue.email || undefined,
        telefone: formValue.telefone || undefined,
        endereco: formValue.endereco || undefined,
        idEmpresa: formValue.idEmpresa || undefined,
      };

      let response;
      if (this.isEdit && this.socioId) {
        response = await atualizarSocio(this.socioId, dto);
      } else {
        response = await criarSocio(dto);
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
      console.error('Erro ao salvar sócio', error);
    }
  }
}

