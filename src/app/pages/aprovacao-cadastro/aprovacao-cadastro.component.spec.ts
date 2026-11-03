import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AprovacaoCadastroComponent } from './aprovacao-cadastro.component';

describe('AprovacaoCadastroComponent', () => {
  let component: AprovacaoCadastroComponent;
  let fixture: ComponentFixture<AprovacaoCadastroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AprovacaoCadastroComponent]
    });
    fixture = TestBed.createComponent(AprovacaoCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
