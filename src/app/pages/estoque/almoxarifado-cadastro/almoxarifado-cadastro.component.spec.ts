import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlmoxarifadoCadastroComponent } from './almoxarifado-cadastro.component';

describe('AlmoxarifadoCadastroComponent', () => {
  let component: AlmoxarifadoCadastroComponent;
  let fixture: ComponentFixture<AlmoxarifadoCadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlmoxarifadoCadastroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlmoxarifadoCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
