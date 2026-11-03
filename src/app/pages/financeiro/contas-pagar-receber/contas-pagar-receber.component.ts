import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { DateAdapter } from '@angular/material/core';
import { buscarLancamentos } from 'src/services/financeiro.contasPagarReceber.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { ContaElement } from '../contas/contas.component';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ContasPagarReceberCadastroComponent } from './contas-pagar-receber-cadastro/contas-pagar-receber-cadastro.component';
import { ContasPagarReceberEditComponent } from './contas-pagar-receber-edit/contas-pagar-receber-edit.component';
import { ContasPagarReceberEditLancamentoComponent } from './contas-pagar-receber-edit-lancamento/contas-pagar-receber-edit-lancamento.component';
import { buscarLancamentoPorId } from 'src/services/financeiro.contasPagarReceber.service';
import { ImportarCsvHistoricoDialogComponent } from './importar-csv-historico-dialog/importar-csv-historico-dialog.component';

@Component({
  selector: 'app-contas-pagar-receber',
  templateUrl: './contas-pagar-receber.component.html',
  styleUrl: './contas-pagar-receber.component.sass'
})
export class ContasPagarReceberComponent {
  listaContas: ContaElement[] = [];
  lancamentoList = new MatTableDataSource<LancamentoElement>([]);

  displayedColumnsLancamento: any[] = [
    { coluna: "dataEmissao", titulo: "Data Emissão", date: true },
    { coluna: "dataVencimento", titulo: "Data Vencimento", date: true },
    { coluna: "descricao", titulo: "Descrição" },
    { coluna: "tipo", titulo: "Tipo" },
    { coluna: "numeroParcela", titulo: "Numero Parcela" },
    { coluna: "valorParcelaNominal", titulo: "Valor parcela", price: 'BRL' },
    { coluna: "valorAcrescimoAcumulado", titulo: "Valor acrescido", price: 'BRL' },
    { coluna: "valorTotalParcela", titulo: "Valor total", price: 'BRL' },
    { coluna: "meioPagamento", titulo: "Meio Pagamento " },
    { coluna: "status", titulo: "Status" },
  ];

  lancamentoSelecionado: any = null;

  listaAnos = [
    { nome: "2030", id: 2030 },
    { nome: "2029", id: 2029 },
    { nome: "2028", id: 2028 },
    { nome: "2027", id: 2027 },
    { nome: "2026", id: 2026 },
    { nome: "2025", id: 2025 },
    { nome: "2024", id: 2024 },
    { nome: "2023", id: 2023 },
    { nome: "2022", id: 2022 },
    { nome: "2021", id: 2021 },
    { nome: "2020", id: 2020 }
  ]
  listaMeses = [
    { nome: "Janeiro", id: 1 },
    { nome: "Fevereiro", id: 2 },
    { nome: "Março", id: 3 },
    { nome: "Abril", id: 4 },
    { nome: "Maio", id: 5 },
    { nome: "Junho", id: 6 },
    { nome: "Julho", id: 7 },
    { nome: "Agosto", id: 8 },
    { nome: "Setembro", id: 9 },
    { nome: "Outubro", id: 10 },
    { nome: "Novembro", id: 11 },
    { nome: "Dezembro", id: 12 },
  ]

  contaSelecionadaControl = new FormControl<ContaElement | null>(null);
  anoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number>(new Date().getMonth() + 1);

  constructor(private router: Router, private dialog: MatDialog, public themeService: CustomizerSettingsService, private dateAdapter: DateAdapter<any>) {
    this.dateAdapter.setLocale('pt-br');

    this.buscarContas();

    // Ao mudar ano, mês ou conta, atualiza os lançamentos (e o saldo vem da conta selecionada).
    this.anoControl.valueChanges.subscribe(() => {
      this.buscarLancamentos();
    });

    this.mesControl.valueChanges.subscribe(() => {
      this.buscarLancamentos();
    });

    this.contaSelecionadaControl.valueChanges.subscribe(() => {
      this.buscarLancamentos();
    });
  }

  buscarContas() {
    buscarContas().then((response: any) => {
      this.listaContas = response.data ?? [];
      if (this.listaContas.length) {
        this.contaSelecionadaControl.setValue(this.listaContas[0], { emitEvent: true });
        // valueChanges dispara ao setValue e chama buscarLancamentos() com a conta selecionada.
      } else {
        this.contaSelecionadaControl.setValue(null, { emitEvent: false });
        this.lancamentoList.data = [];
      }
    });
  }

  buscarLancamentos() {
    const queryBuscaLancamentos = {
      ano: this.anoControl.value,
      mes: this.mesControl.value,
      idConta: this.contaSelecionadaControl.value?.idConta
    }

    buscarLancamentos(queryBuscaLancamentos).then((response: any) => {
      if (response.status === 200) {
        const data = response.data.flatMap((retorno: any) => {
          return retorno.parcelas.map((lancamento: any) => {
            const tipo = retorno.tipo as string;
            const nominalParcela = Number(lancamento.valor);
            const va = Number(lancamento.valorAcrescimoAcumulado ?? 0);
            const lancamentoItem = {
              ...lancamento,
              idParcela: lancamento.idParcela,
              idLancamento: retorno.idLancamento,
              descricao: retorno.descricao,
              dataEmissao: retorno.dataEmissao || retorno.dataInclusao,
              dataVencimento: lancamento.dataVencimento,
              tipo,
              numeroParcela: `${lancamento.numeroParcela}/${retorno.totalParcelas}`,
              valorParcelaNominal: nominalParcela,
              valorAcrescimoAcumulado: va,
              valorTotalParcela: nominalParcela + va,
              meioPagamento: lancamento.meioPagamento,
              status: lancamento.status,
              idConta: lancamento.movimentacao?.idConta,
            };
            return lancamentoItem;
          });

        }, []);

        this.lancamentoList.data = data;
      }
    });
  }

  /** Importação temporária de histórico via CSV. */
  importarCsvHistorico() {
    this.dialog
      .open(ImportarCsvHistoricoDialogComponent, {
        width: 'min(560px, 95vw)',
        maxHeight: '90vh',
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.buscarLancamentos();
          this.buscarContas();
        }
      });
  }

  adicionarLancamento() {
    this.dialog.open(ContasPagarReceberCadastroComponent, {
      width: 'min(720px, 95vw)',
      maxHeight: '90vh',
      panelClass: 'contas-pagar-receber-cadastro-dialog',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: {
        onRegistrado: () => {
          this.buscarLancamentos();
          this.buscarContas();
        },
      },
    }).afterClosed().subscribe(() => {
      this.buscarLancamentos();
      this.buscarContas();
    });
  }

  realizarPagamento(event: any) {
    this.lancamentoSelecionado = event;
    this.dialog.open(ContasPagarReceberEditComponent, {
      width: 'min(720px, 95vw)',
      maxHeight: '90vh',
      panelClass: 'contas-pagar-receber-edit-dialog',
      enterAnimationDuration: `100ms`,
      exitAnimationDuration: `100ms`,
      data: event
    }).afterClosed().subscribe(() => {
      this.buscarLancamentos();
      this.buscarContas();
      this.lancamentoSelecionado = null;
    });
  }

  editarLancamento(event: any) {
    if (!event.idLancamento) {
      console.error('ID do lançamento não encontrado');
      return;
    }

    buscarLancamentoPorId(event.idLancamento).then((response: any) => {
      if (response.status === 200) {
        this.dialog.open(ContasPagarReceberEditLancamentoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
          data: response.data
        }).afterClosed().subscribe(() => {
          this.buscarLancamentos();
          this.buscarContas();
        });
      }
    });
  }

  getRowClass = (row: any) => {
    if (row.status === 'CANCELADO') {
      return { 'linha-cancelada': true };
    }
    return {};
  }
}


export interface LancamentoElement {
  data?: string;
  descricao: string;
}
