import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DespesasRecorrentesCadastroComponent } from './despesas-recorrentes-cadastro.component';

describe('DespesasRecorrentesCadastroComponent', () => {
  let component: DespesasRecorrentesCadastroComponent;
  let fixture: ComponentFixture<DespesasRecorrentesCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DespesasRecorrentesCadastroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DespesasRecorrentesCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
