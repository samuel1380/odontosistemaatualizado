import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { listarVeiculos, listarAbastecimentos, Veiculo, Abastecimento, excluirVeiculo, listarPagamentosKm, obterConfiguracaoKm } from 'src/services/combustivel.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { VeiculoDialogComponent } from './veiculo-dialog/veiculo-dialog.component';
import { AbastecimentoDialogComponent } from './abastecimento-dialog/abastecimento-dialog.component';
import { ConfiguracaoKmDialogComponent } from './configuracao-km-dialog/configuracao-km-dialog.component';
import { PagamentoKmDialogComponent } from './pagamento-km-dialog/pagamento-km-dialog.component';
import { DialogConfirmacaoExclusaoArquivoComponent } from 'src/app/components/dialog-confirmacao-exclusao-arquivo/dialog-confirmacao-exclusao-arquivo.component';

@Component({
  selector: 'app-combustivel',
  templateUrl: './combustivel.component.html',
  styleUrls: ['./combustivel.component.sass']
})
export class CombustivelComponent implements OnInit, OnDestroy {
  listaVeiculos = new MatTableDataSource<Veiculo>([]);
  listaAbastecimentos = new MatTableDataSource<Abastecimento>([]);
  veiculos$ = new BehaviorSubject<Veiculo[]>([]);
  veiculoFilter = new FormControl<number | null>(null);
  carregando = false;
  abaAtiva = 'veiculos';

  displayedColumnsVeiculos = [
    { coluna: 'nome', titulo: 'Nome' }
  ];

  displayedColumnsVeiculosWithActions = [
    'nome',
    'acoes'
  ];

  displayedColumnsAbastecimentos = [
    { coluna: 'dataAbastecimento', titulo: 'Data', date: true },
    { coluna: 'veiculo', titulo: 'Veículo' },
    { coluna: 'litros', titulo: 'Litros' },
    { coluna: 'valorLitro', titulo: 'Valor/Litro', price: 'BRL' },
    { coluna: 'valorTotal', titulo: 'Valor Total', price: 'BRL' },
    { coluna: 'quilometragem', titulo: 'Quilometragem' }
  ];

  listaPagamentosKm = new MatTableDataSource<any>([]);
  configuracaoKm: any = null;
  displayedColumnsPagamentosKm = [
    { coluna: 'dataPagamento', titulo: 'Data', date: true },
    { coluna: 'nomePessoa', titulo: 'Pessoa' },
    { coluna: 'quantidadeKm', titulo: 'KM' },
    { coluna: 'valorPorKm', titulo: 'Valor/KM', price: 'BRL' },
    { coluna: 'valorTotal', titulo: 'Valor Total', price: 'BRL' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit() {
    this.carregarVeiculos();

    this.veiculoFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.abaAtiva === 'abastecimentos') {
          this.carregarAbastecimentos();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async carregarVeiculos() {
    this.carregando = true;
    try {
      const response = await listarVeiculos();
      this.listaVeiculos.data = response.data;
      this.veiculos$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar veículos', error);
      this.snackBar.open('Erro ao carregar veículos.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  async carregarAbastecimentos() {
    this.carregando = true;
    try {
      const response = await listarAbastecimentos(this.veiculoFilter.value || undefined);
      // Mapear para incluir nome do veículo
      const abastecimentosComVeiculo = response.data.map((ab: any) => ({
        ...ab,
        veiculo: ab.veiculo?.nome || 'N/A'
      }));
      this.listaAbastecimentos.data = abastecimentosComVeiculo;
    } catch (error) {
      console.error('Erro ao carregar abastecimentos', error);
      this.snackBar.open('Erro ao carregar abastecimentos.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  mudarAba(aba: string) {
    this.abaAtiva = aba;
    if (aba === 'abastecimentos') {
      this.carregarAbastecimentos();
    } else if (aba === 'pagamentos-km') {
      this.carregarPagamentosKm();
      this.carregarConfiguracaoKm();
    }
  }

  async carregarPagamentosKm() {
    this.carregando = true;
    try {
      const response = await listarPagamentosKm();
      this.listaPagamentosKm.data = response.data || [];
    } catch (error) {
      console.error('Erro ao carregar pagamentos de KM', error);
      this.snackBar.open('Erro ao carregar pagamentos de KM.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  async carregarConfiguracaoKm() {
    try {
      const response = await obterConfiguracaoKm();
      this.configuracaoKm = response.data;
    } catch (error) {
      console.error('Erro ao carregar configuração de KM', error);
      this.configuracaoKm = null;
    }
  }

  adicionarVeiculo() {
    this.dialog.open(VeiculoDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarVeiculos();
      }
    });
  }

  editarVeiculo(veiculo: Veiculo) {
    this.dialog.open(VeiculoDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: veiculo
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarVeiculos();
      }
    });
  }

  excluirVeiculo(veiculo: Veiculo) {
    this.dialog.open(DialogConfirmacaoExclusaoArquivoComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Exclusão',
        mensagem: `Deseja realmente excluir o veículo ${veiculo.nome}?`
      }
    }).afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        try {
          await excluirVeiculo(veiculo.idVeiculo);
          this.snackBar.open('Veículo excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.carregarVeiculos();
        } catch (error) {
          console.error('Erro ao excluir veículo', error);
          this.snackBar.open('Erro ao excluir veículo.', 'Fechar', { duration: 3000 });
        }
      }
    });
  }

  adicionarAbastecimento() {
    this.dialog.open(AbastecimentoDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: { idVeiculo: this.veiculoFilter.value || undefined }
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarAbastecimentos();
      }
    });
  }

  abrirConfiguracaoKm() {
    this.dialog.open(ConfiguracaoKmDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: this.configuracaoKm
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarConfiguracaoKm();
      }
    });
  }

  adicionarPagamentoKm() {
    this.dialog.open(PagamentoKmDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: { configuracaoKm: this.configuracaoKm }
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarPagamentosKm();
      }
    });
  }
}

