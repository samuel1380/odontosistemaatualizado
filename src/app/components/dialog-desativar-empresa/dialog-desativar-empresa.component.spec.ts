import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDesativarEmpresaComponent } from './dialog-desativar-empresa.component';

describe('DialogDesativarEmpresaComponent', () => {
  let component: DialogDesativarEmpresaComponent;
  let fixture: ComponentFixture<DialogDesativarEmpresaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogDesativarEmpresaComponent]
    });
    fixture = TestBed.createComponent(DialogDesativarEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
