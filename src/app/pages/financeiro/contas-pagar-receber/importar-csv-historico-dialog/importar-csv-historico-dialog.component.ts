import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { buscarCategoriasTodas } from 'src/services/financeiro.categoria.service';
import {
  importarLancamentosCsvHistorico,
  ImportarCsvHistoricoResultado,
} from 'src/services/financeiro.contasPagarReceber.service';
import { buscarContas } from 'src/services/financeiro.conta.service';

@Component({
  selector: 'app-importar-csv-historico-dialog',
  templateUrl: './importar-csv-historico-dialog.component.html',
  styleUrls: ['./importar-csv-historico-dialog.component.sass'],
})
export class ImportarCsvHistoricoDialogComponent {
  form = new FormGroup({
    idConta: new FormControl<number | null>(null),
    idCategoriaReceita: new FormControl<number | null>(null),
    idCategoriaDespesa: new FormControl<number | null>(null),
    arquivo: new FormControl<File | null>(null),
  });

  contas: { idConta: number; nome?: string }[] = [];
  categoriasReceita: { id: number; label: string }[] = [];
  categoriasDespesa: { id: number; label: string }[] = [];
  arquivoSelecionado: File | null = null;
  carregando = false;

  constructor(
    public dialogRef: MatDialogRef<ImportarCsvHistoricoDialogComponent>,
    private snackBar: MatSnackBar,
  ) {
    this.carregarCategorias();
    this.carregarContas();
  }

  async carregarContas() {
    try {
      const res = await buscarContas();
      if (res.status === 200 && res.data) {
        this.contas = res.data ?? [];
        if (this.contas.length === 1) {
          this.form.patchValue({ idConta: this.contas[0].idConta });
        }
      }
    } catch (e) {
      console.error(e);
      this.snackBar.open('Erro ao carregar contas.', 'Fechar', { duration: 4000 });
    }
  }

  async carregarCategorias() {
    try {
      const res = await buscarCategoriasTodas();
      if (res.status === 200 && res.data) {
        this.categoriasReceita = this.montarOpcoes(res.data, 'RECEITA');
        this.categoriasDespesa = this.montarOpcoes(res.data, 'DESPESA');
      }
    } catch (e) {
      console.error(e);
      this.snackBar.open('Erro ao carregar categorias.', 'Fechar', { duration: 4000 });
    }
  }

  private montarOpcoes(cats: any[], tipo: 'RECEITA' | 'DESPESA'): { id: number; label: string }[] {
    const filtradas = cats.filter((c) => c.tipo === tipo);
    const pais = filtradas.filter((c) => c.idCategoriaPai == null);
    const out: { id: number; label: string }[] = [];
    for (const p of pais) {
      out.push({ id: p.idCategoria, label: p.nome });
      for (const s of filtradas.filter((c) => c.idCategoriaPai === p.idCategoria)) {
        out.push({ id: s.idCategoria, label: `${p.nome} › ${s.nome}` });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.snackBar.open('Selecione um arquivo .csv', 'Fechar', { duration: 3000 });
        return;
      }
      this.arquivoSelecionado = file;
      this.form.patchValue({ arquivo: file });
    }
  }

  async importar() {
    if (!this.arquivoSelecionado) {
      this.snackBar.open('Selecione o arquivo CSV.', 'Fechar', { duration: 3000 });
      return;
    }

    const idConta = this.form.get('idConta')?.value;
    if (idConta == null) {
      this.snackBar.open('Selecione a conta (lançamentos serão marcados como pagos nessa conta).', 'Fechar', {
        duration: 5000,
      });
      return;
    }

    const idRec = this.form.get('idCategoriaReceita')?.value;
    const idDesp = this.form.get('idCategoriaDespesa')?.value;

    this.carregando = true;
    try {
      const res = await importarLancamentosCsvHistorico(
        this.arquivoSelecionado,
        idRec ?? undefined,
        idDesp ?? undefined,
        idConta,
      );
      const r: ImportarCsvHistoricoResultado = res.data;
      const cred = r.inseridosCredito ?? 0;
      const deb = r.inseridosDebito ?? 0;
      let msg = `Importados: ${cred} crédito(s), ${deb} débito(s) (${r.inseridos} lançamento(s) no total), já registrados como pagos.`;
      if (r.erros?.length) {
        msg += ` ${r.erros.length} aviso(s)/erro(s). Verifique o console ou os detalhes na resposta.`;
        console.warn('Importação CSV — erros parciais:', r.erros);
      }
      this.snackBar.open(msg, 'Fechar', { duration: 12000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message || error?.message || 'Erro ao importar CSV.';
      this.snackBar.open(
        Array.isArray(mensagem) ? mensagem.join(', ') : mensagem,
        'Fechar',
        { duration: 8000 },
      );
    } finally {
      this.carregando = false;
    }
  }
}
