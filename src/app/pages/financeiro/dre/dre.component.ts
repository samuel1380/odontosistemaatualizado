import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PontoEquilibrioChartDialogComponent } from './ponto-equilibrio-chart-dialog/ponto-equilibrio-chart-dialog.component';
import { WaterfallChartDialogComponent } from './waterfall-chart-dialog/waterfall-chart-dialog.component';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { buscarDre, DreLinha, DreResponse } from '../../../../services/financeiro.dre.service';

export interface DreGrupoLinhas {
  pai: DreLinha;
  filhos: DreLinha[];
}

@Component({
  selector: 'app-dre',
  templateUrl: './dre.component.html',
  styleUrl: './dre.component.sass',
})
export class DreComponent {
  regimeControl = new FormControl<'competencia' | 'caixa'>('competencia');
  analiseControl = new FormControl<'nenhuma' | 'vertical' | 'horizontal'>('nenhuma', { nonNullable: true });
  anoDeControl = new FormControl<number>(new Date().getFullYear());
  mesDeControl = new FormControl<number>(1);
  anoAteControl = new FormControl<number>(new Date().getFullYear());
  mesAteControl = new FormControl<number>(new Date().getMonth() + 1);

  listaAnos = [2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022].map((id) => ({ nome: String(id), id }));
  listaMeses = [
    { nome: 'Janeiro', id: 1 }, { nome: 'Fevereiro', id: 2 }, { nome: 'Março', id: 3 }, { nome: 'Abril', id: 4 },
    { nome: 'Maio', id: 5 }, { nome: 'Junho', id: 6 }, { nome: 'Julho', id: 7 }, { nome: 'Agosto', id: 8 },
    { nome: 'Setembro', id: 9 }, { nome: 'Outubro', id: 10 }, { nome: 'Novembro', id: 11 }, { nome: 'Dezembro', id: 12 },
  ];

  dre: DreResponse | null = null;
  carregando = false;
  erro: string | null = null;

  /** Pais com subcategorias abertas no acordeão (chave = keyPai). Início: nenhum (fechado). */
  private expandedPaiKeys = new Set<string>();

  constructor(
    public themeService: CustomizerSettingsService,
    public dialog: MatDialog
  ) {}

  get gruposDre(): DreGrupoLinhas[] {
    if (!this.dre?.linhas?.length) return [];
    const grupos: DreGrupoLinhas[] = [];
    let atual: DreGrupoLinhas | null = null;
    for (const row of this.dre.linhas) {
      if (row.nivel === 0) {
        atual = { pai: row, filhos: [] };
        grupos.push(atual);
      } else if (row.nivel === 1 && atual) {
        atual.filhos.push(row);
      } else {
        atual = { pai: row, filhos: [] };
        grupos.push(atual);
      }
    }
    return grupos;
  }

  private keyPai(row: DreLinha): string {
    return `${row.idCategoria ?? 'null'}_${row.tipo}_${row.nomeCategoria}`;
  }

  isPaiExpanded(pai: DreLinha): boolean {
    return this.expandedPaiKeys.has(this.keyPai(pai));
  }

  togglePai(pai: DreLinha): void {
    const k = this.keyPai(pai);
    if (this.expandedPaiKeys.has(k)) {
      this.expandedPaiKeys.delete(k);
    } else {
      this.expandedPaiKeys.add(k);
    }
  }

  /** Acordeão inicia fechado; o usuário expande ao clicar. */
  private initExpandedPai(): void {
    this.expandedPaiKeys.clear();
  }

  get mesesSelecionados(): number {
    const anoDe = this.anoDeControl.value ?? 0;
    const mesDe = this.mesDeControl.value ?? 1;
    const anoAte = this.anoAteControl.value ?? 0;
    const mesAte = this.mesAteControl.value ?? 1;
    if (anoAte < anoDe) return 0;
    if (anoAte === anoDe && mesAte < mesDe) return 0;
    let count = 0;
    let a = anoDe;
    let m = mesDe;
    while (a < anoAte || (a === anoAte && m <= mesAte)) {
      count++;
      m++;
      if (m > 12) {
        m = 1;
        a++;
      }
    }
    return count;
  }

  limpar(): void {
    this.regimeControl.setValue('competencia');
    const ano = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    this.anoDeControl.setValue(ano);
    this.mesDeControl.setValue(1);
    this.anoAteControl.setValue(ano);
    this.mesAteControl.setValue(mes);
    this.dre = null;
    this.erro = null;
    this.expandedPaiKeys.clear();
  }

  pesquisar(): void {
    const anoDe = this.anoDeControl.value;
    const mesDe = this.mesDeControl.value;
    const anoAte = this.anoAteControl.value;
    const mesAte = this.mesAteControl.value;
    if (anoDe == null || mesDe == null || anoAte == null || mesAte == null) {
      this.erro = 'Informe o período (De e Até).';
      return;
    }
    const dataInicio = `${anoDe}-${String(mesDe).padStart(2, '0')}`;
    const dataFim = `${anoAte}-${String(mesAte).padStart(2, '0')}`;
    if (anoAte < anoDe || (anoAte === anoDe && mesAte < mesDe)) {
      this.erro = 'A data "Até" deve ser igual ou posterior à data "De".';
      return;
    }
    this.erro = null;
    this.carregando = true;
    this.dre = null;

    buscarDre({
      dataInicio,
      dataFim,
      regime: this.regimeControl.value ?? 'competencia',
    })
      .then((res) => {
        if (res.status === 200 && res.data) {
          this.dre = res.data as DreResponse;
          this.initExpandedPai();
        } else {
          this.erro = 'Não foi possível carregar o DRE.';
        }
      })
      .catch(() => {
        this.erro = 'Erro ao buscar DRE. Tente novamente.';
      })
      .finally(() => {
        this.carregando = false;
      });
  }

  formatarMes(mesAno: string): string {
    const [mes, ano] = mesAno.split('/');
    const m = parseInt(mes, 10);
    const item = this.listaMeses.find((x) => x.id === m);
    if (item) return `${item.nome.substring(0, 3)}/${ano}`;
    return mesAno;
  }

  totalGeralPorMes(obj: Record<string, number>): number {
    if (!this.dre?.meses?.length) return 0;
    return this.dre.meses.reduce((acc, m) => acc + (obj[m] ?? 0), 0);
  }

  totalGeralIndiceContribuicao(): number {
    if (!this.dre) return 0;
    const receitaTotal = this.totalGeralPorMes(this.dre.totaisReceitaOperacionalPorMes);
    const margemTotal = this.totalGeralPorMes(this.dre.margemContribuicaoPorMes);
    if (receitaTotal > 0) {
      return (margemTotal / receitaTotal) * 100;
    }
    return 0;
  }

  totalGeralEbitda(): number {
    if (!this.dre) return 0;
    const receitaTotal = this.totalGeralPorMes(this.dre.totaisReceitaOperacionalPorMes);
    const lucroOperacionalTotal = this.totalGeralPorMes(this.dre.resultadoOperacionalPorMes);
    if (receitaTotal > 0) {
      return (lucroOperacionalTotal / receitaTotal) * 100;
    }
    return 0;
  }

  totalGeralEbitdaAjustado(): number {
    if (!this.dre) return 0;
    
    const receitaTotal = this.totalGeralPorMes(this.dre.totaisReceitaOperacionalPorMes);
    const parcelasVencidasTotal = this.totalGeralPorMes(this.dre.totaisParcelasVencidasPorMes || {});
    const receitaAjustada = receitaTotal + parcelasVencidasTotal;
    
    const lucroOperacionalTotal = this.totalGeralPorMes(this.dre.resultadoOperacionalPorMes);
    const lucroAjustadoTotal = lucroOperacionalTotal + parcelasVencidasTotal;
    
    if (receitaAjustada > 0) {
      return (lucroAjustadoTotal / receitaAjustada) * 100;
    }
    return 0;
  }

  get hasParcelasVencidas(): boolean {
    if (!this.dre?.totaisParcelasVencidasPorMes) return false;
    return Object.values(this.dre.totaisParcelasVencidasPorMes).some(val => val > 0);
  }

  openPontoEquilibrioChart(mes: string): void {
    if (!this.dre) return;

    const receitaOperacional = this.dre.totaisReceitaOperacionalPorMes[mes] || 0;
    const custoVariavel = this.dre.totaisDespesaVariavelPorMes[mes] || 0;
    const custoFixo = (this.dre.totaisDespesaOperacionalPorMes[mes] || 0) - custoVariavel;
    const margemContribuicao = this.dre.margemContribuicaoPorMes[mes] || 0;
    
    // Ponto de Equilíbrio em R$ = Custo Fixo / (Margem de Contribuição / Receita Operacional)
    let pontoEquilibrio = 0;
    if (receitaOperacional > 0 && margemContribuicao > 0) {
      const indice = margemContribuicao / receitaOperacional;
      pontoEquilibrio = custoFixo / indice;
    }

    this.dialog.open(PontoEquilibrioChartDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        mes,
        receitaOperacional,
        custoFixo,
        custoVariavel,
        indiceContribuicao: (margemContribuicao / receitaOperacional) * 100,
        pontoEquilibrio
      }
    });
  }

  openWaterfallChart(mes: string): void {
    if (!this.dre) return;

    const receitaOperacional = this.dre.totaisReceitaOperacionalPorMes[mes] || 0;
    const custoVariavel = this.dre.totaisDespesaVariavelPorMes[mes] || 0;
    const despesaOperacional = this.dre.totaisDespesaOperacionalPorMes[mes] || 0;
    const depreciacaoAmortizacao = this.dre.totaisDepreciacaoAmortizacaoPorMes?.[mes] || 0;
    const custoFixo = despesaOperacional - custoVariavel - depreciacaoAmortizacao;
    const ebitdaAbsoluto = this.dre.ebitdaAbsolutoPorMes?.[mes] || 0;

    this.dialog.open(WaterfallChartDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        mes,
        receitaOperacional,
        custoVariavel,
        custoFixo,
        ebitdaAbsoluto
      }
    });
  }

  getAnaliseVertical(mes: string, valorAtual: number): number | null {
    if (!this.dre || !valorAtual) return null;
    const base = this.dre.totaisReceitaOperacionalPorMes[mes] || 0;
    if (base === 0) return null;
    return (valorAtual / base) * 100;
  }

  getAnaliseHorizontal(valorAtual: number, valorAnterior: number | undefined | null): number | null {
    if (!this.dre || !valorAtual) return null;
    if (!valorAnterior) return null; // Se valorAnterior for 0 ou nulo, não tem como calcular (ou crescimento seria infinito).
    return (valorAtual / valorAnterior - 1) * 100;
  }
}
