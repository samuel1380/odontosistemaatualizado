import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { cadastrarEmpresaTabelaPreco, atualizarEmpresaTabelaPreco, buscarAssociacaoPorId } from 'src/services/empresaTabelaPreco.service';
import { buscarEmpresas } from 'src/services/empresa.service';
import { buscarTabelasMatriz, buscarVersoesTabela } from 'src/services/tabelaPrecoProduto.service';
import { CustomizerSettingsService } from '../../externalComponents/customizer-settings/customizer-settings.service';

@Component({
  selector: 'app-empresa-tabela-preco-cadastro',
  templateUrl: './empresa-tabela-preco-cadastro.component.html',
  styleUrls: ['./empresa-tabela-preco-cadastro.component.sass']
})
export class EmpresaTabelaPrecoCadastroComponent implements OnInit {
  idAssociacao: number | null = null;
  isEditMode = false;

  empresaFormControl = new FormControl<number | null>(null, [Validators.required]);
  tabelaPrecoFormControl = new FormControl<number | null>(null, [Validators.required]);
  dataInicioFormControl = new FormControl<Date | null>(new Date(), [Validators.required]);
  dataFimFormControl = new FormControl<Date | null>(null);

  empresas: any[] = [];
  tabelasDisponiveis: any[] = [];

  constructor(
    public themeService: CustomizerSettingsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    // Carregar empresas
    try {
      const empresasResponse = await buscarEmpresas();
      if (empresasResponse.status === 200) {
        this.empresas = empresasResponse.data;
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }

    // Carregar tabelas disponíveis (matriz e versões)
    await this.carregarTabelasDisponiveis();

    // Verificar se é modo edição
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.idAssociacao = parseInt(idParam, 10);
      this.isEditMode = true;
      await this.carregarAssociacao();
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

  async carregarAssociacao() {
    if (!this.idAssociacao) return;

    try {
      const response = await buscarAssociacaoPorId(this.idAssociacao);
      if (response.status === 200) {
        const associacao = response.data;
        this.empresaFormControl.setValue(associacao.idEmpresa);
        this.tabelaPrecoFormControl.setValue(associacao.idTabelaPrecoProduto);
        this.dataInicioFormControl.setValue(this.parseDataParaDatePicker(associacao.dataInicio));
        if (associacao.dataFim) {
          this.dataFimFormControl.setValue(this.parseDataParaDatePicker(associacao.dataFim));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar associação:', error);
      this.snackBar.open('Erro ao carregar associação', 'Fechar', { duration: 5000 });
    }
  }

  validarDatas(): boolean {
    const dataInicio = this.dataInicioFormControl.value;
    const dataFim = this.dataFimFormControl.value;

    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(0, 0, 0, 0);

      if (fim <= inicio) {
        this.dataFimFormControl.setErrors({ dataInvalida: true });
        return false;
      }
    }

    this.dataFimFormControl.setErrors(null);
    return true;
  }

  async onSubmitButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.validarDatas()) {
      this.snackBar.open('A data de fim deve ser maior que a data de início', 'Fechar', { duration: 5000 });
      return;
    }

    if (this.empresaFormControl.invalid || this.tabelaPrecoFormControl.invalid || this.dataInicioFormControl.invalid) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'Fechar', { duration: 5000 });
      return;
    }

    const dataInicio = this.dataInicioFormControl.value!;
    const dataFim = this.dataFimFormControl.value;

    // Função para normalizar data: extrai apenas ano, mês e dia, ignorando hora e timezone
    const normalizarDataParaISO = (data: Date): string => {
      const ano = data.getFullYear();
      const mes = data.getMonth();
      const dia = data.getDate();
      // Criar data em UTC para garantir que seja exatamente a data selecionada
      const dataUTC = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
      return dataUTC.toISOString();
    };

    const idTabelaPrecoProduto = this.tabelaPrecoFormControl.value!;
    const payload: any = {
      idEmpresa: this.empresaFormControl.value!,
      idTabelaPrecoProduto: typeof idTabelaPrecoProduto === 'string' ? parseInt(idTabelaPrecoProduto, 10) : idTabelaPrecoProduto,
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
      if (this.isEditMode && this.idAssociacao) {
        result = await atualizarEmpresaTabelaPreco(payload, this.idAssociacao);
      } else {
        result = await cadastrarEmpresaTabelaPreco(payload);
      }

      if (result?.status === 201 || result?.status === 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: '100ms',
          exitAnimationDuration: '100ms',
        });
        this.router.navigate(['/l/empresa-tabela-preco']);
      }
    } catch (e: any) {
      console.error('Erro ao salvar associação', e);
      const mensagemErro = e?.response?.data?.message 
        || e?.response?.data?.resposta?.message
        || e?.error?.message
        || e?.error?.resposta
        || e?.message
        || 'Erro ao salvar associação. Tente novamente.';
      
      this.snackBar.open(mensagemErro, 'Fechar', { 
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }
}
