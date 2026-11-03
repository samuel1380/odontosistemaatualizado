import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { registrarEntrega, CreateEntregaDto } from 'src/services/logistica.service';
import { listarFornecedores, FornecedorLogistica } from 'src/services/logistica.service';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-entrega-dialog',
  templateUrl: './entrega-dialog.component.html',
  styleUrls: ['./entrega-dialog.component.sass']
})
export class EntregaDialogComponent {
  entregaForm = new FormGroup({
    idFornecedorLogistica: new FormControl<number | null>(null, [Validators.required]),
    dataEntrega: new FormControl(new Date(), [Validators.required]),
    origem: new FormControl('', [Validators.required]),
    destino: new FormControl('', [Validators.required]),
    peso: new FormControl<number | null>(null),
    valorFrete: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    observacoes: new FormControl<string | null>(null),
    idCategoria: new FormControl<number | null>(null),
    idConta: new FormControl<number | null>(null),
    meioPagamento: new FormControl('DINHEIRO', [Validators.required]),
  });

  fornecedores: FornecedorLogistica[] = [];
  categorias: any[] = [];
  contas: any[] = [];

  meiosPagamento = [
    { nome: 'Dinheiro', id: 'DINHEIRO' },
    { nome: 'Cartão de Crédito', id: 'CARTAO_CREDITO' },
    { nome: 'Cartão de Débito', id: 'CARTAO_DEBITO' },
    { nome: 'Pix', id: 'PIX' },
    { nome: 'Boleto', id: 'BOLETO' },
    { nome: 'Transferência Bancária', id: 'TRANSFERENCIA' },
  ];

  constructor(
    public dialogRef: MatDialogRef<EntregaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idFornecedorLogistica?: number } | null,
    private dialog: MatDialog,
  ) {
    this.loadData();
    
    if (data?.idFornecedorLogistica) {
      this.entregaForm.patchValue({ idFornecedorLogistica: data.idFornecedorLogistica });
    }
  }

  async loadData() {
    try {
      const [fornecedoresRes, categoriasRes, contasRes] = await Promise.all([
        listarFornecedores(),
        buscarCategorias(),
        buscarContas(),
      ]);

      if (fornecedoresRes.status === 200) {
        this.fornecedores = fornecedoresRes.data;
      }
      if (categoriasRes.status === 200) {
        this.categorias = categoriasRes.data.filter((c: any) => c.tipo === 'DESPESA');
      }
      if (contasRes.status === 200) {
        this.contas = contasRes.data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  }

  async salvar() {
    if (this.entregaForm.invalid) {
      this.entregaForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.entregaForm.getRawValue();
      const dto: CreateEntregaDto = {
        idFornecedorLogistica: formValue.idFornecedorLogistica!,
        dataEntrega: format(formValue.dataEntrega!, 'yyyy-MM-dd'),
        origem: formValue.origem!,
        destino: formValue.destino!,
        peso: formValue.peso || undefined,
        valorFrete: formValue.valorFrete!,
        observacoes: formValue.observacoes || undefined,
        idCategoria: formValue.idCategoria || undefined,
        idConta: formValue.idConta || undefined,
        meioPagamento: formValue.meioPagamento || undefined,
      };

      const response = await registrarEntrega(dto);

      if (response?.status === 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar entrega', error);
    }
  }
}

