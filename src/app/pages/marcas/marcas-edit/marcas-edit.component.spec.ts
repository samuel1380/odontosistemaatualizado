import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcasEditComponent } from './marcas-edit.component';

describe('MarcasEditComponent', () => {
  let component: MarcasEditComponent;
  let fixture: ComponentFixture<MarcasEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MarcasEditComponent]
    });
    fixture = TestBed.createComponent(MarcasEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
