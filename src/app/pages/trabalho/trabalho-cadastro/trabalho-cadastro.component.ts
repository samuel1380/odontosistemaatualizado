import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, takeUntil, Subject, of } from 'rxjs';
import { atualizaStatus } from 'src/services/trabalho.service';
import { AuthUserService } from 'src/app/serviceStorage/authUser.service';
import { buscarMotivos, MotivoTipo } from 'src/services/motivo.service';
import {
  MatSnackBar
} from '@angular/material/snack-bar';
@Component({
  selector: 'app-trabalho-cadastro',
  templateUrl: './trabalho-cadastro.component.html',
  styleUrl: './trabalho-cadastro.component.sass'
})
export class TrabalhoCadastroComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  private destroy$ = new Subject<void>();
  @Input() produtoList: any[] = [];
  @Input() allItensElementos$: Observable<any[]> = of([]);
  @Input() allItensComponentes$: Observable<any[]> = of([]);
  private allItensElementos: any[] = [];
  private allItensComponentes: any[] = [];

  motivosRetrabalho: any[] = [];
  motivosBonificacao: any[] = [];

  isAdmin: boolean = false;
  canEditStatus: boolean = false;
  statusTrabalho: string[] = [
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

  isLoadding = true;

  /** Último status confirmado no servidor (reverte o select se a API rejeitar a mudança). */
  private previousStatus: string | null = null;

  private _snackBar = inject(MatSnackBar);

  constructor(
    private authService: AuthUserService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.authService.isAdmin$.subscribe(currentUser => {
      this.isAdmin = currentUser;
    });

    // Verifica se o usuário tem permissão de admin, producao ou financeiro
    this.authService.isLogged$.subscribe(() => {
      this.canEditStatus = this.authService.hasAnyRole([
        AuthUserService.ADMIN,
        AuthUserService.PRODUCAO,
        AuthUserService.FINANCEIRO
      ]);
    });
  }

  async ngOnInit() {
    this.isLoadding = false;

    this.allItensElementos$.pipe(takeUntil(this.destroy$)).subscribe(elementos => {
      this.allItensElementos = elementos;
    });

    this.allItensComponentes$.pipe(takeUntil(this.destroy$)).subscribe(componentes => {
      this.allItensComponentes = componentes;
    });

    // Popula os serviços se já existirem no formGroup (modo de edição)
    const servicosData = this.formGroup.get('servicos')?.value || [];
    if (servicosData.length > 0 && this.servicos.length === 0) {
      servicosData.forEach((servicoData: any) => {
        const servicoFormGroup = this.criarServico(servicoData);
        this.servicos.push(servicoFormGroup);

        // Popula o controle de elementos com os IDs existentes
        const elementosIniciais = (servicoData.elementos || []).map((el: any) => {
          return el.idElementoTrabalho || this.allItensElementos.find(item => item.nome === el.nome)?.idElementoTrabalho;
        }).filter(Boolean); // Filtra IDs nulos ou indefinidos
        this.getElementosControl(servicoFormGroup).setValue(elementosIniciais);

      });
    }

    this.previousStatus = this.formGroup.get('status')?.value ?? null;

    await this.carregarMotivos();
    this.configurarValidacaoMotivos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async carregarMotivos() {
    try {
      const [resRetrabalho, resBonificacao] = await Promise.all([
        buscarMotivos({ tipo: 'RETRABALHO' as MotivoTipo }),
        buscarMotivos({ tipo: 'BONIFICACAO' as MotivoTipo }),
      ]);

      this.motivosRetrabalho = Array.isArray(resRetrabalho?.data) ? resRetrabalho.data : [];
      this.motivosBonificacao = Array.isArray(resBonificacao?.data) ? resBonificacao.data : [];
    } catch (e) {
      // Se falhar, mantemos vazio e a validação impede salvar quando toggle estiver ativo.
      this.motivosRetrabalho = [];
      this.motivosBonificacao = [];
    }
  }

  private configurarValidacaoMotivos() {
    const retrabalhoCtrl = this.formGroup.get('retrabalho');
    const bonificacaoCtrl = this.formGroup.get('bonificacao');
    const motivosRetrabalhoCtrl = this.formGroup.get('motivosRetrabalhoIds');
    const motivosBonificacaoCtrl = this.formGroup.get('motivosBonificacaoIds');

    const aplicar = () => {
      const retrabalhoAtivo = !!retrabalhoCtrl?.value;
      const bonificacaoAtiva = !!bonificacaoCtrl?.value;

      if (retrabalhoAtivo) {
        motivosRetrabalhoCtrl?.setValidators([Validators.required]);
      } else {
        motivosRetrabalhoCtrl?.clearValidators();
        motivosRetrabalhoCtrl?.setValue([], { emitEvent: false });
      }
      motivosRetrabalhoCtrl?.updateValueAndValidity({ emitEvent: false });

      if (bonificacaoAtiva) {
        motivosBonificacaoCtrl?.setValidators([Validators.required]);
      } else {
        motivosBonificacaoCtrl?.clearValidators();
        motivosBonificacaoCtrl?.setValue([], { emitEvent: false });
      }
      motivosBonificacaoCtrl?.updateValueAndValidity({ emitEvent: false });
    };

    // aplica no load e reage a mudanças
    aplicar();
    retrabalhoCtrl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(aplicar);
    bonificacaoCtrl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(aplicar);
  }

  get servicos(): FormArray {
    return this.formGroup.get('servicos') as FormArray;
  }

  getComponentes(): FormArray {
    return this.formGroup.get('componentes') as FormArray;
  }

  adicionarServico(): void {
    const novoServico = this.criarServico();
    this.servicos.push(novoServico);
  }

  removerServico(index: number): void {
    this.servicos.removeAt(index);
  }

  getElementosControl(servicoFormGroup: any): FormControl {
    return servicoFormGroup.get('elementosControl') as FormControl;
  }

  getServicoFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  getElementos(servico: any): FormArray {
    return servico.get('elementos') as FormArray;
  }

  criarServico(servico?: any): FormGroup {
    return this.fb.group({
      idServicoTrabalho: [servico?.idServicoTrabalho || null],
      idProduto: [servico?.idProduto || null, Validators.required],
      idTrabalho: [servico?.idTrabalho || null],
      elementosControl: new FormControl([]), // Controle para o multiple-selection
      elementos: this.fb.array( // FormArray para armazenar os dados completos
        (servico?.elementos || []).map((el: any) => this.criarElemento(el))
      )
    });
  }

  criarElemento(elemento?: any): FormGroup {
    return this.fb.group({
      idElementoTrabalho: [elemento?.idElementoTrabalho || null],
      nome: [elemento?.nome || '', Validators.required],
      idUsuarioCadastro: [elemento?.idUsuarioCadastro || null],
    });
  }

  criarComponente(componente?: any): FormGroup {
    return this.fb.group({
      idComponente: [componente?.idComponente || componente?.componente?.idComponente || null],
      idComponenteTrabalho: [componente?.idComponenteTrabalho || null],
      nome: [componente?.nome || componente?.componente?.nome || '', Validators.required],
      // Adicione outros campos se necessário
    });
  }

  async onChangeStatus() {
    const idTrabalho = this.formGroup.get('idTrabalho')?.value;
    if (!idTrabalho) return;

    const status = this.formGroup.get('status')?.value;

    try {
      const result = await atualizaStatus({ status }, idTrabalho);
      if (result?.status == 200) {
        this.previousStatus = status;
        this._snackBar.open('Status atualizado com sucesso', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }
    } catch (error: any) {
      this.formGroup.get('status')?.setValue(this.previousStatus, { emitEvent: false });
      const texto = this.mensagemErroBackendStatus(error);
      this._snackBar.open(texto, 'Fechar', {
        duration: 8000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    }
  }

  /** Mensagem exibível a partir do JSON do BFF (`resposta` no HttpExceptionFilter). */
  private mensagemErroBackendStatus(error: any): string {
    const data = error?.response?.data;
    const resposta = data?.resposta;
    if (typeof resposta === 'string' && resposta.trim()) {
      return resposta.trim();
    }
    if (resposta && typeof resposta === 'object') {
      const m = (resposta as { message?: string | string[] }).message;
      if (typeof m === 'string' && m.trim()) {
        return m.trim();
      }
      if (Array.isArray(m) && m.length) {
        return m.join(', ');
      }
    }
    const legacy = data?.message;
    if (typeof legacy === 'string' && legacy.trim()) {
      return legacy.trim();
    }
    if (Array.isArray(legacy) && legacy.length) {
      return legacy.join(', ');
    }
    return 'Erro ao atualizar status';
  }
}
