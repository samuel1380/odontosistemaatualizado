import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErroTenteMaisTardeComponent } from './erro-tente-mais-tarde.component';

describe('ErroTenteMaisTardeComponent', () => {
  let component: ErroTenteMaisTardeComponent;
  let fixture: ComponentFixture<ErroTenteMaisTardeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ErroTenteMaisTardeComponent]
    });
    fixture = TestBed.createComponent(ErroTenteMaisTardeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
