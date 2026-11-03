import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { MatDialog } from '@angular/material/dialog';
import {
  criarFornecedor,
  atualizarFornecedor,
  FornecedorFinanceiro,
  CreateFornecedorFinanceiroDto,
} from 'src/services/financeiro.fornecedor.service';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';

@Component({
  selector: 'app-fornecedor-financeiro-dialog',
  templateUrl: './fornecedor-financeiro-dialog.component.html',
  styleUrls: ['./fornecedor-financeiro-dialog.component.sass'],
})
export class FornecedorFinanceiroDialogComponent implements OnInit {
  form = new FormGroup({
    cnpj: new FormControl(''),
    cpf: new FormControl(''),
    razaoSocial: new FormControl('', [Validators.required]),
    nomeFantasia: new FormControl<string | null>(null),
    telefone: new FormControl<string | null>(null),
    idCategoria: new FormControl<number | null>(null),
  });

  categoriasOpts: { id: number; label: string }[] = [];
  isEdit = false;
  idFornecedor?: number;

  constructor(
    public dialogRef: MatDialogRef<FornecedorFinanceiroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FornecedorFinanceiro | null,
    private dialog: MatDialog,
  ) {
    if (data) {
      this.isEdit = true;
      this.idFornecedor = data.idFornecedor;
      this.form.patchValue({
        cnpj: data.cnpj ?? '',
        cpf: data.cpf ?? '',
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia ?? null,
        telefone: data.telefone ?? null,
        idCategoria: data.idCategoria ?? null,
      });
    }
  }

  ngOnInit(): void {
    void this.carregarCategorias();
  }

  private montarCategoriasDespesa(cats: any[]): { id: number; label: string }[] {
    const desp = cats.filter((c) => c.tipo === 'DESPESA');
    const pais = desp.filter((c) => c.idCategoriaPai == null);
    const out: { id: number; label: string }[] = [];
    for (const p of pais) {
      out.push({ id: p.idCategoria, label: p.nome });
      for (const s of desp.filter((c) => c.idCategoriaPai === p.idCategoria)) {
        out.push({ id: s.idCategoria, label: `${p.nome} › ${s.nome}` });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }

  private async carregarCategorias(): Promise<void> {
    try {
      const res = await buscarCategoriasTodas();
      if (res.status === 200 && res.data) {
        this.categoriasOpts = this.montarCategoriasDespesa(res.data);
      }
    } catch (_) {
      this.categoriasOpts = [];
    }
  }

  async salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateFornecedorFinanceiroDto = {
      razaoSocial: v.razaoSocial!.trim(),
      nomeFantasia: v.nomeFantasia ? String(v.nomeFantasia).trim() || undefined : undefined,
      telefone: v.telefone ? String(v.telefone).trim() || undefined : undefined,
    };
    const cpfT = (v.cpf ?? '').trim();
    const cnpjT = (v.cnpj ?? '').trim();
    if (cpfT) dto.cpf = cpfT;
    if (cnpjT) dto.cnpj = cnpjT;
    if (v.idCategoria != null && !Number.isNaN(Number(v.idCategoria))) {
      dto.idCategoria = Number(v.idCategoria);
    }
    try {
      if (this.isEdit && this.idFornecedor) {
        await atualizarFornecedor(this.idFornecedor, {
          ...dto,
          idCategoria: v.idCategoria != null ? Number(v.idCategoria) : null,
        });
      } else {
        await criarFornecedor(dto);
      }
      this.dialog.open(DialogCadastroSucessoComponent, { width: '50%' });
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor', error);
    }
  }
}
