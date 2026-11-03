import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContasEditComponent } from './contas-edit.component';

describe('ContasEditComponent', () => {
  let component: ContasEditComponent;
  let fixture: ComponentFixture<ContasEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContasEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContasEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
