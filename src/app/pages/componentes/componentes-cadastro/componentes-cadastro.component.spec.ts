import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentesCadastroComponent } from './componentes-cadastro.component';

describe('ComponentesCadastroComponent', () => {
  let component: ComponentesCadastroComponent;
  let fixture: ComponentFixture<ComponentesCadastroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComponentesCadastroComponent]
    });
    fixture = TestBed.createComponent(ComponentesCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
