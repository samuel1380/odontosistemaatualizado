import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSalvoComponent } from './dialog-salvo.component';

describe('DialogSalvoComponent', () => {
  let component: DialogSalvoComponent;
  let fixture: ComponentFixture<DialogSalvoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogSalvoComponent]
    });
    fixture = TestBed.createComponent(DialogSalvoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
