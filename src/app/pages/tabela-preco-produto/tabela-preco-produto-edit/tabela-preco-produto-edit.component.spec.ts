import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaPrecoProdutoEditComponent } from './tabela-preco-produto-edit.component';

describe('TabelaPrecoProdutoEditComponent', () => {
  let component: TabelaPrecoProdutoEditComponent;
  let fixture: ComponentFixture<TabelaPrecoProdutoEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabelaPrecoProdutoEditComponent]
    });
    fixture = TestBed.createComponent(TabelaPrecoProdutoEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
