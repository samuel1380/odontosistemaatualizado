import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { registrarEmprestimo, CreateEmprestimoDto, listarCredores, Credor } from 'src/services/capital.service';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { format } from 'date-fns';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-emprestimo-dialog',
  templateUrl: './emprestimo-dialog.component.html',
  styleUrls: ['./emprestimo-dialog.component.sass']
})
export class EmprestimoDialogComponent {
  emprestimoForm = new FormGroup({
    tipo: new FormControl('RECEBIDO', [Validators.required]),
    valorPrincipal: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    taxaJuros: new FormControl<number | null>(null),
    dataContratacao: new FormControl(new Date(), [Validators.required]),
    dataVencimento: new FormControl<Date | null>(null),
    idCredorDevedor: new FormControl<number | null>(null),
    observacoes: new FormControl<string | null>(null),
    idCategoria: new FormControl<number | null>(null),
    idConta: new FormControl<number | null>(null),
    meioPagamento: new FormControl('TRANSFERENCIA', [Validators.required]),
  });

  tiposEmprestimo = [
    { nome: 'Empréstimo Recebido', id: 'RECEBIDO' },
    { nome: 'Empréstimo Concedido', id: 'CONCEDIDO' },
  ];

  categorias: any[] = [];
  contas: any[] = [];
  credores$ = new BehaviorSubject<Credor[]>([]);

  get idCredorDevedorControl(): FormControl<number | null> {
    return this.emprestimoForm.get('idCredorDevedor') as FormControl<number | null>;
  }

  meiosPagamento = [
    { nome: 'Dinheiro', id: 'DINHEIRO' },
    { nome: 'Cartão de Crédito', id: 'CARTAO_CREDITO' },
    { nome: 'Cartão de Débito', id: 'CARTAO_DEBITO' },
    { nome: 'Pix', id: 'PIX' },
    { nome: 'Boleto', id: 'BOLETO' },
    { nome: 'Transferência Bancária', id: 'TRANSFERENCIA' },
  ];

  constructor(
    public dialogRef: MatDialogRef<EmprestimoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) {
    this.loadData();
  }

  async loadData() {
    try {
      const [categoriasRes, contasRes, credoresRes] = await Promise.all([
        buscarCategorias(),
        buscarContas(),
        listarCredores(),
      ]);

      if (categoriasRes.status === 200) {
        // Para empréstimos recebidos é receita, para concedidos é despesa
        this.categorias = categoriasRes.data;
      }
      if (contasRes.status === 200) {
        this.contas = contasRes.data;
      }
      if (credoresRes.status === 200) {
        this.credores$.next(credoresRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  }

  async salvar() {
    if (this.emprestimoForm.invalid) {
      this.emprestimoForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.emprestimoForm.getRawValue();
      const dto: CreateEmprestimoDto = {
        tipo: formValue.tipo!,
        valorPrincipal: formValue.valorPrincipal!,
        taxaJuros: formValue.taxaJuros || undefined,
        dataContratacao: format(formValue.dataContratacao!, 'yyyy-MM-dd'),
        dataVencimento: formValue.dataVencimento ? format(formValue.dataVencimento, 'yyyy-MM-dd') : undefined,
        idCredorDevedor: formValue.idCredorDevedor || undefined,
        observacoes: formValue.observacoes || undefined,
        idCategoria: formValue.idCategoria || undefined,
        idConta: formValue.idConta || undefined,
        meioPagamento: formValue.meioPagamento || undefined,
      };

      const response = await registrarEmprestimo(dto);

      if (response?.status === 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar empréstimo', error);
    }
  }
}

