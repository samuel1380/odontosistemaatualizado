import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

export interface PontoEquilibrioDialogData {
  mes: string;
  receitaOperacional: number;
  custoFixo: number;
  custoVariavel: number;
  indiceContribuicao: number;
  pontoEquilibrio: number;
}

@Component({
  selector: 'app-ponto-equilibrio-chart-dialog',
  templateUrl: './ponto-equilibrio-chart-dialog.component.html',
  styleUrls: ['./ponto-equilibrio-chart-dialog.component.sass']
})
export class PontoEquilibrioChartDialogComponent implements OnInit {
  
  public chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y || 0;
            return `${label}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
          title: (context) => {
            if (context[0]) {
              return `Faturamento: R$ ${Number(context[0].label).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Faturamento (R$)',
          font: { weight: 'bold' }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Valores (R$)',
          font: { weight: 'bold' }
        },
        beginAtZero: true
      }
    }
  };

  constructor(
    public dialogRef: MatDialogRef<PontoEquilibrioChartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PontoEquilibrioDialogData
  ) {}

  ngOnInit(): void {
    const { custoFixo, pontoEquilibrio, receitaOperacional, custoVariavel } = this.data;
    
    // Percentual do custo variável em relação à receita
    const pctCustoVariavel = receitaOperacional > 0 ? (custoVariavel / receitaOperacional) : 0;

    // Pontos do Eixo X: 0, Ponto de Equilíbrio, e 2x o Ponto de Equilíbrio (ou Receita se for maior)
    const maxX = Math.max(pontoEquilibrio * 2, receitaOperacional * 1.5, 1000);
    
    const xLabels = [0, pontoEquilibrio, maxX];

    // Calculando os pontos no Eixo Y para cada linha
    const incomeData = [0, pontoEquilibrio, maxX];
    const fixedCostData = [custoFixo, custoFixo, custoFixo];
    const totalCostData = [
      custoFixo, 
      custoFixo + (pctCustoVariavel * pontoEquilibrio), 
      custoFixo + (pctCustoVariavel * maxX)
    ];

    this.chartData = {
      labels: xLabels, // x-axis labels
      datasets: [
        {
          label: 'Receita (Income)',
          data: incomeData,
          borderColor: '#10b981', // green
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: 2, // Fills to the total cost line to show profit (if higher)
          tension: 0,
          borderWidth: 2
        },
        {
          label: 'Custo Total (Total Cost)',
          data: totalCostData,
          borderColor: '#ef4444', // red
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          fill: '-1', // Fill down to the axis to show loss area
          tension: 0,
          borderWidth: 2
        },
        {
          label: 'Custo Fixo (Fixed Cost)',
          data: fixedCostData,
          borderColor: '#6b7280', // gray
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          borderWidth: 1
        }
      ]
    };
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
