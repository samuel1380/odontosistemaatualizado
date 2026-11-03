import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChartConfiguration } from 'chart.js';

export interface WaterfallDialogData {
  mes: string;
  receitaOperacional: number;
  custoVariavel: number;
  custoFixo: number;
  ebitdaAbsoluto: number;
}

@Component({
  selector: 'app-waterfall-chart-dialog',
  templateUrl: './waterfall-chart-dialog.component.html',
  styleUrls: ['./waterfall-chart-dialog.component.sass']
})
export class WaterfallChartDialogComponent implements OnInit {
  
  public chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  public chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw as [number, number];
            if (Array.isArray(raw)) {
              const val = Math.abs(raw[1] - raw[0]);
              return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            const valNum = context.raw as number;
            return `R$ ${valNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Valores (R$)',
          font: { weight: 'bold' }
        }
      }
    }
  };

  constructor(
    public dialogRef: MatDialogRef<WaterfallChartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WaterfallDialogData
  ) {}

  ngOnInit(): void {
    const { receitaOperacional, custoVariavel, custoFixo, ebitdaAbsoluto } = this.data;
    
    // Calcula as "quedas" (pontos iniciais e finais de cada barra)
    // Receita: de 0 até Receita
    const receitaBar = [0, receitaOperacional];
    
    // Custos Variáveis: de (Receita - Var) até Receita
    const varStart = receitaOperacional - custoVariavel;
    const varBar = [varStart, receitaOperacional];
    
    // Custos Fixos: de (Receita - Var - Fixo) até (Receita - Var)
    const fixoStart = varStart - custoFixo;
    const fixoBar = [fixoStart, varStart];

    // EBITDA: de 0 até EBITDA
    const ebitdaBar = [0, ebitdaAbsoluto];

    this.chartData = {
      labels: ['Receita Operacional', 'Despesas Variáveis', 'Despesas Fixas', 'EBITDA'],
      datasets: [
        {
          data: [receitaBar, varBar, fixoBar, ebitdaBar] as unknown as number[], // Usamos casting pois o Chart.js tipa como number[], mas suporta [number, number] para floating bars
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)', // Verde para Receita
            'rgba(239, 68, 68, 0.7)',  // Vermelho para Despesa Variável
            'rgba(239, 68, 68, 0.7)',  // Vermelho para Despesa Fixa
            'rgba(59, 130, 246, 0.7)', // Azul para EBITDA
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(59, 130, 246, 1)',
          ],
          borderWidth: 1,
          barPercentage: 0.6
        }
      ]
    };
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
