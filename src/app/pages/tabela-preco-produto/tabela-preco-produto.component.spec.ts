import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaPrecoProdutoComponent } from './tabela-preco-produto.component';

describe('TabelaPrecoProdutoComponent', () => {
  let component: TabelaPrecoProdutoComponent;
  let fixture: ComponentFixture<TabelaPrecoProdutoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabelaPrecoProdutoComponent]
    });
    fixture = TestBed.createComponent(TabelaPrecoProdutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
