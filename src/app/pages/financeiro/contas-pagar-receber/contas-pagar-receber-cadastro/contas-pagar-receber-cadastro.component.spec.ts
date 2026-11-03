import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContasPagarReceberCadastroComponent } from './contas-pagar-receber-cadastro.component';

describe('ContasPagarReceberCadastroComponent', () => {
  let component: ContasPagarReceberCadastroComponent;
  let fixture: ComponentFixture<ContasPagarReceberCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContasPagarReceberCadastroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContasPagarReceberCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
