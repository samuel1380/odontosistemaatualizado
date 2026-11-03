import { Component, OnInit } from '@angular/core';
import { CustomizerSettingsService } from '../externalComponents/customizer-settings/customizer-settings.service';
import { FormControl, Validators } from '@angular/forms';
import { realizaLogin } from 'src/services/login.service';
import { ErroTenteMaisTardeComponent } from 'src/app/components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    emailFormControl = new FormControl('', [Validators.required, Validators.email]);
    senhaFormControl = new FormControl('', [Validators.required]);

    hide = true;

    constructor(
        public themeService: CustomizerSettingsService,
        private router: Router,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        if (this.route.snapshot.queryParamMap.get('sessionExpired') === '1') {
            this.snackBar.open(
                'Sua sessão expirou ou está quase a expirar. Faça login novamente.',
                'Fechar',
                { duration: 8000, horizontalPosition: 'center', verticalPosition: 'top' }
            );
        }
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    toggleCardBorderTheme() {
        this.themeService.toggleCardBorderTheme();
    }

    toggleCardBorderRadiusTheme() {
        this.themeService.toggleCardBorderRadiusTheme();
    }

    toggleRTLEnabledTheme() {
        this.themeService.toggleRTLEnabledTheme();
    }

    async onSubmitButton() {
      const username = this.emailFormControl.value;
      const password = this.senhaFormControl.value;

      if (!username || !password) return;

      try {
        const result = await realizaLogin(username, password);

        if (result.status != 201) {
          this.dialog.open(ErroTenteMaisTardeComponent, {
            width: '50%',
            enterAnimationDuration: `100ms`,
            exitAnimationDuration: `100ms`,
          });

          return;
        }

        localStorage.setItem('currentUser', JSON.stringify(result.data));
        this.router.navigate(['/l/home']);
      } catch (e) {
        this.dialog.open(ErroTenteMaisTardeComponent, {
          width: '50%',
          enterAnimationDuration: `100ms`,
          exitAnimationDuration: `100ms`,
        });
      }
    }

}
