import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-multiple-selection',
  templateUrl: './multiple-selection.component.html',
  styleUrl: './multiple-selection.component.sass'
})
export class MultipleSelectionComponent implements OnInit, OnChanges {

  separatorKeysCodes: number[] = [ENTER, COMMA];
  ItensCtrl = new FormControl('');
  filteredItens: Observable<any[]> | undefined;
  filteredItensArray: any[] = [];

  @Input() itensSelected!: FormArray;
  @Input() allItens: any[] = [];
  @Input() nomeIdentificador: string = '';
  @Input() renderName: string = '';
  @Input() unicItem: boolean = false;
  @Input() onlyList: boolean = false;
  @Input() allowCreateNew: boolean = false; // Permite criar itens novos quando não existem na lista
  @Input() titulo: string = 'Selecione';
  @Input() placeholder: string = 'Adicionar...';
  @Input()
  control!: FormControl;
  @Input() listSubscription: Observable<any[]> | undefined;

  @Output() onUpdateList = new EventEmitter<any>();

  @ViewChild('itemInput') itemInput: ElementRef<HTMLInputElement> | undefined;

  private isInternalUpdate: boolean = false; // Flag para evitar loops de atualização

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges) {
    // Só atualiza se o control existe
    if (!this.control) {
      return;
    }

    // Ignora atualizações durante mudanças internas
    if (this.isInternalUpdate) {
      return;
    }

    // Só sincroniza na primeira vez
    if (changes['itensSelected']?.firstChange) {
      // Na primeira vez, sempre atualiza sem emitir evento para evitar disparar sincronização
      this.updateControlValue(false, false);
    }
    // Para mudanças subsequentes, não atualiza aqui
    // O control será atualizado explicitamente quando necessário (addList, remove)
  }

  async ngOnInit() {
    if (!this.listSubscription) return;
    this.listSubscription.subscribe(
      (itens: any[]) => {
        this.allItens = itens;

        this.filteredItens = this.ItensCtrl.valueChanges.pipe(
          startWith(null),
          map((item: any | null) => {
            const result = (item ? this._filter(item) : this.allItens.slice());

            result.filter
            this.filteredItensArray = result;
            return result;
          }),
        );

      });

    this.updateControlValue(false, false);
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (this.onlyList) return;
    if (!value) return;

    // Se allowCreateNew está ativo, permite adicionar mesmo que não exista na lista
    if (this.allowCreateNew) {
      this.tryAddItem({
        [this.nomeIdentificador]: null,
        [this.renderName]: value
      });
    } else {
      // Comportamento original: só adiciona se existir na lista
      if (this.unicItem && this.checkExistsItem(value)) return;
      if (value) {
        this.addList({ [this.renderName]: value });
      }
    }

    event.chipInput!.clear();
    this.ItensCtrl.setValue(null);
  }

  private tryAddItem(item: any): void {
    // Se unicItem está ativo, verifica duplicatas
    if (this.unicItem) {
      const jaExiste = this.checkItemExists(item);
      if (jaExiste) {
        return; // Não adiciona se unicItem e já existe
      }
    }
    // Se unicItem está false ou não definido, permite duplicatas (para somatórias no backend)

    this.addList(item);
  }

  private checkItemExists(item: any): boolean {
    const idNovo = item[this.nomeIdentificador];
    const nomeNovo = item[this.renderName];

    return this.itensSelected.controls.some(ctrl => {
      const idAtual = ctrl.get(this.nomeIdentificador)?.value;
      const nomeAtual = ctrl.get(this.renderName)?.value;

      // Se ambos têm ID, compara por ID
      if (idAtual !== undefined && idAtual !== null && idNovo !== undefined && idNovo !== null) {
        return idAtual === idNovo;
      }

      // Se não têm ID ou um deles não tem, compara por nome
      if (nomeAtual && nomeNovo) {
        return nomeAtual.trim().toLowerCase() === nomeNovo.trim().toLowerCase();
      }

      return false;
    });
  }

  addList(item: any) {
    this.isInternalUpdate = true;

    const groupNew = this.fb.group({
      [this.nomeIdentificador]: item[this.nomeIdentificador] || null,
      [this.renderName]: item[this.renderName] || ''
    });

    // Atualiza diretamente o FormArray (passado por referência)
    this.itensSelected.push(groupNew);

    // Atualiza o control após adicionar, emitindo evento para sincronizar
    this.updateControlValue(true, true);

    this.isInternalUpdate = false;
  }

  keyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    // Previne o comportamento padrão do Enter para evitar duplicação
    keyboardEvent.preventDefault();
    keyboardEvent.stopPropagation();

    const inputValue = this.ItensCtrl.value?.trim() || '';

    // Se há exatamente um item filtrado, adiciona ele
    if (this.filteredItensArray && this.filteredItensArray.length === 1) {
      const item = this.filteredItensArray[0];
      this.tryAddItem({
        [this.nomeIdentificador]: item[this.nomeIdentificador],
        [this.renderName]: item[this.renderName] || item.nome
      });
      // Limpa o input após adicionar
      if (this.itemInput) {
        this.itemInput.nativeElement.value = '';
      }
      this.ItensCtrl.setValue(null);
    }
    // Se não há itens filtrados mas allowCreateNew está ativo e há texto digitado
    else if (this.allowCreateNew && inputValue && (!this.filteredItensArray || this.filteredItensArray.length === 0)) {
      this.tryAddItem({
        [this.nomeIdentificador]: null,
        [this.renderName]: inputValue
      });
      // Limpa o input após adicionar
      if (this.itemInput) {
        this.itemInput.nativeElement.value = '';
      }
      this.ItensCtrl.setValue(null);
    }
  }

  remove(index: number) {
    this.isInternalUpdate = true;
    this.itensSelected.removeAt(index);
    this.updateControlValue(true, true);
    this.isInternalUpdate = false;
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const itemId = event.option.value;
    const itemName = event.option.viewValue;

    this.tryAddItem({
      [this.nomeIdentificador]: itemId,
      [this.renderName]: itemName
    });

    if (this.itemInput) {
      this.itemInput.nativeElement.value = '';
    }
    this.ItensCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    if (typeof value !== 'string') return this.allItens;

    const filterValue = value.toLowerCase();
    return this.allItens.filter(item => item[this.renderName].toLowerCase().includes(filterValue));
  }

  private checkExistsItem(value: string): boolean {
    return this.itensSelected.controls.some(item => item.value[this.renderName] == value);
  }

  private checkExistsItemById(id: any): boolean {
    if (id === undefined || id === null) return false;
    return this.itensSelected.controls.some(ctrl => {
      const idAtual = ctrl.get(this.nomeIdentificador)?.value;
      return idAtual === id;
    });
  }

  private updateControlValue(markAsTouched: boolean = true, emitEvent: boolean = true): void {
    if (!this.control) {
      return;
    }

    // Obtém apenas os IDs válidos (não nulos/undefined) para o control
    // Itens sem ID não são incluídos no control, mas são preservados no FormArray
    const selectedIds = this.itensSelected.controls
      .map(ctrl => ctrl.get(this.nomeIdentificador)?.value)
      .filter(id => id !== undefined && id !== null);

    // Só atualiza se o valor realmente mudou para evitar loops
    const currentValue = this.control.value || [];
    const valuesEqual = Array.isArray(currentValue) &&
      currentValue.length === selectedIds.length &&
      currentValue.every((id: any, index: number) => id === selectedIds[index]);

    if (!valuesEqual) {
      this.control.setValue(selectedIds, { emitEvent });
    }

    if (markAsTouched) {
      this.control.markAsDirty();
      this.control.markAsTouched();
    }
  }
}
