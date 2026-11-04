import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Fatura, FaturaService, MoverOrdemServicoPayload, PagarItensPayload } from 'src/services/financeiro.fatura.service';
import { ConfirmacaoDialogComponent } from 'src/app/components/common/componentsconfirmacao-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DevolucaoComponenteService, SolicitarDevolucaoPayload } from 'src/services/devolucao-componente.service';
import { forkJoin } from 'rxjs';
import { TrocarFaturaDialogComponent } from './trocar-fatura-dialog.component';
import { AlterarCompetenciaFaturaDialogComponent } from '../alterar-competencia-fatura-dialog/alterar-competencia-fatura-dialog.component';
import { DividirFaturaDialogComponent } from './dividir-fatura-dialog.component';
import { FaturaDetalhamentoImpressaoComponent } from './fatura-detalhamento-impressao.component';
import { AplicarDescontoDialogComponent } from './aplicar-desconto-dialog.component';
import { ReciboPagamentoDialogComponent } from './recibo-pagamento-dialog.component';
import { DescontoDevolucaoComponentesDialogComponent } from '../desconto-devolucao-componentes-dialog/desconto-devolucao-componentes-dialog.component';
import { FormControl } from '@angular/forms';
import { buscarCadastroComplementar, atualizarPagamentoCadastroComplementar } from 'src/services/empresa.service';
import { listarBoletosAtrasados } from 'src/services/boleto-atrasado.service';
import { BoletosPendentesDialogComponent } from 'src/app/components/common/boletos-pendentes-dialog/boletos-pendentes-dialog.component';



@Component({
  selector: 'app-fatura-detalhes',
  templateUrl: './fatura-detalhes.component.html',
  styleUrls: ['./fatura-detalhes.component.sass']
})
export class FaturaDetalhesComponent implements OnInit {
  formDevolucao: FormGroup;
  private faturaFoiAlterada = false;

  diaPagamentoControl = new FormControl<number | null>(null);
  tipoPagamentoControl = new FormControl<string | null>(null);
  quantidadeParcelasControl = new FormControl<number | null>(null);

  boletosAtrasadosCount = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public fatura: Fatura,
    private router: Router,
    private dialog: MatDialog,
    private faturaService: FaturaService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<FaturaDetalhesComponent>,
    private fb: FormBuilder,
    private devolucaoComponenteService: DevolucaoComponenteService,
    private cdr: ChangeDetectorRef
  ) {
    this.formDevolucao = this.fb.group({
      ordensDeServico: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.buildDevolucaoForm();
    const idEmp = this.fatura?.empresa?.idEmpresa || (this.fatura?.empresa as any)?.id;
    if (idEmp) {
      this.loadCadastroComplementar(idEmp.toString());
      this.verificarPendencias(idEmp);
    }

    this.diaPagamentoControl.valueChanges.subscribe(() => {
      this.salvarPagamento();
    });

    this.tipoPagamentoControl.valueChanges.subscribe(() => {
      this.salvarPagamento();
    });

    this.quantidadeParcelasControl.valueChanges.subscribe(() => {
      this.salvarPagamento();
    });
  }

  async loadCadastroComplementar(idEmpresa: string) {
    try {
      const response = await buscarCadastroComplementar(idEmpresa);
      if (response && response.data) {
        this.diaPagamentoControl.setValue(response.data.diaPagamento, { emitEvent: false });
        this.tipoPagamentoControl.setValue(response.data.tipoPagamento, { emitEvent: false });
        this.quantidadeParcelasControl.setValue(response.data.quantidadeParcelas, { emitEvent: false });
      }
    } catch (error) {
      console.error('Erro ao carregar cadastro complementar', error);
    }
  }

  async verificarPendencias(idEmpresa: number) {
    try {
      const response = await listarBoletosAtrasados(idEmpresa);
      console.log('Boletos Atrasados encontrados:', response.data);
      this.boletosAtrasadosCount = response.data?.length || 0;
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Erro ao verificar pendencias', e);
    }
  }

  abrirPendencias() {
    const idEmpresa = this.fatura?.empresa?.idEmpresa || (this.fatura?.empresa as any)?.id;
    if (!idEmpresa) return;
    const empresaNome = this.nomeFantasia;
    
    this.dialog.open(BoletosPendentesDialogComponent, {
      width: '800px',
      data: { idEmpresa: idEmpresa, nomeEmpresa: empresaNome }
    });
  }

  async salvarPagamento() {
    const idEmpresa = this.fatura?.empresa?.idEmpresa || (this.fatura?.empresa as any)?.id;
    if (!idEmpresa) return;

    try {
      await atualizarPagamentoCadastroComplementar(
        idEmpresa.toString(),
        this.diaPagamentoControl.value,
        this.tipoPagamentoControl.value,
        this.quantidadeParcelasControl.value
      );
      this.snackBar.open('Configurações de pagamento salvas com sucesso!', 'Fechar', { duration: 3000 });
    } catch (error) {
      console.error('Erro ao salvar configurações de pagamento', error);
      this.snackBar.open('Falha ao salvar configurações de pagamento.', 'Fechar', { duration: 3000 });
    }
  }

  get nomeFantasia(): string {
    const e = this.fatura?.empresa as any;
    return e?.nomeFantasia ?? e?.nome ?? this.fatura?.nomeEmpresa ?? '';
  }

  get cnpjEmpresa(): string {
    const e = this.fatura?.empresa as any;
    return e?.documento ?? e?.cnpj ?? '';
  }

  get telefoneEmpresa(): string {
    const e = this.fatura?.empresa as any;
    return e?.telefone ? String(e.telefone) : '';
  }

  get contatoRestanteEmpresa(): string {
    const e = this.fatura?.empresa as any;
    const partes: string[] = [];
    if (e?.email) partes.push(e.email);
    if (e?.nomeResponsavel) partes.push(e.nomeResponsavel);
    return partes.join(' | ');
  }

  get contatoEmpresa(): string {
    const tel = this.telefoneEmpresa;
    const rest = this.contatoRestanteEmpresa;
    return rest ? `${tel ? tel + ' | ' : ''}${rest}` : tel;
  }

  get whatsappLink(): string {
    const e = this.fatura?.empresa as any;
    const tel = e?.telefone;
    if (!tel) return '';
    let digits = String(tel).replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length <= 11) digits = '55' + digits;
    return digits ? `whatsapp://send/?phone=${digits}&text&type=phone_number&app_absent=0` : '';
  }

  get contatoFinanceiroNome(): string {
    const e = this.fatura?.empresa as any;
    return e?.nomeResponsavelFinanceiro ?? '';
  }

  get contatoFinanceiroTelefone(): string {
    const e = this.fatura?.empresa as any;
    return e?.telefoneFinanceiro ? String(e.telefoneFinanceiro) : '';
  }

  get contatoFinanceiroEmail(): string {
    const e = this.fatura?.empresa as any;
    return e?.emailFinanceiro ?? '';
  }

  get whatsappLinkFinanceiro(): string {
    const e = this.fatura?.empresa as any;
    const tel = e?.telefoneFinanceiro;
    if (!tel) return '';
    let digits = String(tel).replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length <= 11) digits = '55' + digits;
    return digits ? `whatsapp://send/?phone=${digits}&text&type=phone_number&app_absent=0` : '';
  }

  get temContatoFinanceiro(): boolean {
    return !!(this.contatoFinanceiroNome || this.contatoFinanceiroTelefone || this.contatoFinanceiroEmail);
  }

  get ordensDeServicoFormArray(): FormArray {
    return this.formDevolucao.get('ordensDeServico') as FormArray;
  }

  buildDevolucaoForm(): void {
    const osFormArray = this.ordensDeServicoFormArray;
    this.fatura.ordensDeServico?.forEach(os => {
      const itensFormArray = this.fb.array([]);
      (os.itens || []).forEach(item => {
        const quantidadeDevolvida = item.devolucoes?.reduce((acc, dev) => acc + dev.quantidadeDevolvida, 0) || 0;
        const quantidadeRestante = Math.max(0, item.quantidade - quantidadeDevolvida);

        const itemGroup = this.fb.group({
          idOrdemServicoItem: [item.idOrdemServicoItem],
          pagar: [{ value: false, disabled: false }], // Inicia habilitado e a lógica abaixo controla
          selecionado: [{ value: false, disabled: false }], // Inicia habilitado
          quantidadeDevolver: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(quantidadeRestante)]],
          tipoCobranca: [item.tipoCobranca]
        });
        const isTotalmenteDevolvido = quantidadeRestante <= 0;
        const isPago = item.status === 'PAGO';
        const isZerado = parseFloat(item.valor) === 0;

        itemGroup.get('pagar')?.disable({ emitEvent: false }); // Começa desabilitado e é habilitado se necessário
        if (isPago || isZerado || isTotalmenteDevolvido) {
          if(isPago) itemGroup.get('pagar')?.patchValue(true, { emitEvent: false });
        } else {
          itemGroup.get('pagar')?.enable({ emitEvent: false });
        }

        if (item.devolucoes && quantidadeDevolvida > 0) {
          const qtdCtrl = itemGroup.get('quantidadeDevolver');
          itemGroup.patchValue(
            {
              selecionado: true,
              quantidadeDevolver: quantidadeDevolvida
            },
            { emitEvent: false }
          );
          qtdCtrl?.enable({ emitEvent: false });
          qtdCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(quantidadeRestante)]);
          qtdCtrl?.updateValueAndValidity({ emitEvent: false });
        }

        if (item.tipoCobranca.toLowerCase() === 'componente' && !isTotalmenteDevolvido && !isPago) {
          itemGroup.get('selecionado')?.valueChanges.subscribe(selecionado => {
            const qtdControl = itemGroup.get('quantidadeDevolver');
            if (selecionado) {
              qtdControl?.enable();
              qtdControl?.setValidators([Validators.required, Validators.min(1), Validators.max(quantidadeRestante)]);
              qtdControl?.setValue(quantidadeRestante > 0 ? quantidadeRestante : 1);
            } else {
              qtdControl?.disable();
              qtdControl?.clearValidators();
              qtdControl?.setValue(0);
            }
            qtdControl?.updateValueAndValidity();
          });
        } else {
          itemGroup.get('selecionado')?.disable({ emitEvent: false });
        }

        // Lógica para desabilitar checkboxes mutuamente
        const pagarControl = itemGroup.get('pagar');
        const selecionadoControl = itemGroup.get('selecionado');

        if (!isPago && !isTotalmenteDevolvido) {
          pagarControl?.valueChanges.subscribe(checked => {
            if (checked) {
              selecionadoControl?.disable({ emitEvent: false });
            } else if (item.tipoCobranca.toLowerCase() === 'componente' && !isTotalmenteDevolvido && !isPago) {
              selecionadoControl?.enable({ emitEvent: false });
            }
          });

          selecionadoControl?.valueChanges.subscribe(checked => {
            if (checked) {
              pagarControl?.disable({ emitEvent: false });
            } else if (!isPago && !isZerado) {
              pagarControl?.enable({ emitEvent: false });
            }
          });
        }

        itensFormArray.push(itemGroup as any);
      });

      osFormArray.push(this.fb.group({
        idOrdemServico: [os.idOrdemServico],
        itens: itensFormArray
      }));
    });
  }

  abrirTrabalho(idPaciente: number, event: MouseEvent) {
    event.stopPropagation();
    const url = this.router.serializeUrl(this.router.createUrlTree([`/l/paciente/edit/${idPaciente}`]));
    window.open(url, '_blank');
  }

  confirmarFechamentoFatura(): void {
    const dialogConfirmRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Fechamento',
        mensagem: `Deseja realmente fechar a fatura #${this.fatura.idFatura}? Esta ação não pode ser desfeita.`
      }
    });

    dialogConfirmRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.faturaService.fecharFatura(this.fatura.idFatura).subscribe({
          next: () => {
            this.snackBar.open('Fatura fechada com sucesso!', 'Fechar', { duration: 3000 });
            this.dialogRef.close({ faturaAlterada: true });
          },
          error: (err) => {
            console.error('Erro ao fechar fatura', err);
            this.snackBar.open(err?.error?.resposta || 'Falha ao fechar a fatura. Tente novamente.', 'Fechar', {
              duration: 5000
            });
          }
        });
      }
    });
  }

  podeReabrirFatura(): boolean {
    return this.fatura?.status === 'PAGA' || this.fatura?.status === 'PAGA_PARCIALMENTE';
  }

  reabrirFatura(): void {
    const dialogConfirmRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Reabrir Fatura',
        mensagem: `Deseja reabrir a fatura #${this.fatura.idFatura}? Os lançamentos no financeiro serão estornados, os valores pagos da fatura e dos itens serão zerados, a fatura voltará para "Aberta" e os trabalhos para status "Enviado".`
      }
    });

    dialogConfirmRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.faturaService.reabrirFatura(this.fatura.idFatura).subscribe({
          next: () => {
            this.snackBar.open('Fatura reaberta com sucesso!', 'Fechar', { duration: 3000 });
            this.dialogRef.close({ faturaAlterada: true });
          },
          error: (err) => {
            console.error('Erro ao reabrir fatura', err);
            this.snackBar.open(err?.error?.resposta || err?.error?.message || 'Falha ao reabrir a fatura. Tente novamente.', 'Fechar', {
              duration: 5000
            });
          }
        });
      }
    });
  }

  abrirModalDevolucao(): void {
    const itensSelecionados = this.ordensDeServicoFormArray.value
      .flatMap((os: any) => os.itens)
      .filter((item: any) => item.selecionado && item.quantidadeDevolver > 0)
      .map((item: any) => ({
        idOrdemServicoItem: item.idOrdemServicoItem,
        quantidade: item.quantidadeDevolver,
        // Adiciona a descrição para exibir no modal de resumo
        descricao: (this.fatura.ordensDeServico || [])
          .flatMap(os => os.itens)
          .find(i => i.idOrdemServicoItem === item.idOrdemServicoItem)?.descricao || 'Item não encontrado'
      }));

    if (itensSelecionados.length === 0) {
      this.snackBar.open('Selecione ao menos um item e especifique a quantidade para devolução.', 'Fechar', { duration: 4000 });
      return;
    }

    const dialogConfirmRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar Solicitação de Devolução',
        mensagem: `Deseja realmente solicitar a devolução dos itens selecionados?`
      }
    });

    dialogConfirmRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        // const observacao = prompt('Adicione uma observação para a devolução (opcional):'); // Temporary prompt

        const payload: SolicitarDevolucaoPayload = {
          idFatura: this.fatura.idFatura,
          itens: itensSelecionados.map((item: any) => ({ idOrdemServicoItem: item.idOrdemServicoItem, quantidade: item.quantidade })),
          observacao: undefined
        };

        this.devolucaoComponenteService.solicitar(payload).subscribe({
          next: () => {
            this.snackBar.open('Solicitação de devolução enviada com sucesso!', 'Fechar', { duration: 3000 });
            this.faturaFoiAlterada = true;
            this.refreshFaturaData();
          },
          error: (err) => {
            console.error('Erro ao solicitar devolução', err);
            this.snackBar.open(err?.error?.resposta || 'Falha ao solicitar devolução. Tente novamente.', 'Fechar', {
              duration: 5000
            });
          }
        });
      }
    });
  }

  /**
   * Quantidade ainda elegível para nova solicitação de devolução nesta linha.
   */
  quantidadeRestanteParaDevolucao(item: any): number {
    const devolvida =
      item.devolucoes?.reduce((acc: number, dev: any) => acc + (dev.quantidadeDevolvida || 0), 0) || 0;
    return Math.max(0, (item.quantidade || 0) - devolvida);
  }

  /**
   * Clique na linha: para componentes, seleciona devolução e preenche a quantidade máxima possível.
   */
  onLinhaItemDevolucaoClick(osIndex: number, item: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (target.closest('mat-checkbox') || target.closest('.mat-mdc-checkbox') || target.closest('input')) {
      return;
    }
    if (item.tipoCobranca?.toLowerCase() !== 'componente') {
      return;
    }

    const os = this.fatura.ordensDeServico?.[osIndex];
    if (!os?.itens) {
      return;
    }

    const quantidadeRestante = this.quantidadeRestanteParaDevolucao(item);
    if (quantidadeRestante <= 0 || item.status === 'PAGO') {
      return;
    }

    const itemIdx = os.itens.findIndex(i => i.idOrdemServicoItem === item.idOrdemServicoItem);
    if (itemIdx < 0) {
      return;
    }

    const itensArray = this.ordensDeServicoFormArray.at(osIndex).get('itens') as FormArray;
    const itemGroup = itensArray.at(itemIdx);
    const selecionadoCtrl = itemGroup.get('selecionado');
    if (selecionadoCtrl?.disabled) {
      return;
    }

    const qtdCtrl = itemGroup.get('quantidadeDevolver');
    qtdCtrl?.enable();
    qtdCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(quantidadeRestante)]);
    selecionadoCtrl?.patchValue(true, { emitEvent: false });
    qtdCtrl?.setValue(quantidadeRestante);
    qtdCtrl?.updateValueAndValidity();
  }

  isDevolucaoSelecionada(): boolean {
    return this.ordensDeServicoFormArray.controls
      .flatMap((osGroup: any) => (osGroup.get('itens') as FormArray).controls)
      .some(itemControl => itemControl.get('selecionado')?.value);
  }

  isPagamentoSelecionado(): boolean {
    return this.ordensDeServicoFormArray.controls
      .flatMap((osGroup: any) => (osGroup.get('itens') as FormArray).controls)
      .some(itemControl => itemControl.get('pagar')?.value && !itemControl.get('pagar')?.disabled);
  }

  realizarBaixaPagamento(): void {
    const itensParaPagar = this.ordensDeServicoFormArray.controls
      .flatMap((osGroup: any) => (osGroup.get('itens') as FormArray).controls)
      .filter(itemControl => itemControl.get('pagar')?.value && !itemControl.get('pagar')?.disabled);

    if (itensParaPagar.length === 0) {
      this.snackBar.open('Selecione ao menos um item para realizar a baixa.', 'Fechar', { duration: 4000 });
      return;
    }

    // TODO: Abrir um modal para coletar os dados de pagamento (idConta, dataPagamento, meioPagamento)
    // Por enquanto, usaremos valores fixos como exemplo.
    const dadosPagamento = {
      idConta: 7,
      dataPagamento: new Date().toISOString().split('T')[0], // Hoje
      meioPagamento: 'PIX'
    };

    const itensPayload = itensParaPagar.map(itemControl => {
      const itemOriginal = this.fatura.ordensDeServico
        ?.flatMap(os => os.itens)
        .find(i => i.idOrdemServicoItem === itemControl.get('idOrdemServicoItem')?.value);

      const valorUnitario = parseFloat(itemOriginal?.valor || '0') / (itemOriginal?.quantidade || 1);
      const quantidadeDevolvida = itemOriginal?.devolucoes?.reduce((acc, dev) => acc + dev.quantidadeDevolvida, 0) || 0;
      const quantidadeAPagar = (itemOriginal?.quantidade || 0) - quantidadeDevolvida;
      const valorAPagar = quantidadeAPagar * valorUnitario;

      return {
        idOrdemServicoItem: itemControl.get('idOrdemServicoItem')?.value,
        valor: valorAPagar > 0 ? valorAPagar : 0,
      };
    });

    const payload: PagarItensPayload = {
      idFatura: this.fatura.idFatura,
      ...dadosPagamento,
      itens: itensPayload
    };

    if (payload.itens.length > 0) {
      this.faturaService.pagarItensFatura(payload).subscribe({
        next: () => {
          this.snackBar.open(`${payload.itens.length} item(ns) pagos com sucesso!`, 'Fechar', { duration: 3000 });
          this.faturaFoiAlterada = true;

          // Atualiza o status dos itens pagos no objeto local da fatura
          const idsPagos = itensParaPagar.map(control => control.get('idOrdemServicoItem')?.value);
          this.fatura.ordensDeServico?.forEach(os => {
            os.itens.forEach(item => {
              if (idsPagos.includes(item.idOrdemServicoItem)) {
                item.status = 'PAGO';
              }
            });
          });

          // Limpa e reconstrói o formulário para refletir as alterações
          this.ordensDeServicoFormArray.clear();
          this.buildDevolucaoForm();
        },
        error: (err) => {
          console.error('Erro ao realizar baixa de pagamento', err);
          this.snackBar.open(err?.error?.resposta || 'Falha ao realizar a baixa de um ou mais itens.', 'Fechar', {
            duration: 5000
          });
        }
      });
    }
  }

  fecharDialog(): void {
    this.dialogRef.close({ faturaAlterada: this.faturaFoiAlterada });
  }

  private refreshFaturaData() {
    this.faturaService.buscarFaturaPorId(this.fatura.idFatura).subscribe({
      next: (faturaAtualizada) => {
        this.fatura = faturaAtualizada;
        this.ordensDeServicoFormArray.clear();
        this.buildDevolucaoForm();
        this.snackBar.open('Dados da fatura atualizados.', 'Fechar', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('Falha ao atualizar dados da fatura. Por favor, feche e abra novamente.', 'Fechar', { duration: 5000 });
        this.dialogRef.close({ faturaAlterada: true }); // Fecha como fallback em caso de erro na atualização
      }
    });
  }

  /**
   * Situação do item na fatura (destaque para componentes com devolução solicitada/pendente).
   */
  rotuloSituacaoItem(item: any): string {
    const tipo = (item.tipoCobranca || '').toLowerCase();
    if (tipo !== 'componente') {
      return '—';
    }
    if (item.status === 'DEVOLVIDO') {
      return 'Devolvido';
    }
    const qDevRegistros =
      item.devolucoes?.reduce((acc: number, d: any) => acc + Number(d.quantidadeDevolvida || 0), 0) || 0;
    const qDev = qDevRegistros > 0 ? qDevRegistros : Number(item.quantidadeDevolvida || 0);
    const pendenteConferencia =
      item.status === 'DEVOLUCAO_SOLICITADA' ||
      (item.devolucoes || []).some((d: any) => d.status === 'PENDENTE');
    if (pendenteConferencia && qDev > 0) {
      return `Devolução solicitada (${qDev} un.)`;
    }
    return '—';
  }

  /** Destaque visual da linha: componente com devolução ainda em aberto (não conferida). */
  itemComponenteEmDevolucao(item: any): boolean {
    if ((item.tipoCobranca || '').toLowerCase() !== 'componente') {
      return false;
    }
    if (item.status === 'DEVOLVIDO') {
      return false;
    }
    const rotulo = this.rotuloSituacaoItem(item);
    return rotulo !== '—' && rotulo !== 'Devolvido';
  }

  getValorItem(item: any): { valorRestante: number; valorTotalDevolvido: number; totalmenteDevolvido: boolean } {
    const q = Number(item.quantidade || 0);
    const qDevLista = item.devolucoes?.reduce((acc: number, dev: any) => acc + Number(dev.quantidadeDevolvida || 0), 0) || 0;
    const qDev = qDevLista > 0 ? qDevLista : Number(item.quantidadeDevolvida || 0);
    const valorUnitario = q > 0 ? parseFloat(String(item.valor)) : 0;
    const valorLinhaOriginal = valorUnitario * q;
    const valorRestante = parseFloat(item.valorTotal || '0');
    const totalmenteDevolvido = q > 0 && qDev >= q;
    const valorTotalDevolvido = Math.max(0, valorLinhaOriginal - valorRestante);

    return {
      valorRestante: valorRestante > 0 ? valorRestante : 0,
      valorTotalDevolvido,
      totalmenteDevolvido,
    };
  }

  recalcularFatura(): void {
    this.faturaService.recalcular(this.fatura.idFatura).subscribe({
      next: () => {
        this.snackBar.open('Fatura recalculada, atualizando dados...', 'Fechar', { duration: 2000 });
        this.faturaFoiAlterada = true;
        this.refreshFaturaData();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.resposta || 'Falha ao recalcular a fatura.', 'Fechar', {
          duration: 5000
        });
      }
    });
  }

  abrirDetalhamentoImpressao(): void {
    this.dialog.open(FaturaDetalhamentoImpressaoComponent, {
      width: '90%',
      maxWidth: '1200px',
      data: { idFatura: this.fatura.idFatura }
    });
  }

  get valorPagoNumero(): number {
    return parseFloat(this.fatura?.valorPago ?? '0') || 0;
  }

  abrirReciboPagamento(): void {
    this.dialog.open(ReciboPagamentoDialogComponent, {
      width: '500px',
      data: {
        idFatura: this.fatura.idFatura,
        valorPago: this.valorPagoNumero,
        nomeEmpresa: this.nomeFantasia,
        dataVencimento: this.fatura.dataVencimento
      }
    });
  }

  trocarFaturaOrdemServico(os: any): void {
    const idEmpresa = os?.idEmpresa || (this.fatura as any).empresa?.idEmpresa || (this.fatura as any).idEmpresa;

    if (!idEmpresa) {
      this.snackBar.open('Não foi possível identificar a empresa da fatura.', 'Fechar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(TrocarFaturaDialogComponent, {
      width: '500px',
      data: {
        idFaturaAtual: this.fatura.idFatura,
        idOrdemServico: os.idOrdemServico,
        idEmpresa: idEmpresa
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      const confirmado = typeof resultado === 'boolean' ? resultado : resultado?.confirmado;
      if (confirmado) {
        const idDestino = resultado && typeof resultado === 'object' && resultado.idFaturaDestino ? resultado.idFaturaDestino : null;

        const payload: MoverOrdemServicoPayload = {
          idOrdemServico: os.idOrdemServico,
          idFaturaDestino: idDestino,
          idEmpresa: idEmpresa
        };

        this.faturaService.moverOrdemServico(payload).subscribe({
          next: () => {
            const mensagem = idDestino
              ? `Ordem de serviço movida para a Fatura #${idDestino} com sucesso!`
              : 'Ordem de serviço movida com sucesso!';
            this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
            this.faturaFoiAlterada = true;
            this.refreshFaturaData();
          },
          error: (err) => {
            console.error('Erro ao mover ordem de serviço', err);
            this.snackBar.open(
              err?.error?.resposta || err?.error?.message || 'Falha ao mover a ordem de serviço. Tente novamente.',
              'Fechar',
              { duration: 5000 }
            );
          }
        });
      }
    });
  }

  abrirAlterarCompetencia(): void {
    const idEmpresa = (this.fatura as any).empresa?.idEmpresa || (this.fatura as any).idEmpresa;
    const nomeEmpresa = this.nomeFantasia || this.fatura.nomeEmpresa || (this.fatura as any).empresa?.nome;

    const dialogRef = this.dialog.open(AlterarCompetenciaFaturaDialogComponent, {
      width: '540px',
      data: {
        fatura: this.fatura,
        idEmpresa: idEmpresa,
        nomeEmpresa: nomeEmpresa
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res?.sucesso) {
        this.faturaFoiAlterada = true;
        this.refreshFaturaData();
        // Se a fatura atual ficou vazia ou foi transferida para outra, podemos fechar o modal ou recarregar
        setTimeout(() => {
          this.refreshFaturaData();
        }, 500);
      }
    });
  }

  abrirModalDesconto(): void {
    const descontoAtual = (this.fatura as any).desconto || 0;
    const valorTotalFatura = parseFloat(this.fatura.valorTotal || '0');

    const dialogRef = this.dialog.open(AplicarDescontoDialogComponent, {
      width: '500px',
      data: {
        idFatura: this.fatura.idFatura,
        descontoAtual: descontoAtual,
        valorTotalFatura: valorTotalFatura
      }
    });

    dialogRef.afterClosed().subscribe(desconto => {
      if (desconto !== false && desconto !== undefined && desconto !== null) {
        this.faturaService.atualizarDesconto(this.fatura.idFatura, desconto).subscribe({
          next: (faturaAtualizada) => {
            this.snackBar.open('Desconto aplicado com sucesso!', 'Fechar', { duration: 3000 });
            this.faturaFoiAlterada = true;
            this.fatura = faturaAtualizada;
            // Atualiza o formulário se necessário
            this.ordensDeServicoFormArray.clear();
            this.buildDevolucaoForm();
          },
          error: (err) => {
            console.error('Erro ao aplicar desconto', err);
            const mensagemErro = err?.error?.message || err?.error?.resposta || 'Falha ao aplicar desconto. Tente novamente.';
            this.snackBar.open(mensagemErro, 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  abrirModalDevolucaoComponentes(): void {
    const dialogRef = this.dialog.open(DescontoDevolucaoComponentesDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      data: {
        idFatura: this.fatura.idFatura
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && res.alterado) {
        this.faturaFoiAlterada = true;
        this.refreshFaturaData();
      }
    });
  }

  private copiarTexto(texto: string, mensagemOk: string): void {
    navigator.clipboard.writeText(texto).then(
      () => this.snackBar.open(mensagemOk, 'Fechar', { duration: 3000 }),
      () => this.snackBar.open('Não foi possível copiar. Tente novamente.', 'Fechar', { duration: 3000 })
    );
  }

  copiarNomeClinica(): void {
    const nome = this.nomeFantasia || '';
    if (!nome) return;
    this.copiarTexto(nome, 'Nome da clínica copiado.');
  }

  copiarDocumentoClinica(): void {
    const cnpj = this.cnpjEmpresa || '';
    if (!cnpj) return;
    this.copiarTexto(cnpj, 'Documento/CNPJ copiado.');
  }

  copiarValorTrabalhos(): void {
    if (this.fatura?.valorTotal == null) return;
    const num = parseFloat(String(this.fatura.valorTotal));
    const valorSemCifrao = isNaN(num)
      ? ''
      : num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (!valorSemCifrao) return;
    this.copiarTexto(valorSemCifrao, 'Valor dos trabalhos copiado.');
  }

  salvarAnotacoes(): void {
    const anotacoesAtual = this.fatura.anotacoes || null;

    this.faturaService.atualizarAnotacoes(this.fatura.idFatura, anotacoesAtual).subscribe({
      next: (faturaAtualizada) => {
        this.fatura.anotacoes = faturaAtualizada.anotacoes;
        this.faturaFoiAlterada = true;
        // Não mostra snackbar para não ser intrusivo, já que é salvo automaticamente
      },
      error: (err) => {
        console.error('Erro ao salvar anotações', err);
        this.snackBar.open('Falha ao salvar anotações. Tente novamente.', 'Fechar', { duration: 3000 });
      }
    });
  }

  abrirModalDividir(): void {
    const dialogRef = this.dialog.open(DividirFaturaDialogComponent, {
      width: '600px',
      data: { fatura: this.fatura }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.faturaService.dividirFatura(this.fatura.idFatura, res).subscribe({
          next: (apiRes: any) => {
            this.snackBar.open('Fatura dividida com sucesso!', 'Fechar', { duration: 3000 });
            this.faturaFoiAlterada = true;
            // A resposta contém a fatura original atualizada e a nova fatura.
            // Atualiza a tela com os dados da fatura original
            if (apiRes && apiRes.original) {
              this.fatura = apiRes.original;
              this.ordensDeServicoFormArray.clear();
              this.buildDevolucaoForm();
            } else {
              this.refreshFaturaData();
            }
          },
          error: (err) => {
            console.error('Erro ao dividir fatura', err);
            const msg = err?.error?.resposta || err?.error?.message || 'Falha ao dividir fatura.';
            this.snackBar.open(msg, 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }
}
