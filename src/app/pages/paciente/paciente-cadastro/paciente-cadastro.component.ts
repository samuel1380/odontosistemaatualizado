import { Component, EventEmitter, Inject, Input, OnInit, OnChanges, Optional, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { lastValueFrom, BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PacienteService } from 'src/services/paciente.service';
import { buscaDentistaPorEmpresaId } from 'src/services/dentista.service';
import { buscarProdutos } from 'src/services/produto.service';
import { buscarElementosTrabalho } from 'src/services/elementosTrabalho.service';
import { buscarComponentes } from 'src/services/componente.service';

import { buscarEmpresas } from '../../../../services/empresa.service';
import { listarBoletosAtrasados } from 'src/services/boleto-atrasado.service';
import { BoletosPendentesDialogComponent } from 'src/app/components/common/boletos-pendentes-dialog/boletos-pendentes-dialog.component';
import { ConfirmacaoDialogComponent } from 'src/app/components/common/componentsconfirmacao-dialog.component';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { envFront } from 'src/services/envfile';

(pdfMake as any).vfs = pdfFonts;

interface Empresa {
  idEmpresa: any;
  id: string;
  nome: string;
}

interface Dentista {
  idDentista: string;
  nome: string;
}
@Component({
  selector: 'app-paciente-cadastro',
  templateUrl: './paciente-cadastro.component.html',
  styleUrl: './paciente-cadastro.component.sass'
})
export class PacienteCadastroComponent implements OnInit, OnChanges {
  form: FormGroup;
  empresas$ = new BehaviorSubject<Empresa[]>([]);
  dentistas$ = new BehaviorSubject<Dentista[]>([]);

  produtoList: any[] = [];
  allItensElementos$ = new BehaviorSubject<any[]>([]);
  allItensComponentes$ = new BehaviorSubject<any[]>([]);

  boletosAtrasadosCount = 0;

  isEditMode = false;
  private dadosCarregados = false;
  private ultimoIdCarregado: any = null;
  @Input() pacienteData: any;
  @Output() onSave = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    @Optional() public dialogRef: MatDialogRef<PacienteCadastroComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { empresaId: number, nome: string },
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      idEmpresa: [{ value: '', disabled: true }, Validators.required],
      idProfissional: ['', Validators.required],
      trabalhos: this.fb.array([])
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadEmpresas();
    await this.loadProdutos();
    await this.loadElementos();
    await this.loadComponentes();

    // Carrega dados apenas se não vierem via @Input (evita duplicação)
    // Se pacienteData vier via @Input, o ngOnChanges cuidará do carregamento
    if (this.pacienteData && !this.dadosCarregados) {
      // Primeira carga via @Input no ngOnInit
      await this.carregarDadosPaciente();
    } else if (!this.pacienteData && this.data) {
      this.form.patchValue({ nome: this.data.nome, idEmpresa: this.data.empresaId });
      // Carrega os dentistas com base na empresa passada para o diálogo
      await this.loadDentistas(this.data.empresaId);
      this.verificarPendencias(this.data.empresaId);
    }

    this.form.get('idEmpresa')?.valueChanges.subscribe(idEmpresa => {
      if (idEmpresa) {
        this.verificarPendencias(idEmpresa);
      } else {
        this.boletosAtrasadosCount = 0;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detecta mudanças no @Input pacienteData (ignora primeira mudança, pois ngOnInit cuida disso)
    if (changes['pacienteData'] && !changes['pacienteData'].firstChange) {
      const previousId = changes['pacienteData'].previousValue?.idPaciente;
      const currentId = this.pacienteData?.idPaciente;

      // Se o ID do paciente mudou, recarrega
      if (this.pacienteData && previousId !== currentId) {
        this.limparFormulario();
        this.carregarDadosPaciente();
      } else if (!this.pacienteData && previousId) {
        // Se o pacienteData foi removido, limpa o formulário
        this.limparFormulario();
      }
      // Se o ID não mudou, não recarrega (evita duplicação)
    }
  }

  limparFormulario(): void {
    // Limpa todos os trabalhos
    while (this.trabalhosFormArray.length !== 0) {
      this.trabalhosFormArray.removeAt(0);
    }

    // Reseta o formulário mantendo a estrutura
    this.form.patchValue({
      nome: '',
      idEmpresa: '',
      idProfissional: ''
    });

    this.isEditMode = false;
    this.dadosCarregados = false;
    this.ultimoIdCarregado = null;
  }

  async carregarDadosPaciente(): Promise<void> {
    if (!this.pacienteData) {
      return;
    }

    // Evita carregamento duplicado se já carregou o mesmo paciente
    if (this.dadosCarregados && this.pacienteData.idPaciente === this.ultimoIdCarregado) {
      return;
    }

    this.isEditMode = true;
    this.ultimoIdCarregado = this.pacienteData.idPaciente;

    // Garante que os dados básicos estão carregados
    if (!this.dadosCarregados) {
      await this.loadEmpresas();
      await this.loadProdutos();
      await this.loadElementos();
      await this.loadComponentes();
    }

    await this.loadDentistas(this.pacienteData.idEmpresa);

    this.form.patchValue({
      nome: this.pacienteData.nome,
      idEmpresa: this.pacienteData.idEmpresa,
      idProfissional: this.pacienteData.idProfissional
    });

    if (this.pacienteData.idEmpresa) {
      this.verificarPendencias(this.pacienteData.idEmpresa);
    }

    // Popula os trabalhos existentes
    if (this.pacienteData.trabalhos && this.pacienteData.trabalhos.length > 0) {
      for (const trabalho of this.pacienteData.trabalhos) {
        this.trabalhosFormArray.push(this.montarFormGroupTrabalhoAPartirDosDados(trabalho));
      }
    }

    this.form.get('idEmpresa')?.disable(); // Mantém desabilitado na edição
    this.dadosCarregados = true;
  }

  get trabalhosFormArray(): FormArray {
    return this.form.get('trabalhos') as FormArray;
  }

  /** Monta o FormGroup de um trabalho a partir do objeto vindo da API / pacienteData (inclui expansão de componentes por qtdItems). */
  private montarFormGroupTrabalhoAPartirDosDados(trabalho: any): FormGroup {
    const trabalhoFormGroup = this.createTrabalhoFormGroup(trabalho);
    const componentesFormArray = trabalhoFormGroup.get('componentes') as FormArray;
    (trabalho.componentes || []).forEach((componente: any) => {
      for (let i = 0; i < (componente.qtdItems || 1); i++) {
        componentesFormArray.push(this.createComponenteFormGroup(componente));
      }
    });
    return trabalhoFormGroup;
  }

  createTrabalhoFormGroup(trabalho: any = {}): FormGroup {
    // Define a estrutura do form group para um trabalho
    // Isso deve espelhar a estrutura esperada por app-trabalho-cadastro
    const form = this.fb.group({
      idTrabalho: [trabalho.idTrabalho || null],
      servicos: this.fb.array(
        (trabalho.servicos || []).map((servico: any) => this.createServicoFormGroup(servico))
      ),
      cor: [trabalho.cor || ''],
      status: [trabalho.status || 'PENDENTE'],
      componentes: this.fb.array([]), // Será populado separadamente para lidar com qtdItems
      observacao: [trabalho.observacao || ''],
      anotacoes: [trabalho.anotacoes || ''],
      retrabalho: [trabalho.retrabalho || false],
      bonificacao: [trabalho.bonificacao || false],
      motivosRetrabalhoIds: [trabalho.motivosRetrabalhoIds || []],
      motivosBonificacaoIds: [trabalho.motivosBonificacaoIds || []],
      editando: [!trabalho.idTrabalho], // Novo trabalho começa em modo de edição
      finalizado: [trabalho.finalizado || false]
    });

    if (trabalho.finalizado) {
      form.disable();
    }

    return form;
  }

  createServicoFormGroup(servico: any = {}): FormGroup {
    return this.fb.group({
      idServicoTrabalho: [servico.idServicoTrabalho || null],
      idProduto: [servico.idProduto || null, Validators.required],
      idTrabalho: [servico.idTrabalho || null],
      elementosControl: new FormControl([]), // Mantém o controle para o multiple-selection
      elementos: this.fb.array(
        (servico.elementos || []).map((elemento: any) => this.createElementoFormGroup(elemento))
      )
    });
  }

  createElementoFormGroup(elemento: any = {}): FormGroup {
    return this.fb.group({
      idElementoTrabalho: [elemento.idElementoTrabalho || null],
      nome: [elemento.nome || '', Validators.required],
      idUsuarioCadastro: [elemento.idUsuarioCadastro || null],
    });
  }

  createComponenteFormGroup(componente: any = {}): FormGroup {
    return this.fb.group({
      idComponente: [componente.idComponente || componente.componente?.idComponente || null],
      idComponenteTrabalho: [componente.idComponenteTrabalho || null],
      nome: [componente.nome || componente.componente?.nome || '', Validators.required], // Mantém a lógica para carregar
      // Adicione outros campos do componente se necessário
    });
  }

  adicionarTrabalho(): void {
    const novoTrabalho = this.createTrabalhoFormGroup();
    (novoTrabalho.get('servicos') as FormArray).push(this.createServicoFormGroup());
    this.trabalhosFormArray.push(novoTrabalho);
  }

  removerTrabalho(index: number): void {
    this.trabalhosFormArray.removeAt(index);
  }

  toggleEditTrabalho(index: number): void {
    const trabalhoControl = this.trabalhosFormArray.at(index);
    trabalhoControl.get('editando')?.setValue(!trabalhoControl.get('editando')?.value);
  }

  descartarAlteracoesTrabalho(index: number): void {
    const dialogRef = this.dialog.open(ConfirmacaoDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Descartar Alterações?',
        mensagem: 'As mudanças feitas neste trabalho serão perdidas. Deseja continuar?'
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const grupo = this.trabalhosFormArray.at(index) as FormGroup;
      const idTrabalho = grupo.get('idTrabalho')?.value;
      // Trabalho ainda não salvo: remove da lista
      if (!idTrabalho) {
        this.trabalhosFormArray.removeAt(index);
        return;
      }
      const snapshot = this.pacienteData?.trabalhos?.find((t: any) => t.idTrabalho === idTrabalho);
      if (snapshot) {
        const restaurado = this.montarFormGroupTrabalhoAPartirDosDados(snapshot);
        this.trabalhosFormArray.setControl(index, restaurado);
      } else {
        grupo.get('editando')?.setValue(false);
      }
    });
  }

  getTrabalhoFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  getNomeProduto(servico: any): string {
    if (!servico || !this.produtoList.length) {
      return 'N/A';
    }
    const produto = this.produtoList.find(p => p.idProduto === servico.idProduto);
    return produto?.nome || 'N/A';
  }

  getNomesComponentes(trabalho: FormGroup): string {
    const componentes = trabalho.get('componentes')?.value;
    if (!componentes || componentes.length === 0)
      return 'N/A';

    const contagem = componentes.reduce((acc: { [key: string]: number }, componente: any) => {
      acc[componente.nome] = (acc[componente.nome] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(contagem)
      .map(([nome, qtd]) => (`${qtd}x ${nome}`))
      .join(', ');
  }

  getNomesElementos(trabalho: FormGroup): string {
    const servicos = trabalho.get('servicos')?.value;
    if (!servicos || servicos.length === 0) {
      return 'N/A';
    }
    const todosElementos = servicos.flatMap((servico: any) =>
      servico.elementos ? servico.elementos.map((el: any) => el.nome) : []
    );

    return todosElementos.length > 0 ? todosElementos.join(', ') : 'N/A';
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  async loadProdutos() {
    try {
      const response = await buscarProdutos();
      if (response.status === 200) {
        this.produtoList = response.data;
      }
    } catch (error) {
      console.error('Erro ao carregar produtos', error);
    }
  }

  async loadElementos() {
    try {
      const response = await buscarElementosTrabalho();
      this.allItensElementos$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar elementos', error);
    }
  }

  async loadComponentes() {
    try {
      const response = await buscarComponentes();
      this.allItensComponentes$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar componentes', error);
    }
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
    const idEmpresa = this.form.get('idEmpresa')?.value;
    if (!idEmpresa) return;
    const empresaNome = this.empresas$.value.find(e => e.idEmpresa === idEmpresa)?.nome || 'Empresa';
    
    this.dialog.open(BoletosPendentesDialogComponent, {
      width: '800px',
      data: { idEmpresa: idEmpresa, nomeEmpresa: empresaNome }
    });
  }

  async loadDentistas(idEmpresa: number) {
    if (!idEmpresa) return;
    try {
      const response = await buscaDentistaPorEmpresaId(idEmpresa)
      if (response) {
        this.dentistas$.next(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dentistas', error);
    }
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  /** Chamado pelo pai após `atualizarPaciente` com sucesso — não use em caso de erro (mantém edição aberta). */
  encerrarModoEdicaoTrabalhosAposSalvarComSucesso(): void {
    this.trabalhosFormArray.controls.forEach((trabalhoControl) => {
      trabalhoControl.get('editando')?.setValue(false);
    });
  }

  async handleSave(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    try {
      if (this.isEditMode) {
        const formValue = this.form.getRawValue();
        const payload = {
          ...formValue,
          id: this.pacienteData.id, // Garante que o ID do paciente seja enviado na atualização
          // Envia apenas os trabalhos que foram editados
          trabalhos: formValue.trabalhos.filter((t: any) => t.editando)
        };
        this.onSave.emit(payload);
      } else {
        const response = await lastValueFrom(this.pacienteService.cadastrarPaciente(this.form.getRawValue()));
        this.dialogRef.close(response);
      }
    } catch (error: any) {
      console.error('Erro ao salvar paciente', error);
      const errorMessage = error?.error?.resposta || 'Erro ao salvar paciente. Tente novamente.';
      this.snackBar.open(errorMessage, 'Fechar', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    }
  }

  async imprimirTrabalho(index: number): Promise<void> {
    try {
      const trabalho = this.trabalhosFormArray.at(index);
      if (!trabalho) {
        this.snackBar.open('Trabalho não encontrado.', 'Fechar', { duration: 3000 });
        return;
      }

      // Obter ID do trabalho
      const idTrabalho = trabalho.get('idTrabalho')?.value;

      // Obter dados do paciente
      const nomePaciente = this.form.get('nome')?.value || 'N/A';
      const idEmpresa = this.form.get('idEmpresa')?.value;
      const idProfissional = this.form.get('idProfissional')?.value;

      // Obter nome da empresa
      let nomeEmpresa = 'N/A';
      if (idEmpresa) {
        const empresas = this.empresas$.getValue();
        const empresa = empresas.find((e: Empresa) => e.idEmpresa === idEmpresa);
        nomeEmpresa = empresa?.nome || 'N/A';
      }

      // Obter nome do dentista
      let nomeDentista = 'N/A';
      if (idProfissional) {
        const dentistas = this.dentistas$.getValue();
        const dentista = dentistas.find((d: Dentista) => d.idDentista === idProfissional);
        nomeDentista = dentista?.nome ? dentista.nome.toUpperCase() : 'N/A';
      }

      // Obter serviços
      const servicos = trabalho.get('servicos')?.value || [];
      const nomesServicos = servicos
        .map((servico: any) => this.getNomeProduto(servico))
        .filter((nome: string) => nome !== 'N/A')
        .join(', ') || 'N/A';

      // Obter cor
      const cor = trabalho.get('cor')?.value || 'N/A';

      // Obter componentes
      const trabalhoFormGroup = this.getTrabalhoFormGroup(trabalho);
      const componentes = this.getNomesComponentes(trabalhoFormGroup);

      // Obter elementos dentais
      const elementos = this.getNomesElementos(trabalhoFormGroup);

      // Obter observação
      const observacao = trabalho.get('observacao')?.value || '';

      // Carregar logo como base64
      let logoBase64 = '';
      try {
        const logoUrl = `${envFront.BASE_URL}/assets/img/odontoprint-1-color.png`;
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Erro ao carregar logo, continuando sem logo:', error);
      }

      // Gerar QR code com o ID do trabalho
      let qrCodeBase64 = '';
      if (idTrabalho) {
        try {
          const QRCodeModule = await import('qrcode');
          // qrcode exporta toDataURL diretamente no módulo
          const toDataURL = (QRCodeModule as any).toDataURL;
          if (toDataURL) {
            qrCodeBase64 = await toDataURL(idTrabalho.toString(), {
              width: 250,
              margin: 1
            });
          }
        } catch (error) {
          console.warn('Erro ao gerar QR code:', error);
        }
      }

      // Criar definição do PDF
      const docDefinition: TDocumentDefinitions = {
        pageSize: { width: 283, height: 425 }, // 10cm x 15cm em pontos (1cm = 28.35 pontos)
        pageMargins: [20, 10, 20, 20], // [esquerda, topo, direita, baixo]
        content: [
          // Logo e QR Code lado a lado, centralizados verticalmente
          // Largura útil: 283 - 20 (esq) - 20 (dir) = 243 pontos
          ...(logoBase64 || qrCodeBase64 ? [{
            columns: [
              // Logo (se carregada com sucesso) - centralizada verticalmente
              // Altura aproximada do QR code + ID: 80 (QR) + 2 (margin) + ~12 (texto) = ~94 pontos
              // Logo com width 120 tem altura proporcional (~45 pontos), margem superior para centralizar: (94-45)/2 ≈ 25
              ...(logoBase64 ? [{
                image: logoBase64,
                width: 150,
                alignment: 'left' as const,
                margin: [0, 30, 0, 0] as [number, number, number, number] // Margem superior para centralizar verticalmente
              }] : [{ text: '', width: 120 }]),
              // QR Code (se disponível) com ID do trabalho abaixo, alinhado à direita
              ...(qrCodeBase64 ? [{
                stack: [
                  {
                    image: qrCodeBase64,
                    width: 80,
                    alignment: 'center' as const,
                  },
                  {
                    text: idTrabalho ? `ID ${idTrabalho}` : '',
                    fontSize: 10,
                    margin: [0, 2, 0, 0] as [number, number, number, number],
                    alignment: 'center' as const
                  }
                ],
                width: 80,
                alignment: 'right' as const,
                margin: [25, 0, 0, 0] as [number, number, number, number],
              }] : [{ text: '', width: 80 }])
            ],
            columnGap: 5,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          }] : []),
          // Clínica
          {
            text: 'Clínica:',
            bold: true,
            fontSize: 10,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          },
          {
            text: nomeEmpresa,
            fontSize: 10,
            margin: [0, 0, 0, 0] as [number, number, number, number]
          },
          {
            text: nomeDentista,
            fontSize: 10,
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          // Paciente
          {
            text: 'Paciente:',
            bold: true,
            fontSize: 10,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          },
          {
            text: nomePaciente,
            fontSize: 10,
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          // Trabalho e Cor lado a lado
          {
            columns: [
              {
                width: 150,
                stack: [
                  {
                    text: 'Trabalho:',
                    bold: true,
                    fontSize: 10,
                    margin: [0, 0, 0, 5] as [number, number, number, number]
                  },
                  {
                    text: nomesServicos,
                    fontSize: 10,
                    margin: [0, 0, 0, 0] as [number, number, number, number]
                  },
                  // Elementos Dentais (na linha de baixo do Trabalho)
                  {
                    text: elementos !== 'N/A' ? elementos : '',
                    fontSize: 10,
                    margin: [0, 5, 0, 0] as [number, number, number, number]
                  }
                ]
              },
              {
                width: 'auto',
                stack: [
                  {
                    text: 'Cor:',
                    bold: true,
                    fontSize: 10,
                    margin: [0, 0, 0, 5] as [number, number, number, number],
                    alignment: 'left' as const
                  },
                  {
                    text: cor,
                    fontSize: 10,
                    margin: [0, 0, 0, 0] as [number, number, number, number],
                    alignment: 'left' as const
                  }
                ]
              }
            ],
            columnGap: 10,
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          // Componentes
          {
            text: 'Componentes:',
            bold: true,
            fontSize: 10,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          },
          {
            text: '',
            fontSize: 10,
            margin: [0, 0, 0, 50] as [number, number, number, number]
          },
          // OBS
          {
            text: 'OBS:',
            bold: true,
            fontSize: 10,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          },
          {
            text: observacao,
            fontSize: 10,
            margin: [0, 0, 0, 0] as [number, number, number, number]
          }
        ]
      };

      // Gerar e abrir PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.open();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      this.snackBar.open('Erro ao gerar PDF. Tente novamente.', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  async imprimirHistoricoPaciente(): Promise<void> {
    try {
      if (!this.pacienteData || !this.pacienteData.idPaciente) {
        this.snackBar.open('Paciente não carregado corretamente.', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }

      // Busca o histórico completo diretamente do backend no momento da impressão
      const pacienteCompleto: any = await lastValueFrom(
        this.pacienteService.buscarPacientePorId(this.pacienteData.idPaciente.toString())
      );

      if (!pacienteCompleto || !pacienteCompleto.trabalhos || pacienteCompleto.trabalhos.length === 0) {
        this.snackBar.open('Nenhum trabalho encontrado para este paciente.', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        return;
      }

      const nomePaciente = this.form.get('nome')?.value || pacienteCompleto.nome || 'Paciente';

      let nomeEmpresa = 'N/A';
      const idEmpresa = this.form.get('idEmpresa')?.value || pacienteCompleto.idEmpresa;
      if (idEmpresa) {
        const empresas = this.empresas$.getValue();
        const empresa = empresas.find((e: Empresa) => e.idEmpresa === idEmpresa);
        nomeEmpresa = empresa?.nome || 'N/A';
      }

      let nomeDentista = 'N/A';
      const idProfissional = this.form.get('idProfissional')?.value || pacienteCompleto.idProfissional;
      if (idProfissional) {
        const dentistas = this.dentistas$.getValue();
        const dentista = dentistas.find((d: Dentista) => d.idDentista === idProfissional);
        nomeDentista = dentista?.nome ? dentista.nome.toUpperCase() : 'N/A';
      }

      const trabalhosOrdenados = [...(pacienteCompleto.trabalhos || [])].sort((a: any, b: any) => {
        const dataA = a.dataConclusao ? new Date(a.dataConclusao).getTime() : 0;
        const dataB = b.dataConclusao ? new Date(b.dataConclusao).getTime() : 0;
        return dataB - dataA;
      });

      const corpoTabela: any[] = [
        ['Data Conclusão', 'Elementos Dentais', 'Serviços', 'Status', 'Valor']
      ];

      trabalhosOrdenados.forEach((trabalho: any) => {
        const trabalhoFg = this.createTrabalhoFormGroup(trabalho);
        const elementos = this.getNomesElementos(trabalhoFg);

        const servicos = (trabalho.servicos || [])
          .map((servico: any) => this.getNomeProduto(servico))
          .filter((nome: string) => nome && nome !== 'N/A')
          .join(', ') || 'N/A';

        const statusTexto = trabalho.status || 'N/A';
        let statusCell: any = { text: statusTexto };

        // Cor do status no histórico:
        // - PAGAMENTO_RECEBIDO em verde
        // - retrabalho em vermelho (sobrescreve a cor se for verdadeiro)
        if (statusTexto === 'PAGAMENTO_RECEBIDO') {
          statusCell = { text: statusTexto, color: '#2b8a4a' }; // verde
        }
        if (trabalho.retrabalho) {
          statusCell = { text: statusTexto, color: '#c05050' }; // vermelho para retrabalho
        }

        // Usa valorTotal da ordem de serviço, se estiver presente nas relações
        const valorTrabalho = (trabalho.ordemServico && (trabalho.ordemServico as any).valorTotal)
          ? Number((trabalho.ordemServico as any).valorTotal)
          : 0;
        const valor = valorTrabalho > 0
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTrabalho)
          : '-';

        const dataConclusao = trabalho.dataConclusao
          ? new Date(trabalho.dataConclusao).toLocaleDateString('pt-BR')
          : '-';

        corpoTabela.push([
          dataConclusao,
          elementos !== 'N/A' ? elementos : '-',
          servicos,
          statusCell,
          valor
        ]);
      });

      const docDefinition: TDocumentDefinitions = {
        pageOrientation: 'landscape',
        pageMargins: [40, 40, 40, 40],
        content: [
          {
            text: 'Histórico de Trabalhos do Paciente',
            style: 'header'
          },
          {
            text: `Paciente: ${nomePaciente}`,
            margin: [0, 5, 0, 0] as [number, number, number, number]
          },
          {
            text: `Clínica: ${nomeEmpresa}`,
            margin: [0, 2, 0, 0] as [number, number, number, number]
          },
          {
            text: `Dentista: ${nomeDentista}`,
            margin: [0, 2, 0, 15] as [number, number, number, number]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', '*', 'auto', 'auto'],
              body: corpoTabela
            },
            layout: 'lightHorizontalLines'
          }
        ],
        styles: {
          header: {
            fontSize: 16,
            bold: true
          }
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.open();
    } catch (error) {
      console.error('Erro ao gerar PDF de histórico do paciente:', error);
      this.snackBar.open('Erro ao gerar PDF do histórico do paciente. Tente novamente.', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }
}
