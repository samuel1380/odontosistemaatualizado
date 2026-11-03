import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalheCadastroComponent } from './detalhe-cadastro.component';

describe('DetalheCadastroComponent', () => {
  let component: DetalheCadastroComponent;
  let fixture: ComponentFixture<DetalheCadastroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetalheCadastroComponent]
    });
    fixture = TestBed.createComponent(DetalheCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
