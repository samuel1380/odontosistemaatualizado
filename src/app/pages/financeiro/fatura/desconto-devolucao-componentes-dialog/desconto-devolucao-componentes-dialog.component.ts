import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FaturaService, Fatura } from 'src/services/financeiro.fatura.service';
import { Observable, of, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface ComponenteOption {
  idComponente: number;
  nome: string;
  preco: number;
}

interface PacienteOption {
  idPacienteKey: string;
  nomePaciente: string;
  quantidadeDisponivel: number;
  idPaciente: number | null;
  nomePacienteClean: string;
}

@Component({
  selector: 'app-desconto-devolucao-componentes-dialog',
  templateUrl: './desconto-devolucao-componentes-dialog.component.html',
  styleUrls: ['./desconto-devolucao-componentes-dialog.component.sass']
})
export class DescontoDevolucaoComponentesDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  componentes: ComponenteOption[] = [];
  fatura!: Fatura;
  carregando = true;
  salvando = false;

  // Controles de autocompletar por linha
  compCtrls: FormControl<any>[] = [];
  pacCtrls: FormControl<any>[] = [];
  filteredComponentes: Observable<ComponenteOption[]>[] = [];
  filteredPacientes: Observable<PacienteOption[]>[] = [];
  pacientesPorLinha: PacienteOption[][] = [];

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DescontoDevolucaoComponentesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idFatura: number },
    private faturaService: FaturaService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get itemsFormArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  getCompCtrl(i: number): FormControl {
    return this.compCtrls[i];
  }

  getPacCtrl(i: number): FormControl {
    return this.pacCtrls[i];
  }

  displayNome(item: ComponenteOption | string): string {
    if (!item) return '';
    return typeof item === 'object' ? item.nome : item;
  }

  displayNomePaciente(item: PacienteOption | string): string {
    if (!item) return '';
    return typeof item === 'object' ? item.nomePaciente : item;
  }

  onComponenteSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const comp: ComponenteOption = event.option.value;
    console.log('[onComponenteSelected] Componente selecionado:', comp, 'linha:', index);
    // Atualiza o FormControl hidden com o ID
    this.itemsFormArray.at(index).get('idComponente')?.setValue(comp.idComponente);
    // Recarrega a lista de pacientes para esse componente
    const patients = this.obterPacientesDoComponente(comp.idComponente);
    console.log('[onComponenteSelected] Pacientes encontrados:', patients);
    this.pacientesPorLinha[index] = patients;
    // Recria o filteredPacientes para essa linha com novo pipe
    const pacCtrl = this.pacCtrls[index];
    pacCtrl.setValue('', { emitEvent: false });
    this.filteredPacientes[index] = pacCtrl.valueChanges.pipe(
      startWith(''),
      map(val => {
        const search = typeof val === 'string' ? val : ((val as PacienteOption)?.nomePaciente || '');
        const result = search
          ? patients.filter(p => p.nomePaciente.toLowerCase().includes(search.toLowerCase()))
          : patients.slice();
        console.log('[filteredPacientes pipe] search:', search, 'results:', result.length);
        return result;
      })
    );
    // Limpa a seleção anterior do paciente
    this.itemsFormArray.at(index).get('idPaciente')?.setValue('');
    this.itemsFormArray.at(index).get('nomePaciente')?.setValue('');
    // Força emissão para atualizar o autocomplete
    pacCtrl.setValue('', { emitEvent: true });
    // Redefine validação da quantidade
    this.setQuantityValidators(index, null);
    console.log('[onComponenteSelected] filteredPacientes[', index, '] atualizado.');
  }

  onPacienteSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const pac: PacienteOption = event.option.value;
    this.itemsFormArray.at(index).get('idPaciente')?.setValue(pac.idPacienteKey);
    this.itemsFormArray.at(index).get('nomePaciente')?.setValue(pac.nomePacienteClean);
    this.setQuantityValidators(index, pac.quantidadeDisponivel);
  }

  limparComponente(index: number): void {
    this.compCtrls[index].setValue('');
    this.itemsFormArray.at(index).get('idComponente')?.setValue('');
    this.pacientesPorLinha[index] = [];
    this.limparPaciente(index);
  }

  limparPaciente(index: number): void {
    this.pacCtrls[index].setValue('');
    this.itemsFormArray.at(index).get('idPaciente')?.setValue('');
    this.itemsFormArray.at(index).get('nomePaciente')?.setValue('');
    this.setQuantityValidators(index, null);
  }

  setQuantityValidators(index: number, max: number | null): void {
    const ctrl = this.itemsFormArray.at(index).get('quantidade');
    if (!ctrl) return;
    if (max !== null) {
      ctrl.setValidators([Validators.required, Validators.min(1), Validators.max(max)]);
    } else {
      ctrl.setValidators([Validators.required, Validators.min(1)]);
    }
    ctrl.updateValueAndValidity();
  }

  addItem(idComponente?: number, quantidade?: number, idPacienteKey?: string, nomePaciente?: string): void {
    const index = this.itemsFormArray.length;

    const group = this.fb.group({
      idComponente: [idComponente || '', Validators.required],
      quantidade: [quantidade || 1, [Validators.required, Validators.min(1)]],
      idPaciente: [idPacienteKey || ''],
      nomePaciente: [nomePaciente || '']
    });
    this.itemsFormArray.push(group);

    // Controle interno do autocompletar de Componente
    const compCtrl = new FormControl<any>('');
    this.compCtrls.push(compCtrl);

    // Controle interno do autocompletar de Paciente
    const pacCtrl = new FormControl<any>('');
    this.pacCtrls.push(pacCtrl);

    // Pacientes disponíveis para essa linha
    this.pacientesPorLinha.push([]);

    // Filtered Componentes para essa linha
    this.filteredComponentes.push(
      compCtrl.valueChanges.pipe(
        startWith(''),
        map(val => {
          const search = typeof val === 'string' ? val : ((val as ComponenteOption)?.nome || '');
          return search
            ? this.componentes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()))
            : this.componentes.slice();
        })
      )
    );

    // Filtered Pacientes inicialmente vazio
    this.filteredPacientes.push(
      pacCtrl.valueChanges.pipe(
        startWith(''),
        map(val => {
          const search = typeof val === 'string' ? val : ((val as PacienteOption)?.nomePaciente || '');
          const patients = this.pacientesPorLinha[index] || [];
          return search
            ? patients.filter(p => p.nomePaciente.toLowerCase().includes(search.toLowerCase()))
            : patients.slice();
        })
      )
    );

    // Se já veio com componente (carregando devoluções salvas), pré-preenche e carrega pacientes
    if (idComponente) {
      const comp = this.componentes.find(c => c.idComponente === idComponente);
      if (comp) {
        compCtrl.setValue(comp, { emitEvent: false });
        const patients = this.obterPacientesDoComponente(idComponente);
        this.pacientesPorLinha[index] = patients;
        // Atualiza observable de pacientes com a lista correta
        this.filteredPacientes[index] = pacCtrl.valueChanges.pipe(
          startWith(''),
          map(val => {
            const search = typeof val === 'string' ? val : ((val as PacienteOption)?.nomePaciente || '');
            return search
              ? patients.filter(p => p.nomePaciente.toLowerCase().includes(search.toLowerCase()))
              : patients.slice();
          })
        );
        // Se já há um paciente selecionado, pré-preenche
        if (idPacienteKey) {
          const pac = patients.find(p => String(p.idPacienteKey) === String(idPacienteKey));
          if (pac) {
            pacCtrl.setValue(pac, { emitEvent: false });
            this.setQuantityValidators(index, pac.quantidadeDisponivel);
          } else if (nomePaciente) {
            // Paciente salvo que não aparece mais na lista (ex: status alterado)
            pacCtrl.setValue(nomePaciente, { emitEvent: false });
          }
        }
      }
    }
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.compCtrls.splice(index, 1);
    this.pacCtrls.splice(index, 1);
    this.filteredComponentes.splice(index, 1);
    this.filteredPacientes.splice(index, 1);
    this.pacientesPorLinha.splice(index, 1);
  }

  obterComponentesDaFatura(): ComponenteOption[] {
    if (!this.fatura || !this.fatura.ordensDeServico) {
      return [];
    }
    const compMap = new Map<number, ComponenteOption>();
    this.fatura.ordensDeServico.forEach(os => {
      if (os.itens) {
        os.itens.forEach(item => {
          if (item.tipoCobranca?.toUpperCase() === 'COMPONENTE' && item.idReferencia) {
            const idComp = Number(item.idReferencia);
            if (!compMap.has(idComp)) {
              const preco = Number(item.valor || 0);
              const precoFormatado = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              compMap.set(idComp, {
                idComponente: idComp,
                nome: `${item.descricao} - ${precoFormatado}`,
                preco: preco
              });
            }
          }
        });
      }
    });
    return Array.from(compMap.values());
  }

  obterPacientesDoComponente(idComponente: number): PacienteOption[] {
    console.log('[obterPacientesDoComponente] idComponente:', idComponente);
    console.log('[obterPacientesDoComponente] fatura:', this.fatura?.idFatura, 'ordensDeServico count:', this.fatura?.ordensDeServico?.length);
    if (!this.fatura || !this.fatura.ordensDeServico || !idComponente) {
      console.warn('[obterPacientesDoComponente] FATURA OU OS AUSENTE - retornando vazio');
      return [];
    }
    const patientMap = new Map<string, { idPaciente: number | null; nomePaciente: string; quantidadeDisponivel: number }>();

    this.fatura.ordensDeServico.forEach((os, osIdx) => {
      if (os.itens && os.trabalho) {
        os.itens.forEach((item, itemIdx) => {
          const tipoUpper = item.tipoCobranca?.toUpperCase();
          const idRefNum = Number(item.idReferencia);
          const isMatch = tipoUpper === 'COMPONENTE' && idRefNum === Number(idComponente);
          if (isMatch) {
            const idPac = os.trabalho.idPaciente;
            const nomePac = os.trabalho.nomePaciente;
            const qtd = Number(item.quantidade || 0);
            const qtdDev = Number(item.quantidadeDevolvida || 0);
            // Usamos a quantidade total cobrada como base do desconto financeiro.
            // quantidadeDevolvida refere-se à devolução física já registrada, não ao desconto.
            console.log(`[obterPacientesDoComponente] OS[${osIdx}] Item[${itemIdx}] MATCH - paciente: ${os.trabalho.nomePaciente}, qtd: ${item.quantidade}, qtdDev: ${item.quantidadeDevolvida}`);

            if (qtd > 0 && (idPac || nomePac)) {
              const key = idPac ? String(idPac) : String(nomePac);
              const existing = patientMap.get(key);
              if (existing) {
                existing.quantidadeDisponivel += qtd;
              } else {
                patientMap.set(key, {
                  idPaciente: idPac ? Number(idPac) : null,
                  nomePaciente: nomePac || `Paciente #${idPac}`,
                  quantidadeDisponivel: qtd
                });
              }
            } else {
              console.log(`[obterPacientesDoComponente] Item ignorado - qtd: ${qtd}, idPac: ${idPac}, nomePac: ${nomePac}`);
            }
          }
        });
      } else {
        console.warn(`[obterPacientesDoComponente] OS[${osIdx}] sem itens ou sem trabalho. itens:`, !!os.itens, 'trabalho:', !!os.trabalho);
      }
    });

    const result = Array.from(patientMap.entries()).map(([key, val]) => ({
      idPacienteKey: key,
      nomePaciente: `${val.nomePaciente} (${val.quantidadeDisponivel} un. disponível)`,
      quantidadeDisponivel: val.quantidadeDisponivel,
      idPaciente: val.idPaciente,
      nomePacienteClean: val.nomePaciente
    }));
    console.log('[obterPacientesDoComponente] resultado final:', result);
    return result;
  }

  obterMaxPermitido(index: number): number | null {
    const idPacKey = this.itemsFormArray.at(index)?.get('idPaciente')?.value;
    if (idPacKey) {
      const patients = this.pacientesPorLinha[index] || [];
      const found = patients.find(p => String(p.idPacienteKey) === String(idPacKey));
      return found ? found.quantidadeDisponivel : null;
    }
    return null;
  }

  isFormValido(): boolean {
    // Verifica que todos os itens têm um componente selecionado (via id, não apenas texto digitado)
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const row = this.itemsFormArray.at(i);
      if (!row.get('idComponente')?.value) return false;
      if ((row.get('quantidade')?.value || 0) < 1) return false;
      if (row.get('quantidade')?.invalid) return false;
    }
    return true;
  }

  async carregarDados(): Promise<void> {
    this.carregando = true;
    try {
      this.fatura = await this.faturaService.buscarFaturaPorId(this.data.idFatura).toPromise() as Fatura;
      console.log('[carregarDados] Fatura carregada:', this.fatura?.idFatura);
      console.log('[carregarDados] ordensDeServico:', this.fatura?.ordensDeServico?.length);
      if (this.fatura?.ordensDeServico?.length) {
        const primeiraOS = this.fatura.ordensDeServico[0];
        console.log('[carregarDados] Primeira OS - itens:', primeiraOS?.itens?.length, 'trabalho:', primeiraOS?.trabalho?.nomePaciente);
        if (primeiraOS?.itens?.length) {
          console.log('[carregarDados] Primeiro item da primeira OS:', primeiraOS.itens[0]);
        }
      }
      this.componentes = this.obterComponentesDaFatura();
      console.log('[carregarDados] Componentes da fatura:', this.componentes);

      this.faturaService.buscarDevolucoesComponentes(this.data.idFatura).subscribe({
        next: (devolucoes) => {
          if (devolucoes && devolucoes.length > 0) {
            devolucoes.forEach((dev) => {
              const idPacKey = dev.idPaciente ? String(dev.idPaciente) : (dev.nomePaciente ? String(dev.nomePaciente) : '');
              this.addItem(dev.idComponente, dev.quantidade, idPacKey, dev.nomePaciente);
            });
          } else {
            this.addItem();
          }
          this.carregando = false;
        },
        error: (err) => {
          console.error('Erro ao buscar devoluções da fatura', err);
          this.snackBar.open('Falha ao carregar devoluções da fatura.', 'Fechar', { duration: 4000 });
          this.addItem();
          this.carregando = false;
        }
      });
    } catch (err) {
      console.error('Erro ao carregar dados do diálogo', err);
      this.snackBar.open('Falha ao carregar dados da fatura.', 'Fechar', { duration: 4000 });
      this.carregando = false;
    }
  }

  calcularTotalGeral(): number {
    let total = 0;
    this.itemsFormArray.controls.forEach((control, i) => {
      const idComp = control.get('idComponente')?.value;
      const qtd = Number(control.get('quantidade')?.value || 0);
      if (idComp) {
        const comp = this.componentes.find(c => c.idComponente === Number(idComp));
        if (comp) {
          total += comp.preco * qtd;
        }
      }
    });
    return total;
  }

  salvar(): void {
    if (!this.isFormValido()) {
      this.snackBar.open('Preencha corretamente todos os campos de componente e quantidade.', 'Fechar', { duration: 4000 });
      return;
    }

    const payload = this.itemsFormArray.value.map((item: any) => {
      const isNumeric = /^\d+$/.test(String(item.idPaciente));
      return {
        idComponente: Number(item.idComponente),
        quantidade: Number(item.quantidade),
        idPaciente: isNumeric ? Number(item.idPaciente) : null,
        nomePaciente: item.nomePaciente || null
      };
    });

    const keySet = new Set<string>();
    for (const p of payload) {
      const key = `${p.idComponente}_${p.idPaciente || 'null'}_${p.nomePaciente || 'null'}`;
      if (keySet.has(key)) {
        this.snackBar.open('Não é permitido adicionar o mesmo componente duplicado para o mesmo paciente. Combine as quantidades ou remova as duplicidades.', 'Fechar', { duration: 5000 });
        return;
      }
      keySet.add(key);
    }

    this.salvando = true;
    this.faturaService.salvarDevolucoesComponentes(this.data.idFatura, payload).subscribe({
      next: () => {
        this.snackBar.open('Desconto por devolução salvo com sucesso!', 'Fechar', { duration: 3000 });
        this.dialogRef.close({ alterado: true });
        this.salvando = false;
      },
      error: (err) => {
        console.error('Erro ao salvar devoluções', err);
        this.snackBar.open(err?.error?.resposta || 'Falha ao salvar desconto. Tente novamente.', 'Fechar', { duration: 5000 });
        this.salvando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close({ alterado: false });
  }
}
