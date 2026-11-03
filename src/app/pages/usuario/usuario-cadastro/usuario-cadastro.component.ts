import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioService, Usuario, CreateUsuarioDto, UpdateUsuarioDto } from 'src/services/usuario.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-usuario-cadastro',
  templateUrl: './usuario-cadastro.component.html',
  styleUrls: ['./usuario-cadastro.component.sass']
})
export class UsuarioCadastroComponent implements OnInit {
  usuarioForm: FormGroup;
  empresas: any[] = [];
  tiposUsuario = [
    { nome: 'Externo', valor: 'externo' },
    { nome: 'Interno', valor: 'interno' }
  ];
  permissoesDisponiveis = ['admin', 'comum', 'vendas', 'producao', 'financeiro'];
  isEditMode = false;

  constructor(
    public dialogRef: MatDialogRef<UsuarioCadastroComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Usuario | null,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.usuarioForm = new FormGroup({
      nome: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      tipoUsuario: new FormControl('externo', [Validators.required]),
      permissoes: new FormControl([], [Validators.required]),
      ativo: new FormControl(true),
      bloqueado: new FormControl(false),
      idEmpresa: new FormControl(null)
    });
  }

  async ngOnInit() {
    await this.carregarEmpresas();

    if (this.data) {
      this.isEditMode = true;
      this.usuarioForm.patchValue({
        nome: this.data.nome,
        email: this.data.email,
        tipoUsuario: this.data.tipoUsuario,
        permissoes: this.data.permissoes?.map(p => p.nome) || [],
        ativo: this.data.ativo,
        bloqueado: this.data.bloqueado,
        idEmpresa: this.data.empresas && this.data.empresas.length > 0 ? this.data.empresas[0].idEmpresa : null
      });

      // Desabilita email em modo de edição
      this.usuarioForm.get('email')?.disable();
    }
  }

  async carregarEmpresas() {
    try {
      const response: any = await buscarEmpresas();
      this.empresas = response.data || [];
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  salvar() {
    if (this.usuarioForm.invalid) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'Fechar', { duration: 3000 });
      return;
    }

    const formValue = this.usuarioForm.getRawValue();

    if (this.isEditMode && this.data) {
      const updateDto: UpdateUsuarioDto = {
        nome: formValue.nome,
        email: formValue.email,
        tipoUsuario: formValue.tipoUsuario
      };

      this.usuarioService.editarUsuario(this.data.idUsuario, updateDto).subscribe({
        next: () => {
          this.snackBar.open('Usuário atualizado com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao atualizar usuário', err);
          this.snackBar.open('Erro ao atualizar usuário', 'Fechar', { duration: 3000 });
        }
      });
    } else {
      const createDto: CreateUsuarioDto = {
        nome: formValue.nome,
        email: formValue.email,
        tipoUsuario: formValue.tipoUsuario,
        permissoes: formValue.permissoes || [],
        ativo: formValue.ativo !== undefined ? formValue.ativo : true,
        bloqueado: formValue.bloqueado !== undefined ? formValue.bloqueado : false,
        idEmpresa: formValue.idEmpresa || undefined
      };

      this.usuarioService.criarUsuario(createDto).subscribe({
        next: () => {
          this.dialogRef.close(true);
          this.dialog.open(DialogCadastroSucessoComponent, {
            width: '50%',
            enterAnimationDuration: '100ms',
            exitAnimationDuration: '100ms',
          });
        },
        error: (err) => {
          console.error('Erro ao criar usuário', err);
          const mensagem = err?.error?.message || 'Erro ao criar usuário';
          this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
        }
      });
    }
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
