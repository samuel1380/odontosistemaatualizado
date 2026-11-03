import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, BehaviorSubject } from 'rxjs';
import { 
  listarTransacoesNaoConciliadas, 
  listarMovimentacoesDisponiveis,
  vincularConciliacao,
  ignorarTransacao,
  buscarSugestoes,
  TransacaoOfx,
  MovimentacaoDisponivel,
  FiltroConciliacaoDto,
  VincularConciliacaoDto
} from 'src/services/conciliacao.service';
import { ImportarOfxDialogComponent } from './importar-ofx-dialog/importar-ofx-dialog.component';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-conciliacao-bancaria',
  templateUrl: './conciliacao-bancaria.component.html',
  styleUrls: ['./conciliacao-bancaria.component.sass']
})
export class ConciliacaoBancariaComponent implements OnInit, OnDestroy {
  transacoesDataSource = new MatTableDataSource<TransacaoOfx>([]);
  movimentacoesDataSource = new MatTableDataSource<MovimentacaoDisponivel>([]);
  
  transacaoSelecionada: TransacaoOfx | null = null;
  movimentacaoSelecionada: MovimentacaoDisponivel | null = null;
  sugestoes: any[] = [];
  
  carregando = false;
  carregandoSugestoes = false;
  
  filtrosForm = new FormGroup({
    idConta: new FormControl<number | null>(null),
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null),
    tipo: new FormControl<string | null>(null),
    statusConciliacao: new FormControl<string>('PENDENTE'),
  });

  contas$ = new BehaviorSubject<any[]>([]);
  
  displayedColumnsTransacoes = ['dataTransacao', 'tipo', 'valor', 'descricao', 'acoes'];
  displayedColumnsMovimentacoes = ['dataMovimentacao', 'tipo', 'valor', 'descricao', 'acoes'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit() {
    this.carregarContas();
    this.carregarDados();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async carregarContas() {
    try {
      const contasRes = await buscarContas();
      if (contasRes.status === 200) {
        this.contas$.next(contasRes.data.filter((c: any) => c.ativo));
      }
    } catch (error) {
      console.error('Erro ao carregar contas', error);
    }
  }

  async carregarDados() {
    this.carregando = true;
    try {
      const filtros: FiltroConciliacaoDto = {
        idConta: this.filtrosForm.value.idConta || undefined,
        dataInicio: this.filtrosForm.value.dataInicio 
          ? format(this.filtrosForm.value.dataInicio, 'yyyy-MM-dd')
          : undefined,
        dataFim: this.filtrosForm.value.dataFim 
          ? format(this.filtrosForm.value.dataFim, 'yyyy-MM-dd')
          : undefined,
        tipo: this.filtrosForm.value.tipo as any || undefined,
        statusConciliacao: this.filtrosForm.value.statusConciliacao as any || 'PENDENTE',
      };

      const [transacoesRes, movimentacoesRes] = await Promise.all([
        listarTransacoesNaoConciliadas(filtros),
        listarMovimentacoesDisponiveis(filtros)
      ]);

      if (transacoesRes.status === 200) {
        this.transacoesDataSource.data = transacoesRes.data;
      }
      if (movimentacoesRes.status === 200) {
        this.movimentacoesDataSource.data = movimentacoesRes.data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
      this.snackBar.open('Erro ao carregar dados', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  async selecionarTransacao(transacao: TransacaoOfx) {
    this.transacaoSelecionada = transacao;
    this.movimentacaoSelecionada = null;
    this.carregarSugestoes(transacao.idTransacaoOfx);
  }

  selecionarMovimentacao(movimentacao: MovimentacaoDisponivel) {
    this.movimentacaoSelecionada = movimentacao;
  }

  async carregarSugestoes(idTransacaoOfx: number) {
    this.carregandoSugestoes = true;
    try {
      const response = await buscarSugestoes(idTransacaoOfx);
      if (response.status === 200) {
        this.sugestoes = response.data;
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões', error);
    } finally {
      this.carregandoSugestoes = false;
    }
  }

  async vincular() {
    if (!this.transacaoSelecionada || !this.movimentacaoSelecionada) {
      this.snackBar.open('Selecione uma transação e uma movimentação', 'Fechar', { duration: 3000 });
      return;
    }

    try {
      const dto: VincularConciliacaoDto = {
        idTransacaoOfx: this.transacaoSelecionada.idTransacaoOfx,
        tipoVinculo: 'MOVIMENTACAO',
        idMovimentacao: this.movimentacaoSelecionada.idMovimentacao,
      };

      const response = await vincularConciliacao(dto);
      if (response.status === 201 || response.status === 200) {
        this.snackBar.open('Conciliação realizada com sucesso!', 'Fechar', { duration: 3000 });
        this.transacaoSelecionada = null;
        this.movimentacaoSelecionada = null;
        this.sugestoes = [];
        this.carregarDados();
      }
    } catch (error: any) {
      console.error('Erro ao vincular conciliação', error);
      const mensagem = error?.response?.data?.message || 'Erro ao vincular conciliação';
      this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
    }
  }

  async ignorarTransacao(transacao: TransacaoOfx) {
    try {
      const response = await ignorarTransacao(transacao.idTransacaoOfx);
      if (response.status === 200 || response.status === 201) {
        this.snackBar.open('Transação ignorada', 'Fechar', { duration: 3000 });
        this.carregarDados();
      }
    } catch (error: any) {
      console.error('Erro ao ignorar transação', error);
      const mensagem = error?.response?.data?.message || 'Erro ao ignorar transação';
      this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
    }
  }

  abrirDialogImportar() {
    try {
      console.log('Abrindo diálogo de importação OFX...');
      const dialogRef = this.dialog.open(ImportarOfxDialogComponent, {
        width: '50%',
        enterAnimationDuration: '100ms',
        exitAnimationDuration: '100ms',
        data: null,
        disableClose: false,
        autoFocus: true
      });
      
      console.log('Diálogo aberto com sucesso');
      
      dialogRef.afterClosed().subscribe((result) => {
        console.log('Diálogo fechado com resultado:', result);
        if (result) {
          this.carregarDados();
        }
      });
      
      dialogRef.afterOpened().subscribe(() => {
        console.log('Diálogo totalmente aberto');
      });
    } catch (error: any) {
      console.error('Erro ao abrir diálogo de importação OFX:', error);
      console.error('Stack trace:', error?.stack);
      this.snackBar.open(`Erro ao abrir diálogo de importação: ${error?.message || 'Erro desconhecido'}`, 'Fechar', { duration: 5000 });
    }
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  formatarData(data: string): string {
    return format(new Date(data), 'dd/MM/yyyy');
  }
}
