import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  listarFornecedores,
  excluirFornecedor,
  FornecedorFinanceiro,
} from 'src/services/financeiro.fornecedor.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { FornecedorFinanceiroDialogComponent } from './fornecedor-financeiro-dialog/fornecedor-financeiro-dialog.component';
import { ConfirmacaoDialogComponent } from 'src/app/components/common/componentsconfirmacao-dialog.component';

type FornecedorLinha = FornecedorFinanceiro & { cnpjDisplay: string; cpfMasc: string; categoriaNome: string };

@Component({
  selector: 'app-fornecedores',
  templateUrl: './fornecedores.component.html',
  styleUrls: ['./fornecedores.component.sass'],
})
export class FornecedoresComponent implements OnInit {
  listaFornecedores = new MatTableDataSource<FornecedorLinha>([]);
  carregando = false;

  displayedColumns = [
    { coluna: 'cnpjDisplay', titulo: 'CNPJ' },
    { coluna: 'cpfMasc', titulo: 'CPF' },
    { coluna: 'razaoSocial', titulo: 'Razão Social' },
    { coluna: 'nomeFantasia', titulo: 'Nome Fantasia' },
    { coluna: 'telefone', titulo: 'Telefone' },
    { coluna: 'categoriaNome', titulo: 'Categoria padrão' },
    { coluna: 'cidade', titulo: 'Cidade' },
    { coluna: 'uf', titulo: 'UF' },
  ];

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService,
  ) {}

  ngOnInit() {
    this.carregar();
  }

  async carregar() {
    this.carregando = true;
    try {
      const dados = await listarFornecedores();
      this.listaFornecedores.data = (dados ?? []).map((f) => ({
        ...f,
        cnpjDisplay: f.cnpj || '-',
        cpfMasc: f.cpf || '-',
        categoriaNome: f.categoria?.nome ?? '-',
      }));
    } catch (error: any) {
      this.snackBar.open(error?.response?.data?.message || 'Erro ao carregar fornecedores.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  adicionar() {
    this.dialog
      .open(FornecedorFinanceiroDialogComponent, {
        width: '600px',
        data: null,
      })
      .afterClosed()
      .subscribe((atualizar) => {
        if (atualizar) this.carregar();
      });
  }

  private formatarCnpj(d: string): string {
    const x = String(d).replace(/\D/g, '');
    if (x.length !== 14) return d;
    return `${x.slice(0, 2)}.${x.slice(2, 5)}.${x.slice(5, 8)}/${x.slice(8, 12)}-${x.slice(12)}`;
  }

  editar(fornecedor: FornecedorLinha) {
    const { cnpjDisplay: _c, cpfMasc: _p, categoriaNome: _cat, ...rest } = fornecedor;
    this.dialog
      .open(FornecedorFinanceiroDialogComponent, {
        width: '600px',
        data: rest as FornecedorFinanceiro,
      })
      .afterClosed()
      .subscribe((atualizar) => {
        if (atualizar) this.carregar();
      });
  }

  excluir(fornecedor: FornecedorLinha) {
    this.dialog
      .open(ConfirmacaoDialogComponent, {
        width: '400px',
        data: {
          titulo: 'Excluir fornecedor',
          mensagem: `Deseja realmente desativar o fornecedor ${fornecedor.razaoSocial}?`,
        },
      })
      .afterClosed()
      .subscribe(async (confirmado) => {
        if (!confirmado) return;
        try {
          await excluirFornecedor(fornecedor.idFornecedor);
          this.snackBar.open('Fornecedor desativado.', 'Fechar', { duration: 3000 });
          this.carregar();
        } catch (error: any) {
          this.snackBar.open(error?.response?.data?.message || 'Erro ao desativar.', 'Fechar', { duration: 3000 });
        }
      });
  }
}
