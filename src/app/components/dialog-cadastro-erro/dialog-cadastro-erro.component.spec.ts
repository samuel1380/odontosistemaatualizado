import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCadastroErroComponent } from './dialog-cadastro-erro.component';

describe('DialogCadastroErroComponent', () => {
  let component: DialogCadastroErroComponent;
  let fixture: ComponentFixture<DialogCadastroErroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogCadastroErroComponent]
    });
    fixture = TestBed.createComponent(DialogCadastroErroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
