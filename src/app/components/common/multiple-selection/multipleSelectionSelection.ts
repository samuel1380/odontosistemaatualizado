import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class MultipleSelectionService {

  private multipleSelectionSubject = new Subject<any[]>();

  allItens$ = this.multipleSelectionSubject.asObservable();

  salvarTodosItens(itens: any[]) {
    this.multipleSelectionSubject.next(itens);
  }

}
