import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoresCadastroComponent } from './cores-cadastro.component';

describe('CoresCadastroComponent', () => {
  let component: CoresCadastroComponent;
  let fixture: ComponentFixture<CoresCadastroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoresCadastroComponent]
    });
    fixture = TestBed.createComponent(CoresCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
