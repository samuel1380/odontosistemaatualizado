import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { registrarAporte, CreateAporteDto, listarSocios, Socio } from 'src/services/capital.service';
import { buscarCategorias } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { format } from 'date-fns';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-aporte-dialog',
  templateUrl: './aporte-dialog.component.html',
  styleUrls: ['./aporte-dialog.component.sass']
})
export class AporteDialogComponent {
  aporteForm = new FormGroup({
    idSocio: new FormControl<number | null>(null),
    dataAporte: new FormControl(new Date(), [Validators.required]),
    valor: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    tipo: new FormControl('APORTE_CAPITAL', [Validators.required]),
    observacoes: new FormControl<string | null>(null),
    idCategoria: new FormControl<number | null>(null),
    idConta: new FormControl<number | null>(null),
    meioPagamento: new FormControl('TRANSFERENCIA', [Validators.required]),
  });

  tiposAporte = [
    { nome: 'Aporte de Capital', id: 'APORTE_CAPITAL' },
    { nome: 'Distribuição de Lucros', id: 'DISTRIBUICAO_LUCROS' },
  ];

  categorias: any[] = [];
  contas: any[] = [];
  socios$ = new BehaviorSubject<Socio[]>([]);

  get idSocioControl(): FormControl<number | null> {
    return this.aporteForm.get('idSocio') as FormControl<number | null>;
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
    public dialogRef: MatDialogRef<AporteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) {
    this.loadData();
  }

  async loadData() {
    try {
      const [categoriasRes, contasRes, sociosRes] = await Promise.all([
        buscarCategorias(),
        buscarContas(),
        listarSocios(),
      ]);

      if (categoriasRes.status === 200) {
        this.categorias = categoriasRes.data.filter((c: any) => c.tipo === 'RECEITA');
      }
      if (contasRes.status === 200) {
        this.contas = contasRes.data;
      }
      if (sociosRes.status === 200) {
        this.socios$.next(sociosRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  }

  async salvar() {
    if (this.aporteForm.invalid) {
      this.aporteForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.aporteForm.getRawValue();
      const dto: CreateAporteDto = {
        idSocio: formValue.idSocio || undefined,
        dataAporte: format(formValue.dataAporte!, 'yyyy-MM-dd'),
        valor: formValue.valor!,
        tipo: formValue.tipo!,
        observacoes: formValue.observacoes || undefined,
        idCategoria: formValue.idCategoria || undefined,
        idConta: formValue.idConta || undefined,
        meioPagamento: formValue.meioPagamento || undefined,
      };

      const response = await registrarAporte(dto);

      if (response?.status === 201) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao salvar aporte', error);
    }
  }
}

