import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmacaoExclusaoArquivoComponent } from './dialog-confirmacao-exclusao-arquivo.component';

describe('DialogConfirmacaoExclusaoArquivoComponent', () => {
  let component: DialogConfirmacaoExclusaoArquivoComponent;
  let fixture: ComponentFixture<DialogConfirmacaoExclusaoArquivoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogConfirmacaoExclusaoArquivoComponent]
    });
    fixture = TestBed.createComponent(DialogConfirmacaoExclusaoArquivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
