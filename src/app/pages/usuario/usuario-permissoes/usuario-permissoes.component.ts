import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioService, Usuario, Permissao } from 'src/services/usuario.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-usuario-permissoes',
  templateUrl: './usuario-permissoes.component.html',
  styleUrls: ['./usuario-permissoes.component.sass']
})
export class UsuarioPermissoesComponent implements OnInit {
  usuario: Usuario;
  permissoesAtuais: Permissao[] = [];
  permissaoNova = new FormControl('');
  permissoesDisponiveis = ['admin', 'comum'];

  constructor(
    public dialogRef: MatDialogRef<UsuarioPermissoesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Usuario,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar
  ) {
    this.usuario = data;
  }

  ngOnInit(): void {
    this.carregarPermissoes();
  }

  carregarPermissoes() {
    this.usuarioService.buscarUsuarioPorId(this.usuario.idUsuario).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.permissoesAtuais = usuario.permissoes || [];
      },
      error: (err) => {
        console.error('Erro ao carregar permissões', err);
        this.snackBar.open('Erro ao carregar permissões', 'Fechar', { duration: 3000 });
      }
    });
  }

  adicionarPermissao() {
    const permissao = this.permissaoNova.value?.trim();
    if (!permissao) {
      this.snackBar.open('Selecione uma permissão', 'Fechar', { duration: 3000 });
      return;
    }

    // Verifica se a permissão já existe
    if (this.permissoesAtuais.some(p => p.nome === permissao)) {
      this.snackBar.open('Esta permissão já está atribuída ao usuário', 'Fechar', { duration: 3000 });
      return;
    }

    this.usuarioService.adicionarPermissao(this.usuario.idUsuario, permissao).subscribe({
      next: () => {
        this.snackBar.open('Permissão adicionada com sucesso!', 'Fechar', { duration: 3000 });
        this.permissaoNova.setValue('');
        this.carregarPermissoes();
      },
      error: (err) => {
        console.error('Erro ao adicionar permissão', err);
        const mensagem = err?.error?.message || 'Erro ao adicionar permissão';
        this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
      }
    });
  }

  removerPermissao(permissao: Permissao) {
    this.usuarioService.removerPermissao(this.usuario.idUsuario, permissao.nome).subscribe({
      next: () => {
        this.snackBar.open('Permissão removida com sucesso!', 'Fechar', { duration: 3000 });
        this.carregarPermissoes();
      },
      error: (err) => {
        console.error('Erro ao remover permissão', err);
        const mensagem = err?.error?.message || 'Erro ao remover permissão';
        this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
      }
    });
  }

  fechar() {
    this.dialogRef.close(true);
  }
}
