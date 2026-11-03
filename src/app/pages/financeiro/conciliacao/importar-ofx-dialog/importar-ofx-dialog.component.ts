import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogCadastroSucessoComponent } from 'src/app/components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { importarArquivoOfx } from 'src/services/conciliacao.service';
import { buscarContas } from 'src/services/financeiro.conta.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-importar-ofx-dialog',
  templateUrl: './importar-ofx-dialog.component.html',
  styleUrls: ['./importar-ofx-dialog.component.sass']
})
export class ImportarOfxDialogComponent {
  importarForm = new FormGroup({
    idConta: new FormControl<number | null>(null, [Validators.required]),
    arquivo: new FormControl<File | null>(null, [Validators.required]),
  });

  contas$ = new BehaviorSubject<any[]>([]);
  arquivoSelecionado: File | null = null;
  carregando = false;

  get idContaControl(): FormControl<number | null> {
    return this.importarForm.get('idConta') as FormControl<number | null>;
  }

  get arquivoControl(): FormControl<File | null> {
    return this.importarForm.get('arquivo') as FormControl<File | null>;
  }

  constructor(
    public dialogRef: MatDialogRef<ImportarOfxDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    try {
      console.log('ImportarOfxDialogComponent: Inicializando componente...');
      this.loadContas();
    } catch (error) {
      console.error('Erro no construtor do ImportarOfxDialogComponent:', error);
    }
  }

  async loadContas() {
    try {
      const contasRes = await buscarContas();
      if (contasRes.status === 200) {
        this.contas$.next(contasRes.data.filter((c: any) => c.ativo));
      }
    } catch (error) {
      console.error('Erro ao carregar contas', error);
      this.snackBar.open('Erro ao carregar contas', 'Fechar', { duration: 3000 });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.ofx')) {
        this.snackBar.open('Por favor, selecione um arquivo .ofx', 'Fechar', { duration: 3000 });
        return;
      }
      this.arquivoSelecionado = file;
      this.arquivoControl.setValue(file);
    }
  }

  async importar() {
    if (this.importarForm.invalid) {
      this.importarForm.markAllAsTouched();
      return;
    }

    if (!this.arquivoSelecionado) {
      this.snackBar.open('Por favor, selecione um arquivo', 'Fechar', { duration: 3000 });
      return;
    }

    this.carregando = true;

    try {
      const formValue = this.importarForm.getRawValue();
      const response = await importarArquivoOfx(this.arquivoSelecionado, formValue.idConta!);

      if (response?.status === 201 || response?.status === 200) {
        this.dialog.open(DialogCadastroSucessoComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      console.error('Erro ao importar arquivo OFX', error);
      const mensagem = error?.response?.data?.message || 'Erro ao importar arquivo OFX';
      this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
    } finally {
      this.carregando = false;
    }
  }
}
