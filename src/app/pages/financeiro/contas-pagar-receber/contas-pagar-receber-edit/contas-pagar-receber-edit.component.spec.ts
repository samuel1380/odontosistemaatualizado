import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContasPagarReceberEditComponent } from './contas-pagar-receber-edit.component';

describe('ContasPagarReceberEditComponent', () => {
  let component: ContasPagarReceberEditComponent;
  let fixture: ComponentFixture<ContasPagarReceberEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContasPagarReceberEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContasPagarReceberEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
