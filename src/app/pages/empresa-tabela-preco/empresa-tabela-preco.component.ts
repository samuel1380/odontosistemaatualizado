import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { buscarAssociacoesPorEmpresa } from 'src/services/empresaTabelaPreco.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-empresa-tabela-preco',
  templateUrl: './empresa-tabela-preco.component.html',
  styleUrls: ['./empresa-tabela-preco.component.sass']
})
export class EmpresaTabelaPrecoComponent {
  associacoes: any[] = [];
  empresas: any[] = [];
  associacoesFiltradas = new MatTableDataSource<any>([]);
  empresaFiltroControl = new FormControl<number | null>(null);

  displayedColumns = [
    { coluna: 'empresaNome', titulo: 'Empresa' },
    { coluna: 'tabelaNome', titulo: 'Tabela de Preço' },
    { coluna: 'dataInicio', titulo: 'Data Início' },
    { coluna: 'dataFim', titulo: 'Data Fim' },
    { coluna: 'status', titulo: 'Status' },
    { coluna: 'acoes', titulo: 'Ações' }
  ];

  displayedColumnsKeys: string[] = ['empresaNome', 'tabelaNome', 'dataInicio', 'dataFim', 'status', 'acoes'];

  constructor(private router: Router) {
    this.empresaFiltroControl.valueChanges.subscribe(() => {
      this.aplicarFiltro();
    });
    this.carregarDados();
  }

  async carregarDados() {
    try {
      // Carregar empresas
      const empresasResponse = await buscarEmpresas();
      if (empresasResponse.status === 200) {
        this.empresas = empresasResponse.data;
      }

      // Carregar todas as associações (agrupadas por empresa)
      const todasAssociacoes: any[] = [];
      for (const empresa of this.empresas) {
        try {
          const response = await buscarAssociacoesPorEmpresa(empresa.idEmpresa);
          if (response.status === 200 && response.data) {
            const associacoesEmpresa = Array.isArray(response.data) ? response.data : [response.data];
            associacoesEmpresa.forEach((assoc: any) => {
              todasAssociacoes.push({
                ...assoc,
                empresaNome: empresa.nomeFantasia || empresa.nome,
                tabelaNome: assoc.tabelaPrecoProduto?.nome || 'N/A'
              });
            });
          }
        } catch (error) {
          console.error(`Erro ao carregar associações da empresa ${empresa.idEmpresa}:`, error);
        }
      }

      this.associacoes = todasAssociacoes;
      this.aplicarFiltro();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  aplicarFiltro() {
    let dadosFiltrados = [...this.associacoes];

    const empresaFiltro = this.empresaFiltroControl.value;
    if (empresaFiltro) {
      dadosFiltrados = dadosFiltrados.filter(a => a.idEmpresa === empresaFiltro);
    }

    this.associacoesFiltradas.data = dadosFiltrados;
  }

  calcularStatus(associacao: any): string {
    // Usar UTC para evitar problemas de timezone
    const hoje = new Date();
    const hojeUTC = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate(), 0, 0, 0, 0));

    let dataInicioUTC: Date | null = null;
    let dataFimUTC: Date | null = null;

    if (associacao.dataInicio) {
      const dataInicio = associacao.dataInicio;
      if (typeof dataInicio === 'string') {
        const match = dataInicio.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const ano = parseInt(match[1], 10);
          const mes = parseInt(match[2], 10) - 1;
          const dia = parseInt(match[3], 10);
          dataInicioUTC = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
        } else {
          const d = new Date(dataInicio);
          dataInicioUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
        }
      } else {
        const d = new Date(dataInicio);
        dataInicioUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      }
    }

    if (associacao.dataFim) {
      const dataFim = associacao.dataFim;
      if (typeof dataFim === 'string') {
        const match = dataFim.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const ano = parseInt(match[1], 10);
          const mes = parseInt(match[2], 10) - 1;
          const dia = parseInt(match[3], 10);
          dataFimUTC = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
        } else {
          const d = new Date(dataFim);
          dataFimUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
        }
      } else {
        const d = new Date(dataFim);
        dataFimUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      }
    }

    if (!dataInicioUTC) {
      return 'Indefinido';
    }

    if (hojeUTC < dataInicioUTC) {
      return 'Futura';
    }

    if (dataFimUTC) {
      if (hojeUTC > dataFimUTC) {
        return 'Expirada';
      }

      const diasRestantes = Math.ceil((dataFimUTC.getTime() - hojeUTC.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 30) {
        if (diasRestantes === 0) {
          return 'Vence hoje';
        }
        return `Vence em ${diasRestantes} dias`;
      }
    }

    return 'Vigente';
  }

  formatarData(data: string | Date | null): string {
    if (!data) return 'Vigente indefinidamente';
    
    // Garantir que a data seja tratada em UTC para evitar problemas de timezone
    let dataDate: Date;
    if (typeof data === 'string') {
      // Se for string, extrair apenas a parte da data (YYYY-MM-DD)
      const match = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const ano = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1; // Mês é 0-indexed
        const dia = parseInt(match[3], 10);
        dataDate = new Date(Date.UTC(ano, mes, dia));
      } else {
        dataDate = new Date(data);
      }
    } else {
      dataDate = data;
    }
    
    // Usar métodos UTC para formatar
    const ano = dataDate.getUTCFullYear();
    const mes = String(dataDate.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(dataDate.getUTCDate()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano}`;
  }

  abrirCadastro() {
    this.router.navigate(['/l/empresa-tabela-preco/cadastro']);
  }

  abrirEdicao(associacao: any) {
    this.router.navigate([`/l/empresa-tabela-preco/edit/${associacao.idEmpresaTabelaPreco}`]);
  }

  async desativarAssociacao(event: Event, associacao: any) {
    event.stopPropagation();
    if (confirm(`Deseja realmente desativar a associação da empresa "${associacao.empresaNome}" com a tabela "${associacao.tabelaNome}"?`)) {
      try {
        const { desativarAssociacao } = await import('src/services/empresaTabelaPreco.service');
        await desativarAssociacao(associacao.idEmpresaTabelaPreco);
        alert('Associação desativada com sucesso!');
        this.carregarDados();
      } catch (error: any) {
        console.error('Erro ao desativar associação:', error);
        alert('Erro ao desativar associação. Tente novamente.');
      }
    }
  }
}
