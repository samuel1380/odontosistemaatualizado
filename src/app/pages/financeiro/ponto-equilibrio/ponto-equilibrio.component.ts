import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ponto-equilibrio',
  templateUrl: './ponto-equilibrio.component.html',
  styleUrls: ['./ponto-equilibrio.component.sass']
})
export class PontoEquilibrioComponent implements OnInit {
  form: FormGroup;
  
  margemContribuicao: number = 0;
  pontoEquilibrioQtd: number = 0;
  pontoEquilibrioRs: number = 0;
  margemInvalida: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      custoFixo: [5000, [Validators.required, Validators.min(0)]],
      precoVenda: [100, [Validators.required, Validators.min(0)]],
      custoVariavel: [50, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.calcular();
    this.form.valueChanges.subscribe(() => {
      this.calcular();
    });
  }

  calcular() {
    const custoFixo = this.form.get('custoFixo')?.value || 0;
    const precoVenda = this.form.get('precoVenda')?.value || 0;
    const custoVariavel = this.form.get('custoVariavel')?.value || 0;

    this.margemContribuicao = precoVenda - custoVariavel;

    if (this.margemContribuicao <= 0) {
      this.margemInvalida = true;
      this.pontoEquilibrioQtd = 0;
      this.pontoEquilibrioRs = 0;
    } else {
      this.margemInvalida = false;
      this.pontoEquilibrioQtd = Math.ceil(custoFixo / this.margemContribuicao);
      this.pontoEquilibrioRs = this.pontoEquilibrioQtd * precoVenda;
    }
  }
}
