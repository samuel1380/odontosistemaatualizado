import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { obterDashboard, DashboardFinanceiro } from 'src/services/financeiro.dashboard.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';

interface Empresa {
  idEmpresa: number;
  nome: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboard: DashboardFinanceiro | null = null;
  empresas$ = new BehaviorSubject<Empresa[]>([]);
  empresaFilter = new FormControl<number | null>(null);
  mesFilter = new FormControl<number>(new Date().getMonth() + 1);
  anoFilter = new FormControl<number>(new Date().getFullYear());
  carregando = false;
  movimentacoesDataSource = new MatTableDataSource<any>([]);

  displayedColumnsMovimentacoes = [
    { coluna: 'dataMovimentacao', titulo: 'Data', date: true },
    { coluna: 'descricao', titulo: 'Descrição' },
    { coluna: 'tipo', titulo: 'Tipo' },
    { coluna: 'valor', titulo: 'Valor', price: 'BRL' }
  ];

  listaMeses = [
    { nome: "Janeiro", id: 1 },
    { nome: "Fevereiro", id: 2 },
    { nome: "Março", id: 3 },
    { nome: "Abril", id: 4 },
    { nome: "Maio", id: 5 },
    { nome: "Junho", id: 6 },
    { nome: "Julho", id: 7 },
    { nome: "Agosto", id: 8 },
    { nome: "Setembro", id: 9 },
    { nome: "Outubro", id: 10 },
    { nome: "Novembro", id: 11 },
    { nome: "Dezembro", id: 12 },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit() {
    this.loadEmpresas();
    this.carregarDashboard();

    this.empresaFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarDashboard());

    this.mesFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarDashboard());

    this.anoFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarDashboard());
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

  async carregarDashboard() {
    this.carregando = true;
    try {
      const response = await obterDashboard(
        this.empresaFilter.value || undefined,
        this.mesFilter.value || undefined,
        this.anoFilter.value || undefined
      );
      this.dashboard = response.data;
      if (this.dashboard?.movimentacoesRecentes) {
        this.movimentacoesDataSource.data = this.dashboard.movimentacoesRecentes;
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
      this.snackBar.open('Erro ao carregar dados do dashboard.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }
}

