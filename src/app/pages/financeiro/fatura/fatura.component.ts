import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Fatura, FaturaService, Trabalho } from 'src/services/financeiro.fatura.service';
import { listarBoletosAtrasados } from 'src/services/boleto-atrasado.service';
import { BoletosPendentesDialogComponent } from 'src/app/components/common/boletos-pendentes-dialog/boletos-pendentes-dialog.component';
import { buscarEmpresas, buscarCadastroComplementar, atualizarPagamentoCadastroComplementar } from 'src/services/empresa.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FaturaDetalhesComponent } from './fatura-detalhes/fatura-detalhes.component';
import { FaturaDetalhamentoImpressaoComponent } from './fatura-detalhes/fatura-detalhamento-impressao.component';
import { DetalhamentoImpressaoResponse } from 'src/services/financeiro.fatura.service';
import { LancarValorFaturaDialogComponent } from './lancar-valor-fatura-dialog/lancar-valor-fatura-dialog.component';

interface Empresa {
  idEmpresa: number;
  nome: string;
}


@Component({
  selector: 'app-fatura',
  templateUrl: './fatura.component.html',
  styleUrls: ['./fatura.component.sass'],
  providers: [DatePipe]
})
export class FaturaComponent implements OnInit, OnDestroy {
  empresaFilter = new FormControl<number | null>(null);
  statusFilter = new FormControl<string[]>([]);
  competenciaFilter = new FormControl<string | null>(null, [FaturaComponent.competenciaValidator]);
  idFaturaFilter = new FormControl<string | null>(null);

  empresas$ = new BehaviorSubject<Empresa[]>([]);
  listaFaturas = new MatTableDataSource<Fatura>([]);
  valorTotal = 0;
  boletosAtrasadosCount = 0;


  displayedColumns = [
    { coluna: 'idFatura', titulo: 'ID' },
    { coluna: 'nomeEmpresa', titulo: 'Empresa' },
    { coluna: 'dataVencimento', titulo: 'Vencimento', datetime: true },
    { coluna: 'valorTotal', titulo: 'Valor', price: 'BRL' },
    { coluna: 'status', titulo: 'Status' },
  ];

  displayedColumnsWithActions: string[] = [
    'idFatura',
    'nomeEmpresa',
    'dataVencimento',
    'valorTotal',
    'status',
    'acoes',
  ];

  statusList: string[] = [
    'ABERTA',
    'AGUARDANDO_DEVOLUCAO',
    'FECHADA',
    'PAGA_PARCIALMENTE',
    'PAGA',
    'CANCELADA'
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private faturaService: FaturaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmpresas();

    this.empresaFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idEmpresa => {
      this.boletosAtrasadosCount = 0;
      if (idEmpresa) {
        this.verificarPendencias(idEmpresa);
      }
    });
  }

  async verificarPendencias(idEmpresa: number) {
    try {
      const response = await listarBoletosAtrasados(idEmpresa);
      this.boletosAtrasadosCount = response.data?.length || 0;
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
    }
  }

  abrirPendencias() {
    const idEmpresa = this.empresaFilter.value;
    if (!idEmpresa) return;
    const empresaNome = this.empresas$.value.find(e => e.idEmpresa === idEmpresa)?.nome || 'Empresa';
    
    this.dialog.open(BoletosPendentesDialogComponent, {
      width: '800px',
      data: { idEmpresa: idEmpresa, nomeEmpresa: empresaNome }
    });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
      this.snackBar.open('Falha ao carregar empresas.', 'Fechar', { duration: 3000 });
    }
  }

  buscar() {
    // Valida competência se informada
    const competencia = this.competenciaFilter.value?.trim();
    if (competencia && !this.validarCompetencia(competencia)) {
      this.snackBar.open('Competência inválida. Use o formato MM/YYYY (ex: 11/2025)', 'Fechar', { duration: 3000 });
      return;
    }

    const payload = {
      idEmpresa: this.empresaFilter.value || undefined,
      status: this.statusFilter.value || undefined,
      competencia: competencia || undefined,
    };

    this.faturaService.buscarFaturas(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (faturas) => {
          faturas.forEach(fatura => {
            const idEmpresaFatura = (fatura as any).empresa?.idEmpresa;
            if (idEmpresaFatura == null) {
              return;
            }
            const empresa = this.empresas$.getValue().find(e => e.idEmpresa === idEmpresaFatura);
            if (empresa) {
              fatura.nomeEmpresa = empresa.nome;
            }
          });

          let listaFiltrada = faturas;

          // Se foi informado um ID de fatura, filtra localmente por ele
          const idFiltroValor = this.idFaturaFilter.value;
          const idFiltroRaw = idFiltroValor != null ? String(idFiltroValor).trim() : '';
          if (idFiltroRaw) {
            const idNumero = Number(idFiltroRaw);
            if (!isNaN(idNumero)) {
              listaFiltrada = faturas.filter(f => f.idFatura === idNumero);
            }
          }

          this.listaFaturas.data = listaFiltrada;
          this.valorTotal = listaFiltrada.reduce((acc: number, fatura): number => acc + parseFloat(fatura.valorTotal), 0);
        },
        error: (err) => {
          console.error('Erro ao buscar faturas', err);
          this.snackBar.open('Falha ao buscar faturas.', 'Fechar', { duration: 3000 });
        }
      });
  }

  gerarRecorrentes() {
    this.faturaService.gerarFaturasRecorrentes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Faturas recorrentes geradas com sucesso!', 'Fechar', { duration: 3000 });
          this.buscar(); // Atualiza a lista
        },
        error: (err) => {
          console.error('Erro ao gerar faturas recorrentes', err);
          this.snackBar.open('Falha ao gerar faturas recorrentes.', 'Fechar', { duration: 3000 });
        }
      });
  }

  abrirDetalhesFatura(fatura: Fatura) {
    this.faturaService.buscarFaturaPorId(fatura.idFatura).subscribe({
      next: (faturaDetalhada) => {
        const dialogRef = this.dialog.open(FaturaDetalhesComponent, {
          data: faturaDetalhada,
          width: '90%'
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.faturaAlterada) {
            this.buscar(); // Atualiza a lista de faturas
          }
        });
      },
      error: (err) => {
        console.error('Erro ao buscar detalhes da fatura', err);
        this.snackBar.open('Falha ao carregar detalhes da fatura.', 'Fechar', { duration: 3000 });
      }
    });
  }

  /**
   * Validador customizado para competência (método estático)
   */
  static competenciaValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    // Se vazio, é válido (campo opcional)
    if (!value || value.trim() === '') {
      return null;
    }

    // Verifica formato MM/YYYY
    const regex = /^(\d{1,2})\/(\d{4})$/;
    const match = value.match(regex);

    if (!match) {
      return { competenciaInvalida: { message: 'Formato inválido. Use MM/YYYY (ex: 11/2025)' } };
    }

    const mes = parseInt(match[1], 10);
    const ano = parseInt(match[2], 10);

    // Valida mês entre 1 e 12
    if (mes < 1 || mes > 12) {
      return { competenciaInvalida: { message: 'Mês deve estar entre 1 e 12' } };
    }

    // Valida ano (opcional: pode adicionar validação de ano mínimo/máximo)
    if (ano < 2000 || ano > 2100) {
      return { competenciaInvalida: { message: 'Ano deve estar entre 2000 e 2100' } };
    }

    return null;
  }

  /**
   * Valida o formato da competência (MM/YYYY)
   * @param competencia String no formato MM/YYYY
   * @returns true se válido, false caso contrário
   */
  validarCompetencia(competencia: string): boolean {
    // Verifica formato MM/YYYY
    const regex = /^(\d{1,2})\/(\d{4})$/;
    const match = competencia.match(regex);

    if (!match) {
      return false;
    }

    const mes = parseInt(match[1], 10);
    const ano = parseInt(match[2], 10);

    // Valida mês entre 1 e 12
    if (mes < 1 || mes > 12) {
      return false;
    }

    // Valida ano (opcional: pode adicionar validação de ano mínimo/máximo)
    if (ano < 2000 || ano > 2100) {
      return false;
    }

    return true;
  }

  /**
   * Formata a competência para MM/YYYY (adiciona zero à esquerda se necessário)
   * @param mes Mês (1-12)
   * @param ano Ano (4 dígitos)
   * @returns String formatada MM/YYYY
   */
  formatarCompetencia(mes: number, ano: number): string {
    const mesFormatado = mes.toString().padStart(2, '0');
    return `${mesFormatado}/${ano}`;
  }

  /**
   * Formata o input de competência enquanto o usuário digita
   * Adiciona automaticamente a barra (/) após 2 dígitos
   */
  formatarInputCompetencia(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito

    // Adiciona barra após 2 dígitos
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 6);
    }

    // Limita a 7 caracteres (MM/YYYY)
    if (value.length > 7) {
      value = value.substring(0, 7);
    }

    this.competenciaFilter.setValue(value, { emitEvent: false });
  }

  /**
   * Imprime todas as faturas de uma competência
   * Abre o componente de impressão para cada fatura, uma de cada vez
   */
  imprimirFaturasPorCompetencia(): void {
    // Valida competência se informada
    const competencia = this.competenciaFilter.value?.trim();
    if (!competencia || !this.validarCompetencia(competencia)) {
      this.snackBar.open('Informe uma competência válida (MM/YYYY) para imprimir as faturas.', 'Fechar', { duration: 3000 });
      return;
    }

    const idEmpresa = this.empresaFilter.value || undefined;

    this.snackBar.open('Carregando faturas da competência...', 'Fechar', { duration: 2000 });

    this.faturaService.buscarFaturasImpressaoPorCompetencia(competencia, idEmpresa)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Resposta do backend:', response);

          // Verifica se a resposta tem faturas (pode vir como array direto ou dentro de um objeto)
          let faturas: DetalhamentoImpressaoResponse[] = [];

          if (Array.isArray(response)) {
            // Se a resposta é um array direto
            faturas = response;
          } else if (response?.faturas && Array.isArray(response.faturas)) {
            // Se a resposta tem a propriedade faturas
            faturas = response.faturas;
          }

          console.log('Faturas extraídas:', faturas);

          if (!faturas || faturas.length === 0) {
            console.log('Nenhuma fatura encontrada. Resposta completa:', response);
            this.snackBar.open('Nenhuma fatura encontrada para esta competência.', 'Fechar', { duration: 3000 });
            return;
          }

          this.snackBar.open(
            `${faturas.length} fatura(s) encontrada(s). Abrindo impressões...`,
            'Fechar',
            { duration: 3000 }
          );

          // Gera PDF para cada fatura usando a função estática do componente de impressão
          // Usa um pequeno delay entre cada geração para evitar sobrecarga
          faturas.forEach((detalhamento: DetalhamentoImpressaoResponse, index) => {
            setTimeout(() => {
              // Usa o método estático para gerar o PDF diretamente, passando a competência para o nome do arquivo
              FaturaDetalhamentoImpressaoComponent.gerarPdf(detalhamento, undefined, competencia);
            }, index * 500); // Delay de 500ms entre cada geração
          });
        },
        error: (err) => {
          console.error('Erro ao buscar faturas para impressão', err);
          const mensagem = err?.error?.resposta || 'Falha ao buscar faturas para impressão.';
          this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
        }
      });
  }

  enviarWhatsApp(fatura: any) {
    const empresa = this.empresas$.getValue().find(e => e.idEmpresa === (fatura as any).empresa.idEmpresa);
    const telefone = empresa ? (empresa as any).telefone : '';

    if (!telefone) {
      this.snackBar.open('Telefone da empresa não encontrado.', 'Fechar', { duration: 3000 });
      return;
    }

    const dataVencimento = this.datePipe.transform(fatura.dataVencimento, 'dd/MM/yyyy');
    const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(fatura.valorTotal));
    const linkBoleto = `https://seu-dominio.com/boleto/${fatura.id}`; // <-- ATENÇÃO: Ajuste este link
    const mensagem = `Olá! Segue o resumo da sua fatura:\n\n*Fatura ID:* ${fatura.id}\n*Vencimento:* ${dataVencimento}\n*Valor:* ${valor}\n\nPara pagar, acesse o link do boleto: ${linkBoleto}`;
    let digits = telefone.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length <= 11) digits = '55' + digits;
    const url = `whatsapp://send/?phone=${digits}&text=${encodeURIComponent(mensagem)}&type=phone_number&app_absent=0`;
    window.open(url, '_blank');
  }

  /**
   * Indica se a empresa da fatura possui telefone financeiro para abrir o WhatsApp.
   */
  temWhatsAppFinanceiro(fatura: Fatura): boolean {
    const tel = fatura.empresa?.telefoneFinanceiro;
    if (!tel) {
      return false;
    }
    return String(tel).replace(/\D/g, '').length > 0;
  }

  /**
   * Abre o WhatsApp com o número de contato financeiro da empresa (mesma regra do detalhamento).
   */
  linkWhatsAppFinanceiro(fatura: Fatura): string {
    const tel = fatura.empresa?.telefoneFinanceiro;
    if (!tel) {
      return '';
    }
    let digits = String(tel).replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length <= 11) {
      digits = '55' + digits;
    }
    if (!digits) {
      return '';
    }
    return `whatsapp://send/?phone=${digits}&text&type=phone_number&app_absent=0`;
  }

  rotuloStatus(status: string): string {
    if (status === 'AGUARDANDO_DEVOLUCAO') {
      return 'Componentes para reposição futura';
    }
    return status
      .toLowerCase()
      .split('_')
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }

  podeLancarValor(fatura: Fatura): boolean {
    const statusPermitidos = ['ABERTA', 'AGUARDANDO_DEVOLUCAO', 'PAGA_PARCIALMENTE'];
    const podeLancar = statusPermitidos.includes(fatura.status);
    return podeLancar;
  }

  lancarValorFatura(fatura: Fatura, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    console.log('lancarValorFatura chamado para fatura:', fatura);

    try {
      // Criar objeto de fatura com valorPago padrão se não existir
      const faturaCompleta: Fatura = {
        ...fatura,
        valorPago: (fatura as any).valorPago || '0'
      };

      console.log('Abrindo diálogo com fatura:', faturaCompleta);

      const dialogRef = this.dialog.open(LancarValorFaturaDialogComponent, {
        width: '600px',
        data: faturaCompleta,
        disableClose: false
      });

      console.log('Diálogo aberto com sucesso');

      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog fechado com resultado:', result);
        if (result?.sucesso) {
          this.buscar(); // Atualiza a lista de faturas
        }
      });
    } catch (error: any) {
      console.error('Erro ao abrir diálogo:', error);
      console.error('Stack trace:', error?.stack);
      const mensagemErro = error?.message || error?.toString() || 'Erro desconhecido ao abrir diálogo';
      this.snackBar.open(`Erro ao abrir diálogo: ${mensagemErro}`, 'Fechar', { duration: 5000 });
    }
  }
}
