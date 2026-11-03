import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentesEditComponent } from './componentes-edit.component';

describe('ComponentesEditComponent', () => {
  let component: ComponentesEditComponent;
  let fixture: ComponentFixture<ComponentesEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComponentesEditComponent]
    });
    fixture = TestBed.createComponent(ComponentesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
