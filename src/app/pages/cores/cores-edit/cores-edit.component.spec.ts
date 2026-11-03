import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoresEditComponent } from './cores-edit.component';

describe('CoresEditComponent', () => {
  let component: CoresEditComponent;
  let fixture: ComponentFixture<CoresEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoresEditComponent]
    });
    fixture = TestBed.createComponent(CoresEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
