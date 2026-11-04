import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { Fatura, FaturaService, OrdemDeServico } from 'src/services/financeiro.fatura.service';

export interface AlterarCompetenciaFaturaDialogData {
  fatura: Fatura;
  idEmpresa?: number;
  nomeEmpresa?: string;
}

export interface MesItem {
  valor: number;
  nome: string;
}

@Component({
  selector: 'app-alterar-competencia-fatura-dialog',
  templateUrl: './alterar-competencia-fatura-dialog.component.html',
  styleUrls: ['./alterar-competencia-fatura-dialog.component.sass']
})
export class AlterarCompetenciaFaturaDialogComponent implements OnInit {
  loading = false;
  salvando = false;
  progressoTexto = '';

  faturaCompleta: Fatura;
  idEmpresa: number;
  nomeEmpresa: string;

  mesAtualFatura = 1;
  anoAtualFatura = 2026;

  mesDestinoControl = new FormControl<number>(11, [Validators.required]);
  anoDestinoControl = new FormControl<number>(2026, [Validators.required]);

  meses: MesItem[] = [
    { valor: 1, nome: '01 - Janeiro' },
    { valor: 2, nome: '02 - Fevereiro' },
    { valor: 3, nome: '03 - Março' },
    { valor: 4, nome: '04 - Abril' },
    { valor: 5, nome: '05 - Maio' },
    { valor: 6, nome: '06 - Junho' },
    { valor: 7, nome: '07 - Julho' },
    { valor: 8, nome: '08 - Agosto' },
    { valor: 9, nome: '09 - Setembro' },
    { valor: 10, nome: '10 - Outubro' },
    { valor: 11, nome: '11 - Novembro' },
    { valor: 12, nome: '12 - Dezembro' }
  ];

  anos: number[] = [2024, 2025, 2026, 2027];

  faturaDestinoExistente: Fatura | null = null;
  verificandoFaturaDestino = false;

  constructor(
    public dialogRef: MatDialogRef<AlterarCompetenciaFaturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlterarCompetenciaFaturaDialogData,
    private faturaService: FaturaService,
    private snackBar: MatSnackBar
  ) {
    this.faturaCompleta = data.fatura;
    this.idEmpresa = data.idEmpresa || (data.fatura as any).idEmpresa || (data.fatura as any).empresa?.idEmpresa;
    this.nomeEmpresa = data.nomeEmpresa || data.fatura.nomeEmpresa || (data.fatura as any).empresa?.nome || 'Empresa';
  }

  async ngOnInit(): Promise<void> {
    this.identificarCompetenciaAtual();

    // Sugere o mês atual do calendário se a fatura estiver no futuro
    const hoje = new Date();
    const mesHoje = hoje.getMonth() + 1;
    const anoHoje = hoje.getFullYear();

    if (this.anoAtualFatura > anoHoje || (this.anoAtualFatura === anoHoje && this.mesAtualFatura > mesHoje)) {
      this.mesDestinoControl.setValue(mesHoje);
      this.anoDestinoControl.setValue(anoHoje);
    } else {
      // Se já está no mês atual ou passado, sugere o próprio mês ou mês anterior
      this.mesDestinoControl.setValue(this.mesAtualFatura);
      this.anoDestinoControl.setValue(this.anoAtualFatura);
    }

    // Carrega detalhes completos com ordens de serviço caso ainda não estejam populadas
    await this.carregarDetalhesFatura();

    // Monitora alterações de mês e ano para checar fatura de destino
    this.mesDestinoControl.valueChanges.subscribe(() => this.verificarFaturaDestino());
    this.anoDestinoControl.valueChanges.subscribe(() => this.verificarFaturaDestino());

    this.verificarFaturaDestino();
  }

  identificarCompetenciaAtual(): void {
    const rawData = (this.faturaCompleta as any).dataFim || (this.faturaCompleta as any).dataInicio || (this.faturaCompleta as any).dataVencimento;
    if (rawData) {
      if (typeof rawData === 'string') {
        const match = rawData.match(/^(\d{4})-(\d{2})/);
        if (match) {
          this.anoAtualFatura = parseInt(match[1], 10);
          this.mesAtualFatura = parseInt(match[2], 10);
          return;
        }
      }
      const d = new Date(rawData);
      if (!isNaN(d.getTime())) {
        this.anoAtualFatura = d.getFullYear();
        this.mesAtualFatura = d.getMonth() + 1;
      }
    }
  }

  get nomeMesAtualFatura(): string {
    const item = this.meses.find(m => m.valor === this.mesAtualFatura);
    return item ? item.nome : `Mês ${this.mesAtualFatura}`;
  }

  get totalTrabalhos(): number {
    return this.faturaCompleta?.ordensDeServico?.length || 0;
  }

  get valorTotalFatura(): number {
    return parseFloat(this.faturaCompleta?.valorTotal || '0') || 0;
  }

  async carregarDetalhesFatura(): Promise<void> {
    try {
      this.loading = true;
      const detalhada = await firstValueFrom(this.faturaService.buscarFaturaPorId(this.faturaCompleta.idFatura));
      if (detalhada) {
        this.faturaCompleta = detalhada;
        if (!this.idEmpresa && (detalhada as any).idEmpresa) {
          this.idEmpresa = (detalhada as any).idEmpresa;
        }
        if (!this.idEmpresa && (detalhada as any).empresa?.idEmpresa) {
          this.idEmpresa = (detalhada as any).empresa.idEmpresa;
        }
      }
    } catch (e) {
      console.warn('Não foi possível recarregar detalhes da fatura:', e);
    } finally {
      this.loading = false;
    }
  }

  async verificarFaturaDestino(): Promise<void> {
    const mes = this.mesDestinoControl.value;
    const ano = this.anoDestinoControl.value;
    if (!mes || !ano || !this.idEmpresa) {
      this.faturaDestinoExistente = null;
      return;
    }

    if (mes === this.mesAtualFatura && ano === this.anoAtualFatura) {
      this.faturaDestinoExistente = null;
      return;
    }

    try {
      this.verificandoFaturaDestino = true;
      const compStr = `${String(mes).padStart(2, '0')}/${ano}`;
      const faturas = await firstValueFrom(
        this.faturaService.buscarFaturas({
          idEmpresa: this.idEmpresa,
          competencia: compStr,
          status: ['ABERTA', 'AGUARDANDO_DEVOLUCAO']
        })
      );

      const encontrada = faturas?.find(f => f.idFatura !== this.faturaCompleta.idFatura);
      this.faturaDestinoExistente = encontrada || null;
    } catch (e) {
      this.faturaDestinoExistente = null;
    } finally {
      this.verificandoFaturaDestino = false;
    }
  }

  async confirmar(): Promise<void> {
    const mes = this.mesDestinoControl.value;
    const ano = this.anoDestinoControl.value;

    if (!mes || !ano) {
      this.snackBar.open('Selecione o mês e ano de destino.', 'Fechar', { duration: 3000 });
      return;
    }

    if (mes === this.mesAtualFatura && ano === this.anoAtualFatura) {
      this.snackBar.open('O mês e ano selecionados são iguais à competência atual da fatura.', 'Fechar', { duration: 4000 });
      return;
    }

    if (!this.idEmpresa) {
      this.snackBar.open('Não foi possível identificar a empresa vinculada à fatura.', 'Fechar', { duration: 3000 });
      return;
    }

    const ordens = this.faturaCompleta?.ordensDeServico || [];
    if (ordens.length === 0) {
      this.snackBar.open('Esta fatura não possui trabalhos inclusos para serem transferidos.', 'Fechar', { duration: 4000 });
      return;
    }

    try {
      this.salvando = true;
      const compStr = `${String(mes).padStart(2, '0')}/${ano}`;
      this.progressoTexto = `Verificando fatura de destino para ${compStr}...`;

      let idFaturaDestino: number;

      if (this.faturaDestinoExistente) {
        idFaturaDestino = this.faturaDestinoExistente.idFatura;
      } else {
        // Criar uma nova fatura aberta na competência solicitada
        this.progressoTexto = `Criando nova fatura aberta para ${compStr}...`;
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const dataInicioStr = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const dataFimStr = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

        const novaFatura = await firstValueFrom(
          this.faturaService.criarFatura({
            idEmpresa: this.idEmpresa,
            dataInicio: dataInicioStr,
            dataFim: dataFimStr
          })
        );

        if (!novaFatura || !novaFatura.idFatura) {
          throw new Error('Falha ao criar fatura na competência solicitada.');
        }

        idFaturaDestino = novaFatura.idFatura;
      }

      // Mover cada OS da fatura de origem para a fatura de destino
      for (let i = 0; i < ordens.length; i++) {
        const os = ordens[i];
        this.progressoTexto = `Transferindo trabalho ${i + 1} de ${ordens.length} (Trabalho #${os.idTrabalho})...`;

        await firstValueFrom(
          this.faturaService.moverOrdemServico({
            idOrdemServico: os.idOrdemServico,
            idFaturaDestino: idFaturaDestino as any,
            idEmpresa: this.idEmpresa
          })
        );
      }

      // Recalcular ambas as faturas
      this.progressoTexto = 'Recalculando totais da fatura...';
      try {
        await firstValueFrom(this.faturaService.recalcular(idFaturaDestino));
      } catch (errRecalc) {
        console.warn('Aviso ao recalcular fatura destino:', errRecalc);
      }

      try {
        await firstValueFrom(this.faturaService.recalcular(this.faturaCompleta.idFatura));
      } catch (errRecalcOrigem) {
        console.warn('Aviso ao recalcular fatura origem:', errRecalcOrigem);
      }

      this.snackBar.open(
        `Competência alterada com sucesso para ${compStr}! ${ordens.length} trabalho(s) transferido(s) para a Fatura #${idFaturaDestino}.`,
        'Fechar',
        { duration: 5000 }
      );

      this.dialogRef.close({
        sucesso: true,
        idFaturaDestino,
        idFaturaOrigem: this.faturaCompleta.idFatura,
        competencia: compStr
      });
    } catch (erro: any) {
      console.error('Erro ao alterar competência da fatura:', erro);
      const msg = erro?.error?.message || erro?.message || 'Erro ao alterar competência da fatura.';
      this.snackBar.open(`Erro: ${msg}`, 'Fechar', { duration: 5000 });
    } finally {
      this.salvando = false;
      this.progressoTexto = '';
    }
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
