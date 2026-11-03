import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdontogramComponent } from './odontogram.component';

describe('OdontogramComponent', () => {
  let component: OdontogramComponent;
  let fixture: ComponentFixture<OdontogramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OdontogramComponent]
    });
    fixture = TestBed.createComponent(OdontogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
