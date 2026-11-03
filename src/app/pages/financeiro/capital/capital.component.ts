import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { listarAportes, listarEmprestimos, Aporte, Emprestimo, listarSocios, listarCredores, Socio, Credor, excluirSocio, excluirCredor } from 'src/services/capital.service';
import { EmprestimoHistoricoDialogComponent } from './emprestimo-historico-dialog/emprestimo-historico-dialog.component';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { AporteDialogComponent } from './aporte-dialog/aporte-dialog.component';
import { EmprestimoDialogComponent } from './emprestimo-dialog/emprestimo-dialog.component';
import { SocioDialogComponent } from './socio-dialog/socio-dialog.component';
import { CredorDialogComponent } from './credor-dialog/credor-dialog.component';
import { DialogConfirmacaoExclusaoArquivoComponent } from 'src/app/components/dialog-confirmacao-exclusao-arquivo/dialog-confirmacao-exclusao-arquivo.component';
import { listarMovimentacoesPagamentoEmprestimo } from 'src/services/capital.service';
import { format } from 'date-fns';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

@Component({
  selector: 'app-capital',
  templateUrl: './capital.component.html',
  styleUrls: ['./capital.component.sass']
})
export class CapitalComponent implements OnInit, OnDestroy {
  listaAportes = new MatTableDataSource<Aporte>([]);
  listaEmprestimos = new MatTableDataSource<Emprestimo>([]);
  listaSocios = new MatTableDataSource<Socio>([]);
  listaCredores = new MatTableDataSource<Credor>([]);
  carregando = false;
  abaAtiva = 'aportes';

  displayedColumnsAportes = [
    { coluna: 'dataAporte', titulo: 'Data', date: true },
    { coluna: 'tipo', titulo: 'Tipo' },
    { coluna: 'valor', titulo: 'Valor', price: 'BRL' },
    { coluna: 'nomeSocio', titulo: 'Sócio' }
  ];

  displayedColumnsEmprestimos = [
    { coluna: 'dataContratacao', titulo: 'Data Contratação', date: true },
    { coluna: 'tipo', titulo: 'Tipo' },
    { coluna: 'valorPrincipal', titulo: 'Valor Principal', price: 'BRL' },
    { coluna: 'saldoRestante', titulo: 'Saldo devedor', price: 'BRL' },
    { coluna: 'taxaJuros', titulo: 'Taxa Juros (%)' },
    { coluna: 'status', titulo: 'Status' }
  ];

  displayedColumnsEmprestimosTabela = [
    'dataContratacao',
    'tipo',
    'nomeCredor',
    'valorPrincipal',
    'saldoRestante',
    'taxaJuros',
    'status',
    'acoes',
  ];

  displayedColumnsSocios = [
    { coluna: 'nome', titulo: 'Nome' },
    { coluna: 'cpf', titulo: 'CPF' },
    { coluna: 'cnpj', titulo: 'CNPJ' },
    { coluna: 'telefone', titulo: 'Telefone' },
    { coluna: 'email', titulo: 'Email' }
  ];

  displayedColumnsSociosWithActions = [
    'nome',
    'cpf',
    'cnpj',
    'telefone',
    'email',
    'acoes'
  ];

  displayedColumnsCredores = [
    { coluna: 'nome', titulo: 'Nome' },
    { coluna: 'cpf', titulo: 'CPF' },
    { coluna: 'cnpj', titulo: 'CNPJ' },
    { coluna: 'telefone', titulo: 'Telefone' },
    { coluna: 'email', titulo: 'Email' }
  ];

  displayedColumnsCredoresWithActions = [
    'nome',
    'cpf',
    'cnpj',
    'telefone',
    'email',
    'acoes'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public themeService: CustomizerSettingsService
  ) {}

  ngOnInit() {
    this.carregarAportes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async carregarAportes() {
    this.carregando = true;
    try {
      const res = await listarAportes();
      if (res && res.status === 200) {
        this.listaAportes.data = res.data.map((a: any) => ({
          ...a,
          nomeSocio: a.socio?.nome || '—'
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar aportes', error);
      this.snackBar.open('Erro ao carregar aportes.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  async carregarEmprestimos() {
    this.carregando = true;
    try {
      const res = await listarEmprestimos();
      if (res && res.status === 200) {
        this.listaEmprestimos.data = res.data.map((e: any) => ({
          ...e,
          nomeCredor: e.credor?.nome || '—'
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar empréstimos', error);
      this.snackBar.open('Erro ao carregar empréstimos.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  mudarAba(aba: string) {
    this.abaAtiva = aba;
    if (aba === 'emprestimos') {
      this.carregarEmprestimos();
    } else if (aba === 'configuracao') {
      this.carregarSocios();
      this.carregarCredores();
    }
  }

  async carregarSocios() {
    this.carregando = true;
    try {
      const response = await listarSocios();
      this.listaSocios.data = response.data;
    } catch (error) {
      console.error('Erro ao carregar sócios', error);
      this.snackBar.open('Erro ao carregar sócios.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  async carregarCredores() {
    this.carregando = true;
    try {
      const response = await listarCredores();
      this.listaCredores.data = response.data;
    } catch (error) {
      console.error('Erro ao carregar credores', error);
      this.snackBar.open('Erro ao carregar credores.', 'Fechar', { duration: 3000 });
    } finally {
      this.carregando = false;
    }
  }

  adicionarAporte() {
    this.dialog.open(AporteDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarAportes();
      }
    });
  }

  adicionarEmprestimo() {
    this.dialog.open(EmprestimoDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarEmprestimos();
      }
    });
  }

  abrirHistoricoPagamentosEmprestimo(emp: Emprestimo) {
    this.dialog.open(EmprestimoHistoricoDialogComponent, {
      width: '1000px',
      data: { emp },
    }).afterClosed().subscribe((teveAlteracao) => {
      if (teveAlteracao) {
        this.carregarEmprestimos();
      }
    });
  }

  async imprimirHistoricoEmprestimo(emp: Emprestimo) {
    try {
      const res = await listarMovimentacoesPagamentoEmprestimo(emp.idEmprestimo);
      let payload = (res as any).data || [];
      
      if (payload.length > 0) {
        let chron = [...payload].reverse();
        let runningBalance = Number(emp.valorPrincipal);
        chron.forEach((mov: any) => {
          const val = Number(mov.valor);
          if (mov.tipoMovimentacao === 'JUROS' || mov.tipoMovimentacao === 'ACRESCIMO') {
            runningBalance += val;
          } else if (mov.tipoMovimentacao === 'PAGAMENTO') {
            runningBalance -= val;
          }
          mov.saldoAposMovimentacao = runningBalance;
        });
        payload = chron.reverse();
      }

      const rows = [
        [
          { text: 'Data', style: 'tableHeader' },
          { text: 'Tipo', style: 'tableHeader' },
          { text: 'Valor', style: 'tableHeader', alignment: 'right' },
          { text: 'Saldo Atual', style: 'tableHeader', alignment: 'right' },
          { text: 'Descrição', style: 'tableHeader' },
        ]
      ];

      payload.forEach((mov: any) => {
        const dataF = mov.dataMovimentacao ? format(new Date(mov.dataMovimentacao + 'T12:00:00'), 'dd/MM/yyyy') : '—';
        const valorF = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mov.valor);
        const saldoF = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mov.saldoAposMovimentacao || 0);
        const desc = mov.observacoes || mov.lancamento?.descricao || '—';

        rows.push([
          dataF,
          mov.tipoMovimentacao || '—',
          { text: valorF, alignment: 'right' },
          { text: saldoF, alignment: 'right' },
          desc
        ]);
      });

      const docDefinition: any = {
        content: [
          { text: `Histórico de Empréstimo - #${emp.idEmprestimo}`, style: 'header' },
          {
            text: [
              { text: 'Tipo: ', bold: true }, emp.tipo, '\n',
              { text: 'Credor/Devedor: ', bold: true }, (emp as any).nomeCredor || '—', '\n',
              { text: 'Data de Contratação: ', bold: true }, emp.dataContratacao ? format(new Date(emp.dataContratacao + 'T12:00:00'), 'dd/MM/yyyy') : '—', '\n',
              { text: 'Valor Principal: ', bold: true }, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(emp.valorPrincipal), '\n',
              { text: 'Saldo Restante: ', bold: true }, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(emp.saldoRestante || emp.valorPrincipal), '\n',
            ],
            margin: [0, 0, 0, 20]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', '*'],
              body: rows
            },
            layout: 'lightHorizontalLines'
          }
        ],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          tableHeader: { bold: true, fontSize: 12, color: 'black' }
        },
        defaultStyle: {
          fontSize: 10
        }
      };

      pdfMake.createPdf(docDefinition).open();
    } catch (e) {
      console.error(e);
      this.snackBar.open('Erro ao gerar impressão', 'Fechar', { duration: 3000 });
    }
  }

  imprimirRelatorioGeral() {
    let rows: any[] = [];
    let titulo = '';
    
    if (this.abaAtiva === 'aportes') {
      titulo = 'Relatório de Aportes';
      rows.push([
        { text: 'Data', style: 'tableHeader' },
        { text: 'Tipo', style: 'tableHeader' },
        { text: 'Sócio', style: 'tableHeader' },
        { text: 'Valor', style: 'tableHeader', alignment: 'right' }
      ]);
      
      this.listaAportes.data.forEach(a => {
        rows.push([
          a.dataAporte ? format(new Date(a.dataAporte + 'T12:00:00'), 'dd/MM/yyyy') : '—',
          a.tipo,
          (a as any).nomeSocio || '—',
          { text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.valor), alignment: 'right' }
        ]);
      });
      
    } else if (this.abaAtiva === 'emprestimos') {
      titulo = 'Relatório de Empréstimos';
      rows.push([
        { text: 'Data', style: 'tableHeader' },
        { text: 'Tipo', style: 'tableHeader' },
        { text: 'Credor', style: 'tableHeader' },
        { text: 'Principal', style: 'tableHeader', alignment: 'right' },
        { text: 'Saldo Devedor', style: 'tableHeader', alignment: 'right' },
        { text: 'Juros', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' }
      ]);
      
      this.listaEmprestimos.data.forEach(e => {
        rows.push([
          e.dataContratacao ? format(new Date(e.dataContratacao + 'T12:00:00'), 'dd/MM/yyyy') : '—',
          e.tipo,
          (e as any).nomeCredor || '—',
          { text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.valorPrincipal), alignment: 'right' },
          { text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.saldoDevedorEmprestimo(e)), alignment: 'right' },
          e.taxaJuros != null ? `${e.taxaJuros}%` : '—',
          e.status
        ]);
      });
    } else {
      return;
    }

    const docDefinition: any = {
      content: [
        { text: titulo, style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: this.abaAtiva === 'aportes' ? ['auto', 'auto', 'auto', '*'] : ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
            body: rows
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fontSize: 12, color: 'black' }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }

  saldoDevedorEmprestimo(emp: Emprestimo): number {
    const s = emp.saldoRestante;
    if (s != null && !Number.isNaN(Number(s))) {
      return Number(s);
    }
    return Number(emp.valorPrincipal);
  }

  adicionarSocio() {
    this.dialog.open(SocioDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarSocios();
      }
    });
  }

  editarSocio(socio: Socio) {
    this.dialog.open(SocioDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: socio
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarSocios();
      }
    });
  }

  excluirSocio(socio: Socio) {
    this.dialog.open(DialogConfirmacaoExclusaoArquivoComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Exclusão',
        mensagem: `Deseja realmente excluir o sócio ${socio.nome}?`
      }
    }).afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        try {
          await excluirSocio(socio.idSocio);
          this.snackBar.open('Sócio excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.carregarSocios();
        } catch (error) {
          console.error('Erro ao excluir sócio', error);
          this.snackBar.open('Erro ao excluir sócio.', 'Fechar', { duration: 3000 });
        }
      }
    });
  }

  adicionarCredor() {
    this.dialog.open(CredorDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: null
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarCredores();
      }
    });
  }

  editarCredor(credor: Credor) {
    this.dialog.open(CredorDialogComponent, {
      width: '50%',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: credor
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.carregarCredores();
      }
    });
  }

  excluirCredor(credor: Credor) {
    this.dialog.open(DialogConfirmacaoExclusaoArquivoComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Exclusão',
        mensagem: `Deseja realmente excluir o credor ${credor.nome}?`
      }
    }).afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        try {
          await excluirCredor(credor.idCredor);
          this.snackBar.open('Credor excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.carregarCredores();
        } catch (error) {
          console.error('Erro ao excluir credor', error);
          this.snackBar.open('Erro ao excluir credor.', 'Fechar', { duration: 3000 });
        }
      }
    });
  }
}

