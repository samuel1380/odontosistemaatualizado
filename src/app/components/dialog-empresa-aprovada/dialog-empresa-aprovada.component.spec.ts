import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEmpresaAprovadaComponent } from './dialog-empresa-aprovada.component';

describe('DialogEmpresaAprovadaComponent', () => {
  let component: DialogEmpresaAprovadaComponent;
  let fixture: ComponentFixture<DialogEmpresaAprovadaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogEmpresaAprovadaComponent]
    });
    fixture = TestBed.createComponent(DialogEmpresaAprovadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
