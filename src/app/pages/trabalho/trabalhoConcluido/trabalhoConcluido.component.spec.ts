import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrabalhoConcluidoComponent } from './trabalhoConcluido.component';

describe('TrabalhoComponent', () => {
  let component: TrabalhoConcluidoComponent;
  let fixture: ComponentFixture<TrabalhoConcluidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrabalhoConcluidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrabalhoConcluidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
