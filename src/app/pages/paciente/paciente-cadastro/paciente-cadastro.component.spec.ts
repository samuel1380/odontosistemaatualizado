import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacienteCadastroComponent } from './paciente-cadastro.component';

describe('PacienteCadastroComponent', () => {
  let component: PacienteCadastroComponent;
  let fixture: ComponentFixture<PacienteCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacienteCadastroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PacienteCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
