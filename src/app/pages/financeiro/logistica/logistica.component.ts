import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { listarFornecedores, listarEntregas, FornecedorLogistica, Entrega, excluirFornecedor, atualizarStatusEntrega } from 'src/services/logistica.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { FornecedorDialogComponent } from './fornecedor-dialog/fornecedor-dialog.component';
import { EntregaDialogComponent } from './entrega-dialog/entrega-dialog.component';
import { DialogConfirmacaoExclusaoArquivoComponent } from 'src/app/components/dialog-confirmacao-exclusao-arquivo/dialog-confirmacao-exclusao-arquivo.component';

interface Empresa {
  idEmpresa: number;
  nome: string;
}

@Component({
  selector: 'app-logistica',
  templateUrl: './logistica.component.html',
  styleUrls: ['./logistica.component.sass']
})
export class LogisticaComponent implements OnInit, OnDestroy {
  listaFornecedores = new MatTableDataSource<FornecedorLogistica>([]);
  listaEntregas = new MatTableDataSource<Entrega>([]);
  empresas$ = new BehaviorSubject<Empresa[]>([]);
  fornecedores$ = new BehaviorSubject<FornecedorLogistica[]>([]);
  empresaFilter = new FormControl<number | null>(null);
  fornecedorFilter = new FormControl<number | null>(null);
  carregando = false;
  abaAtiva = 'fornecedores';

  displayedColumnsFornecedores = [
    { coluna: 'nome', titulo: 'Nome' },
    { coluna: 'tipo', titulo: 'Tipo' },
    { coluna: 'telefone', titulo: 'Telefone' },
    { coluna: 'email', titulo: 'Email' }
  ];

  displayedColumnsFornecedoresWithActions = [
    'nome',
    'tipo',
    'telefone',
    'email',
    'acoes'
  ];

  displayedColumnsEntregas = [
    { coluna: 'dataEntrega', titulo: 'Data', date: true },
    { coluna: 'fornecedor', titulo: 'Fornecedor' },
    { coluna: 'origem', titulo: 'Origem' },
    { coluna: 'destino', titulo: 'Destino' },
    { coluna: 'valorFrete', titulo: 'Valor Frete', price: 'BRL' },
    { coluna: 'status', titulo: 'Status' }
  ];

  displayedColumnsEntregasWithActions = [
    'dataEntrega',
    'fornecedor',
    'origem',
    'destino',
    'valorFrete',
    'status',
    'acoes'
  ];

  statusEntrega = [
    { nome: 'Pendente', valor: 'PENDENTE' },
    { nome: 'Em Trânsito', valor: 'EM_TRANSITO' },
    { nome: 'Entregue', valor: 'ENTREGUE' },
    { nome: 'Cancelada', valor: 'CANCELADA' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit() {
    this.loadEmpresas();
    this.carregarFornecedores();

    this.empresaFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.carregarFornecedores();
        this.fornecedorFilter.setValue(null);
      });

    this.fornecedorFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.abaAtiva === 'entregas') {
          this.carregarEntregas();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  async carregarFornecedores() {
    this.carregando = true;
    try {
      const response = await listarFornecedores(this.empresaFilter.value || undefined);
      this.listaFornecedores.data = response.data;
      this.fornecedores$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores', error);
      this.snackBar.open('Erro ao carregar fornecedores.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  async carregarEntregas() {
    this.carregando = true;
    try {
      const response = await listarEntregas(this.fornecedorFilter.value || undefined);
      // Mapear para incluir nome do fornecedor
      const entregasComFornecedor = response.data.map((ent: any) => ({
        ...ent,
        fornecedor: ent.fornecedorLogistica?.nome || 'N/A'
      }));
      this.listaEntregas.data = entregasComFornecedor;
    } catch (error) {
      console.error('Erro ao carregar entregas', error);
      this.snackBar.open('Erro ao carregar entregas.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  mudarAba(aba: string) {
    this.abaAtiva = aba;
    if (aba === 'entregas') {
      this.carregarEntregas();
    }
  }

  adicionarFornecedor() {
    this.dialog.open(FornecedorDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarFornecedores();
      }
    });
  }

  editarFornecedor(fornecedor: FornecedorLogistica) {
    this.dialog.open(FornecedorDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: fornecedor
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarFornecedores();
      }
    });
  }

  excluirFornecedor(fornecedor: FornecedorLogistica) {
    this.dialog.open(DialogConfirmacaoExclusaoArquivoComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Exclusão',
        mensagem: `Deseja realmente excluir o fornecedor ${fornecedor.nome}?`
      }
    }).afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        try {
          await excluirFornecedor(fornecedor.idFornecedorLogistica);
          this.snackBar.open('Fornecedor excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.carregarFornecedores();
        } catch (error) {
          console.error('Erro ao excluir fornecedor', error);
          this.snackBar.open('Erro ao excluir fornecedor.', 'Fechar', { duration: 3000 });
        }
      }
    });
  }

  adicionarEntrega() {
    this.dialog.open(EntregaDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: { idFornecedorLogistica: this.fornecedorFilter.value || undefined }
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarEntregas();
      }
    });
  }

  async atualizarStatus(entrega: Entrega, novoStatus: string) {
    try {
      await atualizarStatusEntrega(entrega.idEntrega, novoStatus);
      this.snackBar.open('Status da entrega atualizado com sucesso!', 'Fechar', { duration: 3000 });
      this.carregarEntregas();
    } catch (error) {
      console.error('Erro ao atualizar status da entrega', error);
      this.snackBar.open('Erro ao atualizar status da entrega.', 'Fechar', { duration: 3000 });
    }
  }

  obterProximoStatus(entrega: Entrega): string | null {
    switch (entrega.status) {
      case 'PENDENTE':
        return 'EM_TRANSITO';
      case 'EM_TRANSITO':
        return 'ENTREGUE';
      default:
        return null;
    }
  }

  podeConfirmarFrete(entrega: Entrega): boolean {
    return entrega.status === 'PENDENTE';
  }

  podeMarcarEntregue(entrega: Entrega): boolean {
    return entrega.status === 'EM_TRANSITO';
  }
}

