import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DespesasRecorrentesComponent } from './despesas-recorrentes.component';

describe('DespesasRecorrentesComponent', () => {
  let component: DespesasRecorrentesComponent;
  let fixture: ComponentFixture<DespesasRecorrentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DespesasRecorrentesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DespesasRecorrentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
