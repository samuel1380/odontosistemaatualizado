import { Component, inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { buscarCadastroComplementar, buscarEmpresa, buscarInfosCadastroComplementar, cadastrarCadastroComplementar, cadastrarEmpresa, editarEmpresa } from '../../../services/empresa.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogCadastroComponent } from '../../components/dialog-cadastro/dialog-cadastro.component';
import { ErroTenteMaisTardeComponent } from '../../components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { buscarCEP } from '../../../services/localidade.service';
import { CpfCnpjValidator } from './cpf-cnpj.validator';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buscarAssociacoesPorEmpresa, cadastrarEmpresaTabelaPreco, atualizarEmpresaTabelaPreco, desativarAssociacao } from '../../../services/empresaTabelaPreco.service';
import { buscarTabelasMatriz, buscarVersoesTabela } from '../../../services/tabelaPrecoProduto.service';
import { format } from 'date-fns';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-cadastrar',
  templateUrl: './cadastrar.component.html',
  styleUrls: ['./cadastrar.component.sass']
})
export class CadastrarComponent {
  idEmpresa: string | null = '';
  empresa: any;

  produtosList: any[] = [];
  componentesList: any[] = [];
  coresList: any[] = [];
  tabelaPrecoProdutoList: any[] = [];
  dentistaEmpresa: any[] = [{ nome: "", email: "" }];

  cadastroComplementarEmpresa: any = null;

  descontoFormControl = new FormControl({ value: '', disabled: false }, []);
  tabelaDePrecoProdutoFormControl = new FormControl({ value: '', disabled: false }, []); // Removido required - agora é opcional
  interfacesTBaseFormControl = new FormControl(false);
  scannerProprioFormControl = new FormControl(false);
  coresControl = new FormControl();

  // Gerenciamento de tabelas de preço com vigência
  associacoesTabelaPreco: any[] = [];
  tabelasDisponiveis: any[] = [];
  mostrarFormularioNovaAssociacao = false;
  associacaoEditando: any = null;

  // Formulário de nova associação
  novaAssociacaoTabelaPrecoFormControl = new FormControl<number | null>(null, [Validators.required]);
  novaAssociacaoDataInicioFormControl = new FormControl<Date | null>(new Date(), [Validators.required]);
  novaAssociacaoDataFimFormControl = new FormControl<Date | null>(null);

  razaoSocialFormControl = new FormControl('', []);
  cnpjFormControl = new FormControl('', [Validators.required, CpfCnpjValidator.validate, Validators.minLength(14), Validators.maxLength(14)]);
  cpfFormControl = new FormControl('', [Validators.required, CpfCnpjValidator.validate, Validators.minLength(11), Validators.maxLength(11)]);
  nomeFantasiaFormControl = new FormControl('', [Validators.required]);
  tipoEmpresaFormControl = new FormControl('', [Validators.required]);
  responsavelTecnicoFormControl = new FormControl("N/A", [Validators.required]);

  cepFormControl = new FormControl({ value: '', disabled: false }, [Validators.required]);
  logradouroFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  complementoFormControl = new FormControl({ value: '', disabled: false });
  bairroFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  cidadeFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);
  ufFormControl = new FormControl({ value: '', disabled: true }, [Validators.required]);

  contatoOperacionalFormControl = new FormControl("N/A", [Validators.required]);
  telefoneOperacionalFormControl = new FormControl("N/A", [Validators.required]);
  emailOperacionalFormControl = new FormControl('', [Validators.required]);

  contatoFinanceiroFormControl = new FormControl("N/A", [Validators.required]);
  telefoneFinanceiroFormControl = new FormControl("N/A", [Validators.required]);
  emailFinanceiroFormControl = new FormControl("N/A", [Validators.required, Validators.email]);

  numeroDocumentoResponsavel = new FormControl("N/A", [Validators.required]);



  isEmpresa: boolean = false;
  isPessoa: boolean = false;
  private tempoKeyupBuscaCEP: any;

  matcher = new MyErrorStateMatcher();

  aprovado: boolean = false;

  private _snackBar = inject(MatSnackBar);

  constructor(private router: Router, private dialog: MatDialog, private activatedRoute: ActivatedRoute) {
    const idEmpresaString = this.activatedRoute.snapshot.paramMap.get("id")
    this.idEmpresa = idEmpresaString || '';

    if (this.idEmpresa) {
      buscarEmpresa(this.idEmpresa).then((response: any) => {
        this.empresa = response.data;

        this.nomeFantasiaFormControl.setValue(this.empresa.nome);
        this.razaoSocialFormControl.setValue(this.empresa.razaoSocial);
        this.cnpjFormControl.setValue(this.empresa.documento);
        this.cpfFormControl.setValue(this.empresa.documento);
        this.tipoEmpresaFormControl.setValue(this.empresa.tipoEmpresa);

        this.cepFormControl.setValue(this.empresa.cep);
        this.logradouroFormControl.setValue(this.empresa.logradouro);
        this.complementoFormControl.setValue(this.empresa.complemento);
        this.bairroFormControl.setValue(this.empresa.bairro);
        this.cidadeFormControl.setValue(this.empresa.cidade);
        this.ufFormControl.setValue(this.empresa.uf);

        this.responsavelTecnicoFormControl.setValue(this.empresa.responsavelTecnico);
        this.numeroDocumentoResponsavel.setValue(this.empresa.numeroDocumentoResponsavelTecnico);
        this.contatoFinanceiroFormControl.setValue(this.empresa.nomeResponsavelFinanceiro);
        this.telefoneFinanceiroFormControl.setValue(this.empresa.telefoneFinanceiro);
        this.emailFinanceiroFormControl.setValue(this.empresa.emailFinanceiro);
        this.contatoOperacionalFormControl.setValue(this.empresa.nomeResponsavel);
        this.telefoneOperacionalFormControl.setValue(this.empresa.telefone);
        this.emailOperacionalFormControl.setValue(this.empresa.email);

        this.isEmpresa = this.empresa.tipoEmpresa === 'clinica_odontologica' || this.empresa.tipoEmpresa === 'laboratorio_protese_dentaria';
        this.isPessoa = this.empresa.tipoEmpresa === 'cirurgiao_dentista';
        this.aprovado = this.empresa.aprovada;
      })


      buscarCadastroComplementar(this.idEmpresa).then((response: any) => {
        if (response.status === 200) {
          this.cadastroComplementarEmpresa = response.data;

          this.dentistaEmpresa = Array.apply([], this.cadastroComplementarEmpresa?.dentistaEmpresa);
          this.descontoFormControl.setValue(this.cadastroComplementarEmpresa?.porcentagemDesconto);
          this.tabelaDePrecoProdutoFormControl.setValue(this.cadastroComplementarEmpresa?.tabelaPrecoProduto?.idTabelaPrecoProduto);
          this.interfacesTBaseFormControl.setValue(this.cadastroComplementarEmpresa?.utilizaInterfaces);
          this.scannerProprioFormControl.setValue(this.cadastroComplementarEmpresa?.scannerProprio);
        }
      });

      // Carregar associações de tabelas de preço
      this.carregarAssociacoesTabelaPreco();
    }

    buscarInfosCadastroComplementar().then((response: any) => {
      if (!response || !response.data) {
        return;
      }

      this.produtosList = response.data.produtos;
      this.componentesList = response.data.componentes;
      this.coresList = response.data.cores;
      this.tabelaPrecoProdutoList = response.data.tabelaPrecoProduto;

    });

    // Carregar tabelas disponíveis (matriz e versões)
    this.carregarTabelasDisponiveis();
  }

  ngOnChanges() {
    if (!this.idEmpresa) {
      return;
    }
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validaCadastro()) {
      return;
    }

    let cadastroEmpresaPayload = {};

    if (this.isEmpresa) {
      cadastroEmpresaPayload = {
        nome: this.nomeFantasiaFormControl.value,
        razaoSocial: this.nomeFantasiaFormControl.value,
        documento: this.cnpjFormControl.value,
        tipoEmpresa: this.tipoEmpresaFormControl.value,
        responsavelTecnico: this.responsavelTecnicoFormControl.value,
        numeroDocumentoResponsavelTecnico: this.numeroDocumentoResponsavel.value,
        nomeResponsavelFinanceiro: this.contatoFinanceiroFormControl.value,
        telefoneFinanceiro: this.telefoneFinanceiroFormControl.value,
        emailFinanceiro: this.emailFinanceiroFormControl.value,
        nomeResponsavel: this.contatoOperacionalFormControl.value,
        telefone: this.telefoneOperacionalFormControl.value,
        email: this.emailOperacionalFormControl.value,

        cep: this.cepFormControl.value?.toString(),
        logradouro: this.logradouroFormControl.value,
        bairro: this.bairroFormControl.value,
        cidade: this.cidadeFormControl.value,
        uf: this.ufFormControl.value
      }
    } else {
      cadastroEmpresaPayload = {
        nome: this.nomeFantasiaFormControl.value,
        razaoSocial: this.nomeFantasiaFormControl.value,
        documento: this.cpfFormControl.value,
        tipoEmpresa: this.tipoEmpresaFormControl.value,
        responsavelTecnico: this.responsavelTecnicoFormControl.value,
        numeroDocumentoResponsavelTecnico: this.numeroDocumentoResponsavel.value,
        nomeResponsavelFinanceiro: this.contatoFinanceiroFormControl.value,
        telefoneFinanceiro: this.telefoneFinanceiroFormControl.value,
        emailFinanceiro: this.emailFinanceiroFormControl.value,
        nomeResponsavel: this.contatoOperacionalFormControl.value,
        telefone: this.telefoneOperacionalFormControl.value,
        email: this.emailOperacionalFormControl.value,

        cep: this.cepFormControl.value?.toString(),
        logradouro: this.logradouroFormControl.value,
        bairro: this.bairroFormControl.value,
        cidade: this.cidadeFormControl.value,
        uf: this.ufFormControl.value
      }
    }

    try {
      let result;
      if(!this.empresa) {
        result = await cadastrarEmpresa(cadastroEmpresaPayload);
      } else {
        result = await editarEmpresa(this.empresa.idEmpresa, cadastroEmpresaPayload);
      }

      if (result.status == 201 || result.status == 200) {
        this.onSubmitCadastroComplementar(result.data.idEmpresa, cadastroEmpresaPayload);
        return;
      }

    }
    catch (e) {
      this.dialog.open(ErroTenteMaisTardeComponent, {
        width: '50%',
        enterAnimationDuration: `100ms`,
        exitAnimationDuration: `100ms`,
      });
    }
  }

  async onSubmitCadastroComplementar(idEmpresa: string, cadastroEmpresaPayload: any) {
        const cor = this.coresControl.getRawValue();
        const dentistas = this.dentistaEmpresa.map((dentista) => {
          return { ...dentista, idEmpresa: idEmpresa }
        });

        const dadosComplementaresDto = {
          idCadastroComplementarEmpresa: idEmpresa,
          porcentagemDesconto: this.descontoFormControl.value || 0,
          utilizaInterfaces: this.interfacesTBaseFormControl.value,
          scannerProprio: this.scannerProprioFormControl.value,
          produtos: [],
          componentes: [],
          cores: [{ idCor: cor }],
          dentistas,
          idTabelaPrecoProduto: this.tabelaDePrecoProdutoFormControl.value,
        };

        try {
          const result = await cadastrarCadastroComplementar(dadosComplementaresDto, idEmpresa);

          if (result?.status == 201) {
            this._snackBar.open('Salvo com sucesso', 'fechar', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              duration: 5 * 1000
            });
            this.router.navigate(['/l/empresa']);
            return;
          }
        }
        catch (e) {
          this._snackBar.open('Erro ao salvar dados do parceiro', 'fechar', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 5 * 1000
          });
        }
  }

  async onChangeBuscaCEP() {
    if (this.tempoKeyupBuscaCEP) {
      clearTimeout(this.tempoKeyupBuscaCEP);
    }

    this.tempoKeyupBuscaCEP = setTimeout(async () => {
      let cep = this.cepFormControl.value || '';
      cep = cep.replace(/\D/g, '');

      if (cep?.toString().length === 8) {
        const endereco = await buscarCEP(cep);
        if (endereco.status !== 200) {
          return;
        }

        if (endereco.data.logradouro) {
          this.logradouroFormControl.setValue(endereco.data.logradouro);
          this.logradouroFormControl.disable();
        } else {
          this.logradouroFormControl.setValue(endereco.data.logradouro);
          this.logradouroFormControl.enable();
        }

        if (endereco.data.bairro) {
          this.bairroFormControl.setValue(endereco.data.bairro);
          this.bairroFormControl.disable();
        } else {
          this.bairroFormControl.setValue(endereco.data.bairro);
          this.bairroFormControl.enable();
        }

        if (endereco.data.localidade) {
          this.cidadeFormControl.setValue(endereco.data.localidade);
          this.cidadeFormControl.disable();
        } else {
          this.cidadeFormControl.setValue(endereco.data.localidade);
          this.cidadeFormControl.enable();
        }

        if (endereco.data.uf) {
          this.ufFormControl.setValue(endereco.data.uf);
          this.ufFormControl.disable();
        } else {
          this.ufFormControl.setValue(endereco.data.uf);
          this.ufFormControl.enable();
        }

        this.complementoFormControl.enable();
      }
    }, 1500)
  }

  onChangeTipoEmpresa() {
    const value = this.tipoEmpresaFormControl.getRawValue();

    this.isEmpresa = value === 'clinica_odontologica' || value === 'laboratorio_protese_dentaria';
    this.isPessoa = value === 'cirurgiao_dentista';
  }

  private validaCadastro(): boolean {
    const nome = this.nomeFantasiaFormControl.value;
    // const razaoSocial = this.razaoSocialFormControl.value;
    const documento = this.cnpjFormControl.value;
    const tipoEmpresa = this.tipoEmpresaFormControl.value;
    const responsavelTecnico = this.responsavelTecnicoFormControl.value;
    const numeroDocumentoResponsavelTecnico = this.numeroDocumentoResponsavel.value;
    const nomeResponsavelFinanceiro = this.contatoFinanceiroFormControl.value;
    const telefoneFinanceiro = this.telefoneFinanceiroFormControl.value;
    const emailFinanceiro = this.emailFinanceiroFormControl.value;
    const nomeResponsavel = this.contatoOperacionalFormControl.value;
    const telefone = this.telefoneOperacionalFormControl.value;
    const email = this.emailOperacionalFormControl.value;
    const cpf = this.cpfFormControl.value;

    const cep = this.cepFormControl.value;
    const logradouro = this.logradouroFormControl.value;
    const bairro = this.bairroFormControl.value;
    const cidade = this.cidadeFormControl.value;
    const uf = this.ufFormControl.value;
    // Removido validação obrigatória de idTabelaPreco - agora é opcional (pode usar associações com vigência)

    if (!nome || !tipoEmpresa || !logradouro || !responsavelTecnico || !numeroDocumentoResponsavelTecnico
      || !nomeResponsavelFinanceiro || !telefoneFinanceiro || !emailFinanceiro || !nomeResponsavel || !telefone || !email
      || this.isEmpresa && !documento || this.isPessoa && !cpf
      || !cep || !logradouro || !bairro || !cidade || !uf) {

      if (this.isEmpresa) {
        this.razaoSocialFormControl.markAllAsTouched();
        this.cnpjFormControl.markAllAsTouched();
      } else if (this.isPessoa) {
        this.cpfFormControl.markAllAsTouched();
      }

      this.nomeFantasiaFormControl.markAllAsTouched();
      this.tipoEmpresaFormControl.markAllAsTouched();
      this.logradouroFormControl.markAllAsTouched();
      this.responsavelTecnicoFormControl.markAllAsTouched();
      this.numeroDocumentoResponsavel.markAllAsTouched();
      this.contatoFinanceiroFormControl.markAllAsTouched();
      this.telefoneFinanceiroFormControl.markAllAsTouched();
      this.emailFinanceiroFormControl.markAllAsTouched();
      this.contatoOperacionalFormControl.markAllAsTouched();
      this.telefoneOperacionalFormControl.markAllAsTouched();
      this.emailOperacionalFormControl.markAllAsTouched();

      this.cepFormControl.markAllAsTouched();
      this.logradouroFormControl.markAllAsTouched();
      this.bairroFormControl.markAllAsTouched();
      this.cidadeFormControl.markAllAsTouched();
      this.ufFormControl.markAllAsTouched();
      // Removido markAllAsTouched de tabelaDePrecoProdutoFormControl - não é mais obrigatório

      return true;
    }

    return false;
  }



  // hasActiveProduto(idProduto: number) {
  //   return this.produtosEmpresa?.some((produto: { idProduto: number }) => produto.idProduto == idProduto);
  // }

  // hasActiveComponent(idComponente: number) {
  //   const componenteEmpresa: any[] = this.cadastroComplementarEmpresa?.componenteEmpresa;

  //   return componenteEmpresa?.some(componente => componente.idComponente == idComponente);
  // }

  // async setProduto(checked: boolean, idProduto: number) {
  //   if (checked) {
  //     this.produtosEmpresa.push({ idProduto });
  //   } else {
  //     const index = this.produtosEmpresa.map((produto: any) => produto.idProduto).indexOf(idProduto);
  //     this.produtosEmpresa.splice(index, 1);
  //   }
  // }

  // async setComponentes(checked: boolean, idComponente: number) {
  //   if (checked) {
  //     this.componenteEmpresa.push({ idComponente });
  //   } else {
  //     const index = this.componenteEmpresa.map((componente: any) => componente.idComponente).indexOf(idComponente);
  //     this.componenteEmpresa.splice(index, 1);
  //   }
  // }

  async setDentistaEmpresa(event: any, tipoCampo: string, dentista: any) {
    event.preventDefault();
    event.stopPropagation();
    dentista[tipoCampo] = event.target.value;
  }

  async removeDentista(event: Event, dentista: any) {
    event.preventDefault();
    event.stopPropagation();

    const index = this.dentistaEmpresa.indexOf(dentista);

    this.dentistaEmpresa.splice(index, 1);
  }

  async addDentista(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.dentistaEmpresa.push({ nome: "", email: "" });
  }

  // Métodos para gerenciamento de tabelas de preço com vigência
  async carregarAssociacoesTabelaPreco() {
    if (!this.idEmpresa) return;

    try {
      const response = await buscarAssociacoesPorEmpresa(parseInt(this.idEmpresa));
      if (response.status === 200) {
        this.associacoesTabelaPreco = Array.isArray(response.data) ? response.data : [response.data];
      }
    } catch (error) {
      console.error('Erro ao carregar associações de tabela de preço:', error);
    }
  }

  async carregarTabelasDisponiveis() {
    try {
      const response = await buscarTabelasMatriz();
      if (response.status === 200) {
        const tabelasMatriz = response.data || [];
        this.tabelasDisponiveis = [];

        // Adicionar matrizes
        for (const matriz of tabelasMatriz) {
          this.tabelasDisponiveis.push({
            idTabelaPrecoProduto: matriz.idTabelaPrecoProduto,
            nome: matriz.nome,
            isMatriz: true,
            numeroVersao: null
          });

          // Adicionar versões de cada matriz
          try {
            const versoesResponse = await buscarVersoesTabela(matriz.idTabelaPrecoProduto);
            if (versoesResponse.status === 200 && versoesResponse.data) {
              const versoes = Array.isArray(versoesResponse.data) ? versoesResponse.data : [versoesResponse.data];
              versoes.forEach((versao: any) => {
                if (versao.ativo !== 0 && versao.ativo !== false) {
                  this.tabelasDisponiveis.push({
                    idTabelaPrecoProduto: versao.idTabelaPrecoProduto,
                    nome: `${matriz.nome} - Versão ${versao.numeroVersao || 'N/A'}`,
                    isMatriz: false,
                    numeroVersao: versao.numeroVersao
                  });
                }
              });
            }
          } catch (error) {
            console.error(`Erro ao carregar versões da matriz ${matriz.idTabelaPrecoProduto}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tabelas disponíveis:', error);
    }
  }

  abrirFormularioNovaAssociacao(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.associacaoEditando = null;
    this.novaAssociacaoTabelaPrecoFormControl.setValue(null);
    this.novaAssociacaoDataInicioFormControl.setValue(new Date());
    this.novaAssociacaoDataFimFormControl.setValue(null);
    this.mostrarFormularioNovaAssociacao = true;
  }

  /**
   * Converte uma data do backend (string ou Date) para Date em UTC preservando apenas o dia
   */
  private parseDataParaDatePicker(data: string | Date | null): Date | null {
    if (!data) return null;
    
    let dataDate: Date;
    if (typeof data === 'string') {
      // Extrair apenas a parte da data (YYYY-MM-DD)
      const match = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const ano = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1; // Mês é 0-indexed
        const dia = parseInt(match[3], 10);
        // Criar Date em UTC e depois converter para timezone local para o datepicker
        dataDate = new Date(Date.UTC(ano, mes, dia, 12, 0, 0, 0)); // Usar meio-dia para evitar problemas de timezone
      } else {
        dataDate = new Date(data);
      }
    } else {
      dataDate = data;
    }
    
    // Extrair ano, mês e dia em UTC e criar nova data no timezone local para o datepicker
    const ano = dataDate.getUTCFullYear();
    const mes = dataDate.getUTCMonth();
    const dia = dataDate.getUTCDate();
    
    // Criar data no timezone local para o datepicker funcionar corretamente
    return new Date(ano, mes, dia);
  }

  abrirFormularioEditarAssociacao(associacao: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.associacaoEditando = associacao;
    this.novaAssociacaoTabelaPrecoFormControl.setValue(associacao.idTabelaPrecoProduto);
    this.novaAssociacaoDataInicioFormControl.setValue(this.parseDataParaDatePicker(associacao.dataInicio));
    this.novaAssociacaoDataFimFormControl.setValue(this.parseDataParaDatePicker(associacao.dataFim));
    this.mostrarFormularioNovaAssociacao = true;
  }

  cancelarFormularioAssociacao(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.mostrarFormularioNovaAssociacao = false;
    this.associacaoEditando = null;
    this.novaAssociacaoTabelaPrecoFormControl.reset();
    this.novaAssociacaoDataInicioFormControl.setValue(new Date());
    this.novaAssociacaoDataFimFormControl.setValue(null);
  }

  validarDatasAssociacao(): boolean {
    const dataInicio = this.novaAssociacaoDataInicioFormControl.value;
    const dataFim = this.novaAssociacaoDataFimFormControl.value;

    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(0, 0, 0, 0);

      if (fim <= inicio) {
        this.novaAssociacaoDataFimFormControl.setErrors({ dataInvalida: true });
        return false;
      }
    }

    // Limpar erro se a validação passou
    if (this.novaAssociacaoDataFimFormControl.hasError('dataInvalida')) {
      const errors = { ...this.novaAssociacaoDataFimFormControl.errors };
      delete errors['dataInvalida'];
      this.novaAssociacaoDataFimFormControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    return true;
  }

  async salvarAssociacaoTabelaPreco(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.validarDatasAssociacao()) {
      this._snackBar.open('A data de fim deve ser maior que a data de início', 'Fechar', { duration: 5000 });
      return;
    }

    if (this.novaAssociacaoTabelaPrecoFormControl.invalid || this.novaAssociacaoDataInicioFormControl.invalid) {
      this._snackBar.open('Por favor, preencha todos os campos obrigatórios', 'Fechar', { duration: 5000 });
      return;
    }

    if (!this.idEmpresa) {
      this._snackBar.open('ID da empresa não encontrado', 'Fechar', { duration: 5000 });
      return;
    }

    const dataInicio = this.novaAssociacaoDataInicioFormControl.value!;
    const dataFim = this.novaAssociacaoDataFimFormControl.value;

    // Função para normalizar data: extrai apenas ano, mês e dia, ignorando hora e timezone
    const normalizarDataParaISO = (data: Date): string => {
      const ano = data.getFullYear();
      const mes = data.getMonth();
      const dia = data.getDate();
      // Criar data em UTC para garantir que seja exatamente a data selecionada
      const dataUTC = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
      return dataUTC.toISOString();
    };

    const payload: any = {
      idEmpresa: parseInt(this.idEmpresa),
      idTabelaPrecoProduto: this.novaAssociacaoTabelaPrecoFormControl.value!,
      dataInicio: normalizarDataParaISO(dataInicio)
    };

    // Incluir dataFim apenas se fornecida
    if (dataFim) {
      const ano = dataFim.getFullYear();
      const mes = dataFim.getMonth();
      const dia = dataFim.getDate();
      // Para data fim, usar fim do dia (23:59:59.999) em UTC
      const dataFimUTC = new Date(Date.UTC(ano, mes, dia, 23, 59, 59, 999));
      payload.dataFim = dataFimUTC.toISOString();
    }

    try {
      let result;
      if (this.associacaoEditando) {
        result = await atualizarEmpresaTabelaPreco(payload, this.associacaoEditando.idEmpresaTabelaPreco);
      } else {
        result = await cadastrarEmpresaTabelaPreco(payload);
      }

      if (result?.status === 201 || result?.status === 200) {
        this._snackBar.open('Associação salva com sucesso!', 'Fechar', { duration: 3000 });
        this.cancelarFormularioAssociacao();
        await this.carregarAssociacoesTabelaPreco();
      }
    } catch (e: any) {
      console.error('Erro ao salvar associação', e);
      const mensagemErro = e?.response?.data?.message 
        || e?.response?.data?.resposta?.message
        || e?.error?.message
        || e?.error?.resposta
        || e?.message
        || 'Erro ao salvar associação. Tente novamente.';
      
      this._snackBar.open(mensagemErro, 'Fechar', { 
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  async removerAssociacaoTabelaPreco(associacao: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (confirm(`Deseja realmente desativar a associação com a tabela "${associacao.tabelaPrecoProduto?.nome || 'N/A'}"?`)) {
      try {
        await desativarAssociacao(associacao.idEmpresaTabelaPreco);
        this._snackBar.open('Associação desativada com sucesso!', 'Fechar', { duration: 3000 });
        await this.carregarAssociacoesTabelaPreco();
      } catch (error: any) {
        console.error('Erro ao desativar associação:', error);
        this._snackBar.open('Erro ao desativar associação. Tente novamente.', 'Fechar', { duration: 5000 });
      }
    }
  }

  calcularStatusAssociacao(associacao: any): string {
    // Usar UTC para evitar problemas de timezone
    const hoje = new Date();
    const hojeUTC = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate(), 0, 0, 0, 0));

    let dataInicioUTC: Date | null = null;
    let dataFimUTC: Date | null = null;

    if (associacao.dataInicio) {
      const dataInicio = associacao.dataInicio;
      if (typeof dataInicio === 'string') {
        const match = dataInicio.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const ano = parseInt(match[1], 10);
          const mes = parseInt(match[2], 10) - 1;
          const dia = parseInt(match[3], 10);
          dataInicioUTC = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
        } else {
          const d = new Date(dataInicio);
          dataInicioUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
        }
      } else {
        const d = new Date(dataInicio);
        dataInicioUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      }
    }

    if (associacao.dataFim) {
      const dataFim = associacao.dataFim;
      if (typeof dataFim === 'string') {
        const match = dataFim.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const ano = parseInt(match[1], 10);
          const mes = parseInt(match[2], 10) - 1;
          const dia = parseInt(match[3], 10);
          dataFimUTC = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
        } else {
          const d = new Date(dataFim);
          dataFimUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
        }
      } else {
        const d = new Date(dataFim);
        dataFimUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      }
    }

    if (!dataInicioUTC) {
      return 'Indefinido';
    }

    if (hojeUTC < dataInicioUTC) {
      return 'Futura';
    }

    if (dataFimUTC) {
      if (hojeUTC > dataFimUTC) {
        return 'Expirada';
      }

      const diasRestantes = Math.ceil((dataFimUTC.getTime() - hojeUTC.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 30) {
        if (diasRestantes === 0) {
          return 'Vence hoje';
        }
        return `Vence em ${diasRestantes} dias`;
      }
    }

    return 'Vigente';
  }

  formatarDataAssociacao(data: string | Date | null): string {
    if (!data) return 'Vigente indefinidamente';
    
    // Garantir que a data seja tratada em UTC para evitar problemas de timezone
    let dataDate: Date;
    if (typeof data === 'string') {
      // Se for string, extrair apenas a parte da data (YYYY-MM-DD)
      const match = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const ano = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1; // Mês é 0-indexed
        const dia = parseInt(match[3], 10);
        dataDate = new Date(Date.UTC(ano, mes, dia));
      } else {
        dataDate = new Date(data);
      }
    } else {
      dataDate = data;
    }
    
    // Usar métodos UTC para formatar
    const ano = dataDate.getUTCFullYear();
    const mes = String(dataDate.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(dataDate.getUTCDate()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano}`;
  }
}
