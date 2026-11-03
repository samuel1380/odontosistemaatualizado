import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioService, Usuario } from 'src/services/usuario.service';
import { UsuarioCadastroComponent } from './usuario-cadastro/usuario-cadastro.component';
import { UsuarioPermissoesComponent } from './usuario-permissoes/usuario-permissoes.component';
import { ConfirmacaoDialogComponent } from 'src/app/components/common/componentsconfirmacao-dialog.component';
import { buscarEmpresas } from 'src/services/empresa.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.sass']
})
export class UsuarioComponent implements OnInit {
  listaUsuarios = new MatTableDataSource<Usuario>([]);
  displayedColumns: string[] = ['nome', 'email', 'tipoUsuario', 'status', 'empresas', 'acoes'];
  
  empresas: any[] = [];
  empresaFilter = new FormControl<number | null>(null);

  constructor(
    private usuarioService: UsuarioService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarEmpresas();
    this.buscarUsuarios();
    
    this.empresaFilter.valueChanges.subscribe(() => {
      this.buscarUsuarios();
    });
  }

  async carregarEmpresas() {
    try {
      const response: any = await buscarEmpresas();
      this.empresas = response.data || [];
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  buscarUsuarios() {
    const idEmpresa = this.empresaFilter.value;
    this.usuarioService.listarUsuarios(idEmpresa || undefined).subscribe({
      next: (usuarios) => {
        this.listaUsuarios.data = usuarios;
      },
      error: (err) => {
        console.error('Erro ao buscar usuários', err);
        this.snackBar.open('Erro ao buscar usuários', 'Fechar', { duration: 3000 });
      }
    });
  }

  abrirCadastro() {
    const dialogRef = this.dialog.open(UsuarioCadastroComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.buscarUsuarios();
      }
    });
  }

  abrirEdicao(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioCadastroComponent, {
      width: '600px',
      data: usuario
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.buscarUsuarios();
      }
    });
  }

  abrirPermissoes(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioPermissoesComponent, {
      width: '500px',
      data: usuario
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.buscarUsuarios();
      }
    });
  }

  getStatusText(usuario: Usuario): string {
    if (!usuario.ativo) return 'Inativo';
    if (usuario.bloqueado) return 'Bloqueado';
    return 'Ativo';
  }

  getStatusClass(usuario: Usuario): string {
    if (!usuario.ativo) return 'status-inativo';
    if (usuario.bloqueado) return 'status-bloqueado';
    return 'status-ativo';
  }

  getEmpresasText(usuario: Usuario): string {
    if (!usuario.empresas || usuario.empresas.length === 0) {
      return '-';
    }
    return usuario.empresas.map(e => e.nomeFantasia || e.nome).join(', ');
  }

  ativarUsuario(usuario: Usuario) {
    const dialogRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Ativar Usuário',
        mensagem: `Deseja realmente ativar o usuário ${usuario.nome}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.usuarioService.ativarUsuario(usuario.idUsuario).subscribe({
          next: () => {
            this.snackBar.open('Usuário ativado com sucesso!', 'Fechar', { duration: 3000 });
            this.buscarUsuarios();
          },
          error: (err) => {
            console.error('Erro ao ativar usuário', err);
            this.snackBar.open('Erro ao ativar usuário', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }

  inativarUsuario(usuario: Usuario) {
    const dialogRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Inativar Usuário',
        mensagem: `Deseja realmente inativar o usuário ${usuario.nome}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.usuarioService.inativarUsuario(usuario.idUsuario).subscribe({
          next: () => {
            this.snackBar.open('Usuário inativado com sucesso!', 'Fechar', { duration: 3000 });
            this.buscarUsuarios();
          },
          error: (err) => {
            console.error('Erro ao inativar usuário', err);
            this.snackBar.open('Erro ao inativar usuário', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }

  resetarSenha(usuario: Usuario) {
    const dialogRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Resetar Senha',
        mensagem: `Deseja realmente resetar a senha do usuário ${usuario.nome}? Uma nova senha será gerada.`
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.usuarioService.resetarSenha(usuario.idUsuario).subscribe({
          next: (res) => {
            prompt(`Senha do usuário ${usuario.nome} resetada com sucesso!\n\nCopie a nova senha temporária abaixo:`, res.senhaGerada);
          },
          error: (err) => {
            console.error('Erro ao resetar senha', err);
            this.snackBar.open('Erro ao resetar senha', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }
}
