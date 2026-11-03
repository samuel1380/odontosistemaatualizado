import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroComplementarEmpresaComponent } from './cadastro-complementar-empresa.component';

describe('CadastroComplementarEmpresaComponent', () => {
  let component: CadastroComplementarEmpresaComponent;
  let fixture: ComponentFixture<CadastroComplementarEmpresaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CadastroComplementarEmpresaComponent]
    });
    fixture = TestBed.createComponent(CadastroComplementarEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
