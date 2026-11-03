import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoresComponent } from './cores.component';

describe('CoresComponent', () => {
  let component: CoresComponent;
  let fixture: ComponentFixture<CoresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoresComponent]
    });
    fixture = TestBed.createComponent(CoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
