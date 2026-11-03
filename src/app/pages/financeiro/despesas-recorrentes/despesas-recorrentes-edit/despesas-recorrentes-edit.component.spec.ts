import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DespesasRecorrentesEditComponent } from './despesas-recorrentes-edit.component';

describe('DespesasRecorrentesEditComponent', () => {
  let component: DespesasRecorrentesEditComponent;
  let fixture: ComponentFixture<DespesasRecorrentesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DespesasRecorrentesEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DespesasRecorrentesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
