import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { buscarRelatorio } from 'src/services/trabalho.service';
import { MatTableDataSource } from '@angular/material/table';
import { Canvas, Columns, Img, Item, Line, PdfMakeWrapper, Polyline, Stack, Table, Txt } from 'pdfmake-wrapper';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { envFront } from 'src/services/envfile';
import { BehaviorSubject } from 'rxjs';

(pdfMake as any).vfs = pdfFonts;

@Component({
  selector: 'app-relatorio',
  templateUrl: './relatorio.component.html',
  styleUrl: './relatorio.component.sass'
})
export class RelatorioComponent {
  trabalhosConcluidosList: any = [];
  listaTrabalhoExibicao = new MatTableDataSource<any>([]);
  listaRetrabalhosExibicao = new MatTableDataSource<any>([]);
  listaBonificadosExibicao = new MatTableDataSource<any>([]);
  listaBaixasExibicao = new MatTableDataSource<any>([]);
  valorTotalServicos = 0;
  totalFaturados = 0;
  totalRetrabalhos = 0;
  totalBonificados = 0;
  empresaList: any = [];
  empresas$ = new BehaviorSubject<any[]>([]);

  statusTrabalhoControl = new FormControl<string[]>({value: [], disabled: false} );
  statusTrabalhoList: string[] =  [
    "PENDENTE",
    "MODELAGEM",
    "IMPRESSAO_PROVA",
    "IMPRESSAO_CARGA_CERAMICA",
    "IMPRESSAO_BIOSPLINT_PLACA",
    "FRESAGEM",
    "SINTERIZACAO",
    "MAQUIAGEM",
    "AGUARDANDO_COMPONENTE",
    "PACOTE",
    "AGUARDANDO_COLETA",
    "ENVIADO",
    "ENVIADO_PROVA",
    "PAGAMENTO_RECEBIDO",
    "CANCELADO"
  ];

  empresaNomeControl = new FormControl<number | null>(null);
  tipoRelatorioControl = new FormControl<string>({value: '', disabled: false} );
  rangeDateProcessoSeletivo = new FormGroup({
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null),
  });

  trabalhos: any = { faturados: [], retrabalhos: [], bonificados: [] };

  displayedColumnsComponentes = [
    { coluna: "id", titulo: "Id" },
    { coluna: "dataConclusao", titulo: "Data" },
    { coluna: "nome", titulo: "Nome" },
    // { coluna: "dentista", titulo: "Dentista" },
    { coluna: "descricao", titulo: "Descrição" },
    { coluna: "status", titulo: "Status" },
    { coluna: "quantidade", titulo: "Quantidade" },
    { coluna: "valorUnitario", titulo: "Vl. Unit.", price: 'BRL' },
    { coluna: "valorTotal", titulo: "Vl. Total", price: 'BRL' },
  ];

  displayedColumnsServico = [
    { coluna: "id", titulo: "Id" },
    { coluna: "dataConclusao", titulo: "Data" },
    { coluna: "nome", titulo: "Nome" },
    // { coluna: "dentista", titulo: "Dentista" },
    { coluna: "descricao", titulo: "Descrição" },
    { coluna: "status", titulo: "Status" },
    { coluna: "quantidade", titulo: "Quantidade" },
    { coluna: "valorUnitario", titulo: "Vl. Unit.", price: 'BRL' },
    { coluna: "valorTotal", titulo: "Vl. Total", price: 'BRL' },
  ];

  displayedColumnsBaixas = [
    { coluna: "id", titulo: "Id" },
    { coluna: "dataConclusao", titulo: "Data Resolução" },
    { coluna: "nome", titulo: "Nome" },
    { coluna: "descricao", titulo: "Descrição" },
    { coluna: "status", titulo: "Status" },
    { coluna: "quantidade", titulo: "Quantidade" },
    { coluna: "valorUnitario", titulo: "Vl. Unit.", price: 'BRL' },
    { coluna: "valorTotal", titulo: "Vl. Total", price: 'BRL' },
  ];

  constructor(private router: Router, private dialog: MatDialog, public themeService: CustomizerSettingsService, private dateAdapter: DateAdapter<any>) {
    this.dateAdapter.setLocale('pt-br');
    this.loadEmpresas();
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      if (response.status === 200) {
        this.empresaList = response.data;
        this.empresaList.unshift({ idEmpresa: -1, nome: "Todas" });
        this.empresas$.next(this.empresaList);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  }

  buscar() {
    const empresaId = this.empresaNomeControl.value;
    const statusTrabalho: string[] = this.statusTrabalhoControl.value || [];
    const {dataInicio, dataFim} = this.rangeDateProcessoSeletivo.value;
    const tipoRelatorio = this.tipoRelatorioControl.value;
    this.valorTotalServicos = 0;
    this.totalFaturados = 0;
    this.totalRetrabalhos = 0;
    this.totalBonificados = 0;

    this.listaTrabalhoExibicao.data = [];
    this.listaRetrabalhosExibicao.data = [];
    this.listaBonificadosExibicao.data = [];
    this.listaBaixasExibicao.data = [];

    if (!empresaId || !dataInicio || !dataFim || !tipoRelatorio) {
      return alert("Necessário preencher campos");
    }

    // Converte empresaId para string, pois buscarRelatorio espera string
    const empresaIdString = empresaId.toString();
    buscarRelatorio(empresaIdString, statusTrabalho, dataInicio, dataFim).then((response: any) => {
      if (response.status === 200) {
        this.trabalhos = response.data;

        const mappedFaturados: any[] = [];
        const mappedRetrabalhos: any[] = [];
        const mappedBonificados: any[] = [];

        const processTrabalho = (trabalho: any, targetList: any[], addVal: boolean) => {
          const items = trabalho.ordemServico?.itens || [];
          items.forEach((financeiroItem: any) => {
            if (financeiroItem.tipoCobranca === tipoRelatorio) {
              let descricao = financeiroItem.descricao;
              if (tipoRelatorio === 'servico') {
                const elementos = trabalho.servicos?.filter((servico: any) => {
                  return servico.idProduto === financeiroItem.idReferencia;
                })[0]?.elementos || [];
                if (elementos.length > 0) {
                  descricao += " | Elementos: " + elementos.map((ele: any) => ele.nome).join(', ');
                }
              }

              targetList.push({
                id: trabalho.idTrabalho,
                dataConclusao: trabalho.dataConclusao ? new Date(trabalho.dataConclusao).toLocaleDateString('pt-BR') : '',
                nome: trabalho.nomePaciente || trabalho.paciente?.nome || 'N/A',
                descricao: descricao,
                status: trabalho.status,
                quantidade: financeiroItem.quantidade,
                valorUnitario: financeiroItem.valor,
                valorTotal: financeiroItem.valorTotal,
              });

              if (addVal) {
                this.valorTotalServicos += parseFloat(financeiroItem.valorTotal);
              }
            }
          });
        };

        const faturadosList = this.trabalhos.faturados || [];
        const retrabalhosList = this.trabalhos.retrabalhos || [];
        const bonificadosList = this.trabalhos.bonificados || [];

        faturadosList.forEach((trabalho: any) => processTrabalho(trabalho, mappedFaturados, true));
        retrabalhosList.forEach((trabalho: any) => processTrabalho(trabalho, mappedRetrabalhos, false));
        bonificadosList.forEach((trabalho: any) => processTrabalho(trabalho, mappedBonificados, false));

        const mappedBaixas: any[] = [];
        const baixasList = this.trabalhos.baixas || [];
        baixasList.forEach((devolucao: any) => {
          mappedBaixas.push({
            id: devolucao.ordemServicoItem?.ordemServico?.idTrabalho || devolucao.idDevolucao,
            dataConclusao: devolucao.dataConferencia ? new Date(devolucao.dataConferencia).toLocaleDateString('pt-BR') : '',
            nome: devolucao.ordemServicoItem?.ordemServico?.trabalho?.nomePaciente || 'N/A',
            descricao: devolucao.ordemServicoItem?.descricao || 'N/A',
            status: 'BAIXADO',
            quantidade: devolucao.quantidadeDevolvida,
            valorUnitario: devolucao.ordemServicoItem?.valor,
            valorTotal: (devolucao.ordemServicoItem?.valor * devolucao.quantidadeDevolvida) || 0
          });
        });

        this.listaTrabalhoExibicao.data = mappedFaturados;
        this.listaRetrabalhosExibicao.data = mappedRetrabalhos;
        this.listaBonificadosExibicao.data = mappedBonificados;
        this.listaBaixasExibicao.data = mappedBaixas;

        this.totalFaturados = faturadosList.length;
        this.totalRetrabalhos = retrabalhosList.length;
        this.totalBonificados = bonificadosList.length;
      }
    });
  }

  async imprimir() {
    const idEmpresa = this.empresaNomeControl.value;

    const empresa = this.empresaList.find((empresa: any) => empresa.idEmpresa === idEmpresa) || { nome: 'Todas' };
    const {dataInicio, dataFim} = this.rangeDateProcessoSeletivo.value;
    let dataInicioMontada, dataFimMontada;

    if (dataInicio && dataFim) {
      dataInicioMontada = dataInicio.toLocaleDateString('pt-BR');
      dataFimMontada = dataFim.toLocaleDateString('pt-BR');
    }

    const pdf = new PdfMakeWrapper();

    pdf.images({
      logo: await new Img(`${envFront.BASE_URL}/assets/img/icone-odontoprint-50x50.png`).build(),
    });

    pdf.pageOrientation('landscape');
    pdf.pageMargins([ 40, 70, 40, 20 ]);

    const tipoRelatorio = this.tipoRelatorioControl.value;
    let tituloRelatorio = ''

    if (tipoRelatorio === 'componente') {
      tituloRelatorio = 'Lista de trabalhos - Componentes'
    } else {
      tituloRelatorio = 'Lista de trabalhos - Serviços'
    }

    const headerPage = new Columns([
      await new Img('logo', true).margin([50, 10, 0, 10]).build(),
      new Stack([
          new Txt(tituloRelatorio).margin([0, 10, 0, 0]).alignment('center').bold().end,
          new Txt(`Cliente: ${empresa.nome}`).margin([0, 5, 0, 0]).fontSize(10).alignment('left').end,
          new Txt(`Referência: ${dataInicioMontada} à ${dataFimMontada}`).margin([0, 0, 0, 0]).fontSize(10).alignment('left').end
        ]
      ).width('720').end
    ]).end;

    pdf.header(headerPage)
    pdf.footer((currentPage: number, pageCount: number) => {
      return new Txt(`Página ${currentPage} de ${pageCount}`).alignment('center').fontSize(10).end;
    });

    const buildDados = (listaExibicao: any[]) => [
      ['ID', 'Data', 'Nome', 'Descrição', 'Status', 'Quantidade', 'Vl. Unit.', 'Vl. Total'],
      ...listaExibicao.map(trabalho => [
        trabalho.id,
        trabalho.dataConclusao,
        trabalho.nome,
        trabalho.descricao,
        trabalho.status,
        trabalho.quantidade,
        trabalho.valorUnitario,
        trabalho.valorTotal,
      ])
    ];

    pdf.styles({
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
      },
    });

    pdf.add(new Canvas([new Polyline([
      { x: 0, y: -5 },
      { x: 761, y: -5 },
      { x: 761, y: -65 },
      { x: 0, y: -65 },
      { x: 0, y: -5 },
    ]).lineColor('#51b0d7').end]).end)
    pdf.add(new Canvas([new Line([70, -65], [70, -5]).lineColor('#51b0d7').end]).end)

    if (this.listaTrabalhoExibicao.data.length > 0) {
      pdf.add(new Txt('Trabalhos Faturados').fontSize(14).bold().margin([0, 10, 0, 5]).end);
      pdf.add(
        new Table(buildDados(this.listaTrabalhoExibicao.data)).layout({
          fillColor: () => '#FFF',
          hLineColor: () => '#51b0d7',
          vLineColor: () => '#51b0d7'
        }).end
      );
    }

    if (this.listaRetrabalhosExibicao.data.length > 0) {
      pdf.add(new Txt('Retrabalhos').fontSize(14).bold().margin([0, 15, 0, 5]).end);
      pdf.add(
        new Table(buildDados(this.listaRetrabalhosExibicao.data)).layout({
          fillColor: () => '#FFF',
          hLineColor: () => '#51b0d7',
          vLineColor: () => '#51b0d7'
        }).end
      );
    }

    if (this.listaBonificadosExibicao.data.length > 0) {
      pdf.add(new Txt('Bonificações').fontSize(14).bold().margin([0, 15, 0, 5]).end);
      pdf.add(
        new Table(buildDados(this.listaBonificadosExibicao.data)).layout({
          fillColor: () => '#FFF',
          hLineColor: () => '#51b0d7',
          vLineColor: () => '#51b0d7'
        }).end
      );
    }

    if (this.listaBaixasExibicao.data.length > 0) {
      pdf.add(new Txt('Histórico de Devoluções').fontSize(14).bold().margin([0, 15, 0, 5]).end);
      pdf.add(
        new Table(buildDados(this.listaBaixasExibicao.data)).layout({
          fillColor: () => '#FFF',
          hLineColor: () => '#51b0d7',
          vLineColor: () => '#51b0d7'
        }).end
      );
    }

    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.valorTotalServicos);

    pdf.add(new Txt(`Valor Total: ${formatado}`).margin([0, 15, 0, 0]).fontSize(16).bold().alignment('right').end)

    pdf.create().download();
  }


}
