import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-odontogram',
  templateUrl: './odontogram.component.html',
  styleUrls: ['./odontogram.component.sass']
})
export class OdontogramComponent implements OnInit {

  @Output() onChangeTeeth = new EventEmitter<{ number: number; condition: boolean }[]>();
  @Input() value: { number: number; condition: boolean }[] = [];
  @Input() disable: boolean = false;

  teeth: { number: number; condition: boolean }[] = [
     { number: 11, condition: false },
     { number: 12, condition: false },
     { number: 13, condition: false },
     { number: 14, condition: false },
     { number: 15, condition: false },
     { number: 16, condition: false },
     { number: 17, condition: false },
     { number: 18, condition: false },

     { number: 21, condition: false },
     { number: 22, condition: false },
     { number: 23, condition: false },
     { number: 24, condition: false },
     { number: 25, condition: false },
     { number: 26, condition: false },
     { number: 27, condition: false },
     { number: 28, condition: false },

     { number: 31, condition: false },
     { number: 32, condition: false },
     { number: 33, condition: false },
     { number: 34, condition: false },
     { number: 35, condition: false },
     { number: 36, condition: false },
     { number: 37, condition: false },
     { number: 38, condition: false },

     { number: 48, condition: false },
     { number: 47, condition: false },
     { number: 46, condition: false },
     { number: 45, condition: false },
     { number: 44, condition: false },
     { number: 43, condition: false },
     { number: 42, condition: false },
     { number: 41, condition: false },
  ];

  ngOnInit(): void {
    this.value.forEach((dente: any) => {
      this.teeth.forEach((d) => {
        if(d.number === dente.number) {
          d.condition = true;
        }
      })
    })
  }

  getURL(numberTooth: number, condition: boolean) {
    if (condition)
      return `/assets/img/odontograma/dentes/${numberTooth}_blue.svg`;
    return `/assets/img/odontograma/dentes/${numberTooth}.svg`;
  }

  getClass(numberTooth: number) {
    const disableClass = "disable_tooth"
    let classToth = `tooth tooth_${numberTooth}`;

    if (this.disable) {
      classToth = `${classToth} ${disableClass}`
    }

    return classToth
  }

  toggleTooth(toothNumber: number): void {
    if (this.disable) {
      return;
    }

    const retorno = this.teeth.some(tooth => {
      if (tooth.number === toothNumber) {
        tooth.condition = !tooth.condition;
        return true;
      }

      return false;
    });

    this.onChangeTeeth.emit(this.teeth);
  }
}
