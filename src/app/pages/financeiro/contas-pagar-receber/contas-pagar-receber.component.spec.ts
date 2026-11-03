import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContasPagarReceberComponent } from './contas-pagar-receber.component';

describe('ContasPagarReceberComponent', () => {
  let component: ContasPagarReceberComponent;
  let fixture: ComponentFixture<ContasPagarReceberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContasPagarReceberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContasPagarReceberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
