import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogArquivoApagadoComponent } from './dialog-arquivo-apagado.component';

describe('DialogArquivoApagadoComponent', () => {
  let component: DialogArquivoApagadoComponent;
  let fixture: ComponentFixture<DialogArquivoApagadoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogArquivoApagadoComponent]
    });
    fixture = TestBed.createComponent(DialogArquivoApagadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
