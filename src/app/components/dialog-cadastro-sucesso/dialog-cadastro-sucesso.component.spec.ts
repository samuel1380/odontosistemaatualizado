import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCadastroSucessoComponent } from './dialog-cadastro-sucesso.component';

describe('DialogCadastroSucessoComponent', () => {
  let component: DialogCadastroSucessoComponent;
  let fixture: ComponentFixture<DialogCadastroSucessoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogCadastroSucessoComponent]
    });
    fixture = TestBed.createComponent(DialogCadastroSucessoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
