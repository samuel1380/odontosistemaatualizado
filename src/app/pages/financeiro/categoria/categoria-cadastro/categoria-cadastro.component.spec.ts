import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaCadastroComponent } from './categoria-cadastro.component';

describe('CategoriaCadastroComponent', () => {
  let component: CategoriaCadastroComponent;
  let fixture: ComponentFixture<CategoriaCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaCadastroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CategoriaCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
