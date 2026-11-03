import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContasCadastroComponent } from './contas-cadastro.component';

describe('ContasCadastroComponent', () => {
  let component: ContasCadastroComponent;
  let fixture: ComponentFixture<ContasCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContasCadastroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContasCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
