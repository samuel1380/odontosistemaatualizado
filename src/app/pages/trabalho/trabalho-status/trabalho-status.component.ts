import { Component, OnInit, NgZone } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { buscarDashboardStatus } from 'src/services/trabalho.service';

@Component({
  selector: 'app-trabalho-status',
  templateUrl: './trabalho-status.component.html',
  styleUrls: ['./trabalho-status.component.sass']
})
export class TrabalhoStatusComponent implements OnInit {
  dataInicio!: Date;
  dataFim!: Date;
  loading = false;

  totalTrabalhos = 0;
  totalRetrabalhos = 0;
  totalBonificacoes = 0;
  taxaRetrabalho = 0;
  taxaBonificacao = 0;

  clinicas: any[] = [];
  displayedColumns: string[] = ['empresa', 'total', 'retrabalho', 'bonificacao', 'taxa', 'motivos'];

  // Status chart
  statusChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  statusChartOptions: ChartConfiguration['options'] = { responsive: true };
  
  // Rework timeline chart
  timelineChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  timelineChartOptions: ChartConfiguration['options'] = { responsive: true };

  // ========================
  // RETRABALHO
  // ========================
  companyRetrabalhoChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  companyRetrabalhoChartOptions: ChartConfiguration['options'] = { 
    responsive: true,
    onClick: (event, elements, chart) => {
      if (elements && elements.length > 0) {
        const dataIndex = elements[0].index;
        this.ngZone.run(() => {
          this.selecionarClinicaRetrabalhoByIndex(dataIndex);
        });
      }
    }
  };

  motivesRetrabalhoChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  motivesRetrabalhoChartOptions: ChartConfiguration['options'] = { responsive: true };

  motivosGeraisRetrabalhoOriginais: any[] = [];
  selectedClinicaRetrabalho: any = null;
  isFilteringRetrabalho = false;

  // ========================
  // BONIFICAÇÃO
  // ========================
  companyBonificacaoChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  companyBonificacaoChartOptions: ChartConfiguration['options'] = { 
    responsive: true,
    onClick: (event, elements, chart) => {
      if (elements && elements.length > 0) {
        const dataIndex = elements[0].index;
        this.ngZone.run(() => {
          this.selecionarClinicaBonificacaoByIndex(dataIndex);
        });
      }
    }
  };

  motivesBonificacaoChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  motivesBonificacaoChartOptions: ChartConfiguration['options'] = { responsive: true };

  motivosGeraisBonificacaoOriginais: any[] = [];
  selectedClinicaBonificacao: any = null;
  isFilteringBonificacao = false;

  // Compatibilidade (legado) — não utilizados diretamente na view nova
  companyChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  companyChartOptions: ChartConfiguration['options'] = { responsive: true };
  motivesChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  motivesChartOptions: ChartConfiguration['options'] = { responsive: true };
  motivosGeraisOriginais: any[] = [];
  selectedClinica: any = null;
  isFiltering = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    const today = new Date();
    this.dataFim = new Date(today);
    this.dataInicio = new Date(today.setDate(today.getDate() - 30));
    
    this.buscarDados();
  }

  async buscarDados() {
    this.loading = true;
    this.selectedClinicaRetrabalho = null;
    this.selectedClinicaBonificacao = null;

    try {
      const response = await buscarDashboardStatus(this.dataInicio, this.dataFim);
      const res = response.data;

      this.totalTrabalhos = res.totalTrabalhos;
      this.totalRetrabalhos = res.totalRetrabalhos;
      this.totalBonificacoes = res.totalBonificacoes || 0;
      this.taxaRetrabalho = this.totalTrabalhos > 0 ? (this.totalRetrabalhos / this.totalTrabalhos) * 100 : 0;
      this.taxaBonificacao = this.totalTrabalhos > 0 ? (this.totalBonificacoes / this.totalTrabalhos) * 100 : 0;

      this.clinicas = res.clinicas;

      // Populate Status Chart
      const statusLabels = Object.keys(res.statusGeral);
      const statusValues = Object.values(res.statusGeral) as number[];
      this.statusChartData = {
        labels: statusLabels,
        datasets: [{ data: statusValues }]
      };

      // Populate Timeline Chart
      const dates = Object.keys(res.trabalhosPorData).sort();
      const timelineTotals = dates.map(d => res.trabalhosPorData[d].total);
      const timelineReworks = dates.map(d => res.trabalhosPorData[d].retrabalho);
      const timelineBonificacoes = dates.map(d => res.trabalhosPorData[d].bonificacao || 0);
      
      this.timelineChartData = {
        labels: dates,
        datasets: [
          { data: timelineTotals, label: 'Trabalhos' },
          { data: timelineReworks, label: 'Retrabalhos', backgroundColor: '#f44336' },
          { data: timelineBonificacoes, label: 'Bonificações', backgroundColor: '#ff9800' }
        ]
      };

      // ========================
      // RETRABALHO — Company Chart
      // ========================
      const clinicasComRetrabalho = this.clinicas.filter(c => c.totalRetrabalhos > 0);
      this.companyRetrabalhoChartData = {
        labels: clinicasComRetrabalho.map(c => c.nomeEmpresa),
        datasets: [
          { data: clinicasComRetrabalho.map(c => c.totalRetrabalhos), label: 'Retrabalhos por Empresa', backgroundColor: '#f44336' }
        ]
      };

      this.motivosGeraisRetrabalhoOriginais = res.motivosGeraisRetrabalho || res.motivosGerais || [];
      this.atualizarGraficoMotivosRetrabalho();

      // ========================
      // BONIFICAÇÃO — Company Chart
      // ========================
      const clinicasComBonificacao = this.clinicas.filter(c => c.totalBonificacoes > 0);
      this.companyBonificacaoChartData = {
        labels: clinicasComBonificacao.map(c => c.nomeEmpresa),
        datasets: [
          { data: clinicasComBonificacao.map(c => c.totalBonificacoes), label: 'Bonificações por Empresa', backgroundColor: '#ff9800' }
        ]
      };

      this.motivosGeraisBonificacaoOriginais = res.motivosGeraisBonificacao || [];
      this.atualizarGraficoMotivosBonificacao();

      this.loading = false;
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  // ========================
  // RETRABALHO — click handlers
  // ========================
  selecionarClinicaRetrabalhoByIndex(index: number) {
    const clinicasComRetrabalho = this.clinicas.filter(c => c.totalRetrabalhos > 0);
    if (clinicasComRetrabalho[index]) {
      this.isFilteringRetrabalho = true;
      this.selectedClinicaRetrabalho = clinicasComRetrabalho[index];
      this.atualizarGraficoMotivosRetrabalho();
      setTimeout(() => { this.isFilteringRetrabalho = false; }, 50);
    }
  }

  limparFiltroClinicaRetrabalho() {
    this.isFilteringRetrabalho = true;
    this.selectedClinicaRetrabalho = null;
    this.atualizarGraficoMotivosRetrabalho();
    setTimeout(() => { this.isFilteringRetrabalho = false; }, 50);
  }

  atualizarGraficoMotivosRetrabalho() {
    let motivosParaExibir = [];
    if (this.selectedClinicaRetrabalho) {
      motivosParaExibir = this.selectedClinicaRetrabalho.motivosRetrabalhoArray || this.selectedClinicaRetrabalho.motivosArray || [];
    } else {
      motivosParaExibir = this.motivosGeraisRetrabalhoOriginais;
    }

    this.motivesRetrabalhoChartData = {
      labels: motivosParaExibir.map((m: any) => m.nome),
      datasets: [{ data: motivosParaExibir.map((m: any) => m.count) }]
    };
  }

  // ========================
  // BONIFICAÇÃO — click handlers
  // ========================
  selecionarClinicaBonificacaoByIndex(index: number) {
    const clinicasComBonificacao = this.clinicas.filter(c => c.totalBonificacoes > 0);
    if (clinicasComBonificacao[index]) {
      this.isFilteringBonificacao = true;
      this.selectedClinicaBonificacao = clinicasComBonificacao[index];
      this.atualizarGraficoMotivosBonificacao();
      setTimeout(() => { this.isFilteringBonificacao = false; }, 50);
    }
  }

  limparFiltroClinicaBonificacao() {
    this.isFilteringBonificacao = true;
    this.selectedClinicaBonificacao = null;
    this.atualizarGraficoMotivosBonificacao();
    setTimeout(() => { this.isFilteringBonificacao = false; }, 50);
  }

  atualizarGraficoMotivosBonificacao() {
    let motivosParaExibir = [];
    if (this.selectedClinicaBonificacao) {
      motivosParaExibir = this.selectedClinicaBonificacao.motivosBonificacaoArray || [];
    } else {
      motivosParaExibir = this.motivosGeraisBonificacaoOriginais;
    }

    this.motivesBonificacaoChartData = {
      labels: motivosParaExibir.map((m: any) => m.nome),
      datasets: [{ data: motivosParaExibir.map((m: any) => m.count) }]
    };
  }

  // ========================
  // Legado (compatibilidade)
  // ========================
  selecionarClinicaByIndex(index: number) {
    this.selecionarClinicaRetrabalhoByIndex(index);
  }

  limparFiltroClinica() {
    this.limparFiltroClinicaRetrabalho();
  }

  atualizarGraficoMotivos() {
    this.atualizarGraficoMotivosRetrabalho();
  }
}
