import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEnvioFotoComponent } from './dialog-envio-foto.component';

describe('DialogEnvioFotoComponent', () => {
  let component: DialogEnvioFotoComponent;
  let fixture: ComponentFixture<DialogEnvioFotoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogEnvioFotoComponent]
    });
    fixture = TestBed.createComponent(DialogEnvioFotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
