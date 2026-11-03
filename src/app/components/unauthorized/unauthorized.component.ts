import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.sass']
})
export class UnauthorizedComponent {

  constructor(private router: Router) { }

  voltarHome() {
    this.router.navigate(['/l/home']);
  }

}
