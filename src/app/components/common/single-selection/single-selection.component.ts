import { Component, Input, OnInit, OnDestroy, forwardRef, Self, Optional } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable, Subject, of, combineLatest } from 'rxjs';
import { map, startWith, take, takeUntil, tap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-single-selection',
  templateUrl: './single-selection.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SingleSelectionComponent),
      multi: true
    }
  ],
})
export class SingleSelectionComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() titulo: string = 'Item';
  @Input() placeholder: string = 'Selecione um item';
  @Input() lista$: Observable<any[]> = of([]);
  @Input() renderName: string = 'nome';
  @Input() nomeIdentificador: string = 'id';
  itemCtrl = new FormControl(); // Controle interno para o campo de input

  private internalList: any[] = [];
  filteredItems!: Observable<any[]>;

  private _onDestroy = new Subject<void>();

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    const search$ = this.itemCtrl.valueChanges.pipe(
      startWith(''), // Emit immediately
      map(value => (typeof value === 'string' ? value : value?.[this.renderName] || ''))
    );

    this.filteredItems = combineLatest([this.lista$, search$]).pipe(
      tap(([list, _]) => {
        this.internalList = list; // Keep an internal copy for writeValue
      }),
      map(([list, search]) => this._filter(list, search)),
      takeUntil(this._onDestroy)
    );

    // Escuta as mudanças no input para notificar o componente pai
    this.itemCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(value => {
        if (typeof value === 'string') {
          this.onChange(value); // Emite o texto digitado para o formControl pai
        } else if (value === null || value === '') {
            this.onChange(null); // Emite nulo se estiver vazio
        }
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  writeValue(value: any): void {
    if (value) {
      if (this.internalList.length > 0) {
        const selectedItem = this.internalList.find(item => item[this.nomeIdentificador] === value);
        this.itemCtrl.setValue(selectedItem || null);
      } else {
        // Se a lista ainda não foi carregada, espera o primeiro valor dela
        this.lista$.pipe(filter(list => list && list.length > 0), take(1)).subscribe(list => {
          const selectedItem = list.find(item => item[this.nomeIdentificador] === value);
          this.itemCtrl.setValue(selectedItem || null);
        });
      }
    } else {
      this.itemCtrl.setValue(null);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.itemCtrl.disable() : this.itemCtrl.enable();
  }

  private _filter(list: any[], name: string): any[] {
    if (!name) {
      return list.slice();
    }
    const filterValue = name.toLowerCase();
    return list.filter(item => item[this.renderName].toLowerCase().includes(filterValue));
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const selectedItem = event.option.value;
    if (!selectedItem) {
      return;
    }
    this.onChange(selectedItem[this.nomeIdentificador]);
    this.onTouched();
  }

  displayFn(item: any): string {
    return item && typeof item === 'object' ? item[this.renderName] : item;
  }

  clearSelection() {
    this.itemCtrl.setValue(null);
    this.onChange(null);
    this.onTouched();
  }

  handleBlur() {
    // Apenas marca o campo como "tocado" ao perder o foco.
    // A lógica que limpava o campo foi removida para manter o texto digitado.
    this.onTouched();
  }
}
