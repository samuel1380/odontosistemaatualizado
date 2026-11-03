import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaPrecoProdutoCadastroComponent } from './tabela-preco-produto-cadastro.component';

describe('TabelaPrecoProdutoCadastroComponent', () => {
  let component: TabelaPrecoProdutoCadastroComponent;
  let fixture: ComponentFixture<TabelaPrecoProdutoCadastroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabelaPrecoProdutoCadastroComponent]
    });
    fixture = TestBed.createComponent(TabelaPrecoProdutoCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
