import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { Fatura, FaturaService } from 'src/services/financeiro.fatura.service';

export interface TrocarFaturaDialogData {
  idFaturaAtual: number;
  idOrdemServico: number;
  idEmpresa: number;
}

export interface TrocarFaturaDialogResult {
  confirmado: boolean;
  idFaturaDestino?: number | null;
}

@Component({
  selector: 'app-trocar-fatura-dialog',
  templateUrl: './trocar-fatura-dialog.component.html',
  styleUrls: ['./trocar-fatura-dialog.component.sass']
})
export class TrocarFaturaDialogComponent implements OnInit {
  loading = false;
  faturasAbertas: Fatura[] = [];

  tipoDestino: 'existente' | 'novoMes' = 'existente';

  faturaDestinoControl = new FormControl<number | null>(null);

  mesDestinoControl = new FormControl<number>(11, [Validators.required]);
  anoDestinoControl = new FormControl<number>(2026, [Validators.required]);

  meses = [
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

  anos = [2025, 2026, 2027];

  constructor(
    public dialogRef: MatDialogRef<TrocarFaturaDialogComponent, TrocarFaturaDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: TrocarFaturaDialogData,
    private faturaService: FaturaService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    const hoje = new Date();
    this.mesDestinoControl.setValue(hoje.getMonth() + 1);
    this.anoDestinoControl.setValue(hoje.getFullYear());

    await this.carregarFaturasAbertas();
  }

  async carregarFaturasAbertas(): Promise<void> {
    try {
      this.loading = true;
      const faturas = await firstValueFrom(
        this.faturaService.buscarFaturas({
          idEmpresa: this.data.idEmpresa,
          status: ['ABERTA', 'AGUARDANDO_DEVOLUCAO']
        })
      );

      // Exclui a fatura atual das opções
      this.faturasAbertas = (faturas || []).filter(f => f.idFatura !== this.data.idFaturaAtual);

      if (this.faturasAbertas.length > 0) {
        this.tipoDestino = 'existente';
        this.faturaDestinoControl.setValue(this.faturasAbertas[0].idFatura);
      } else {
        this.tipoDestino = 'novoMes';
      }
    } catch (e) {
      console.warn('Erro ao listar faturas abertas:', e);
      this.tipoDestino = 'novoMes';
    } finally {
      this.loading = false;
    }
  }

  formatarPeriodoFatura(fatura: Fatura): string {
    const inicio = (fatura as any).dataInicio ? new Date((fatura as any).dataInicio).toLocaleDateString('pt-BR') : '';
    const fim = (fatura as any).dataFim ? new Date((fatura as any).dataFim).toLocaleDateString('pt-BR') : '';
    const valor = parseFloat(fatura.valorTotal || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return `#${fatura.idFatura} (${inicio} a ${fim}) - ${valor}`;
  }

  async onConfirm(): Promise<void> {
    try {
      this.loading = true;

      if (this.tipoDestino === 'existente') {
        const idDestino = this.faturaDestinoControl.value;
        if (!idDestino) {
          this.snackBar.open('Selecione a fatura de destino.', 'Fechar', { duration: 3000 });
          return;
        }
        this.dialogRef.close({ confirmado: true, idFaturaDestino: idDestino });
        return;
      }

      // Se for novo mês:
      const mes = this.mesDestinoControl.value;
      const ano = this.anoDestinoControl.value;
      if (!mes || !ano) {
        this.snackBar.open('Selecione o mês e ano de destino.', 'Fechar', { duration: 3000 });
        return;
      }

      const compStr = `${String(mes).padStart(2, '0')}/${ano}`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataInicioStr = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const dataFimStr = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

      // Verifica se já tem fatura para o mês
      const existentes = await firstValueFrom(
        this.faturaService.buscarFaturas({
          idEmpresa: this.data.idEmpresa,
          competencia: compStr,
          status: ['ABERTA', 'AGUARDANDO_DEVOLUCAO']
        })
      );

      const faturaMes = existentes?.find(f => f.idFatura !== this.data.idFaturaAtual);
      if (faturaMes) {
        this.dialogRef.close({ confirmado: true, idFaturaDestino: faturaMes.idFatura });
        return;
      }

      // Cria nova fatura aberta para esse mês
      const novaFatura = await firstValueFrom(
        this.faturaService.criarFatura({
          idEmpresa: this.data.idEmpresa,
          dataInicio: dataInicioStr,
          dataFim: dataFimStr
        })
      );

      this.dialogRef.close({ confirmado: true, idFaturaDestino: novaFatura.idFatura });
    } catch (e: any) {
      console.error('Erro ao transferir ordem de serviço:', e);
      this.snackBar.open('Erro ao definir fatura de destino: ' + (e?.message || ''), 'Fechar', { duration: 4000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close({ confirmado: false });
  }
}
