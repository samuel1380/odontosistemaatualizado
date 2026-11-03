import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import {
  importarOfxContasPagar,
  ImportarOfxContasPagarResultado,
} from 'src/services/financeiro.contasPagarReceber.service';

@Component({
  selector: 'app-importar-ofx-contas-pagar-dialog',
  templateUrl: './importar-ofx-contas-pagar-dialog.component.html',
  styleUrls: ['./importar-ofx-contas-pagar-dialog.component.sass'],
})
export class ImportarOfxContasPagarDialogComponent {
  form = new FormGroup({
    idCategoria: new FormControl<number | null>(null, [Validators.required]),
    idConta: new FormControl<number | null>(null, [Validators.required]),
    arquivo: new FormControl<File | null>(null, [Validators.required]),
  });

  categoriasOpts: { id: number; label: string }[] = [];
  contas: { idConta: number; nome?: string; descricao?: string }[] = [];
  arquivoSelecionado: File | null = null;
  carregando = false;

  constructor(
    public dialogRef: MatDialogRef<ImportarOfxContasPagarDialogComponent>,
    private snackBar: MatSnackBar,
  ) {
    this.carregarListas();
  }

  async carregarListas() {
    try {
      const [catRes, contasRes] = await Promise.all([buscarCategoriasTodas(), buscarContas()]);
      if (catRes.status === 200 && catRes.data) {
        this.categoriasOpts = this.montarCategoriasDespesa(catRes.data);
      }
      if (contasRes.status === 200 && contasRes.data) {
        this.contas = (contasRes.data as any[]).filter((c) => c.ativo);
      }
    } catch (e) {
      console.error(e);
      this.snackBar.open('Erro ao carregar categorias ou contas.', 'Fechar', { duration: 4000 });
    }
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.ofx')) {
        this.snackBar.open('Selecione um arquivo .ofx', 'Fechar', { duration: 3000 });
        return;
      }
      this.arquivoSelecionado = file;
      this.form.patchValue({ arquivo: file });
    }
  }

  async importar() {
    if (this.form.invalid || !this.arquivoSelecionado) {
      this.form.markAllAsTouched();
      if (!this.arquivoSelecionado) {
        this.snackBar.open('Selecione o arquivo OFX.', 'Fechar', { duration: 3000 });
      }
      return;
    }

    const idCategoria = this.form.get('idCategoria')?.value;
    const idConta = this.form.get('idConta')?.value;

    this.carregando = true;
    try {
      const res = await importarOfxContasPagar(this.arquivoSelecionado, idCategoria!, idConta!);
      const r: ImportarOfxContasPagarResultado = res.data;
      const msg = [
        `${r.inseridos} lançamento(s) importado(s).`,
        r.ignoradosDuplicados ? `${r.ignoradosDuplicados} ignorado(s) (já existentes).` : '',
        r.ignoradosSemFitId ? `${r.ignoradosSemFitId} sem FITID.` : '',
        r.ignoradosValorNaoNegativo ? `${r.ignoradosValorNaoNegativo} não débito.` : '',
        r.semFornecedorAutomatico
          ? `${r.semFornecedorAutomatico} sem CPF/CNPJ no extrato (sem fornecedor automático).`
          : '',
        r.classificadosPelaCategoriaDoFornecedor
          ? `${r.classificadosPelaCategoriaDoFornecedor} com categoria do cadastro do fornecedor.`
          : '',
      ]
        .filter(Boolean)
        .join(' ');
      this.snackBar.open(msg, 'Fechar', { duration: 10000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message || error?.message || 'Erro ao importar OFX.';
      this.snackBar.open(mensagem, 'Fechar', { duration: 6000 });
    } finally {
      this.carregando = false;
    }
  }
}
