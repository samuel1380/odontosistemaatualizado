import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcasCadastroComponent } from './marcas-cadastro.component';

describe('MarcasCadastroComponent', () => {
  let component: MarcasCadastroComponent;
  let fixture: ComponentFixture<MarcasCadastroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MarcasCadastroComponent]
    });
    fixture = TestBed.createComponent(MarcasCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
