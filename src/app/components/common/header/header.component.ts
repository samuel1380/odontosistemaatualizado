import { Component, HostListener } from '@angular/core';
import { ToggleService } from './toggle.service';
import { DatePipe } from '@angular/common';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';
import { AuthUserService } from 'src/app/serviceStorage/authUser.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { buscarTrabalho } from 'src/services/trabalho.service';
import { ChangePasswordDialogComponent } from '../../change-password-dialog/change-password-dialog.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

    isSticky: boolean = false;
    @HostListener('window:scroll', ['$event'])
    checkScroll() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 350) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }

    isToggled = false;
    currentUser: any = {};
    pesquisaTrabalhoId: string = '';
    buscando: boolean = false;

    constructor(
        private toggleService: ToggleService,
        private authService: AuthUserService,
        private datePipe: DatePipe,
        public themeService: CustomizerSettingsService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.toggleService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });

        this.authService.isLogged$.subscribe(currentUser => {
          this.currentUser = currentUser;
        });
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    toggle() {
        this.toggleService.toggle();
    }

    toggleSidebarTheme() {
        this.themeService.toggleSidebarTheme();
    }

    toggleHideSidebarTheme() {
        this.themeService.toggleHideSidebarTheme();
    }

    toggleCardBorderTheme() {
        this.themeService.toggleCardBorderTheme();
    }

    toggleHeaderTheme() {
        this.themeService.toggleHeaderTheme();
    }

    toggleCardBorderRadiusTheme() {
        this.themeService.toggleCardBorderRadiusTheme();
    }

    toggleRTLEnabledTheme() {
        this.themeService.toggleRTLEnabledTheme();
    }

    logout() {
      this.authService.logout();
    }

    trocarSenha() {
        this.dialog.open(ChangePasswordDialogComponent, {
            width: '450px',
            disableClose: true
        });
    }

    currentDate: Date = new Date();
    formattedDate: any = this.datePipe.transform(this.currentDate, 'dd MMMM yyyy');

    apenasNumeros(event: KeyboardEvent): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        // Permite apenas números (0-9) e teclas de controle (backspace, delete, tab, etc)
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
            return false;
        }
        return true;
    }

    async buscarTrabalhoPorId(): Promise<void> {
        const idTrabalhoStr = this.pesquisaTrabalhoId?.trim();

        if (!idTrabalhoStr) {
            return;
        }

        // Valida que é um número válido
        const idTrabalho = parseInt(idTrabalhoStr, 10);
        if (isNaN(idTrabalho) || idTrabalho <= 0) {
            this.snackBar.open('Por favor, informe um ID de trabalho válido.', 'Fechar', {
                duration: 3000,
                horizontalPosition: 'right',
                verticalPosition: 'top'
            });
            return;
        }

        if (this.buscando) {
            return;
        }

        this.buscando = true;

        try {
            const response = await buscarTrabalho(idTrabalho);

            if (response.data) {
                // Tenta obter idPaciente diretamente ou através da relação paciente
                const idPaciente = response.data.idPaciente || response.data.paciente?.idPaciente;

                if (idPaciente) {
                    const targetUrl = `/l/paciente/edit/${idPaciente}`;
                    const currentUrl = this.router.url;

                    // Se já está na mesma rota, força recarga usando navigateByUrl com replaceUrl
                    if (currentUrl === targetUrl) {
                        // Força recarga navegando para a mesma URL novamente
                        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                            this.router.navigate([targetUrl]);
                        });
                    } else {
                        // Navega normalmente se for uma rota diferente
                        this.router.navigate([targetUrl]);
                    }
                    this.pesquisaTrabalhoId = ''; // Limpa o campo
                } else {
                    this.snackBar.open('Trabalho encontrado, mas sem paciente associado.', 'Fechar', {
                        duration: 3000,
                        horizontalPosition: 'right',
                        verticalPosition: 'top'
                    });
                }
            } else {
                this.snackBar.open('Trabalho não encontrado.', 'Fechar', {
                    duration: 3000,
                    horizontalPosition: 'right',
                    verticalPosition: 'top'
                });
            }
        } catch (error: any) {
            console.error('Erro ao buscar trabalho:', error);
            if (error.response?.status === 404) {
                this.snackBar.open('Trabalho não encontrado.', 'Fechar', {
                    duration: 3000,
                    horizontalPosition: 'right',
                    verticalPosition: 'top'
                });
            } else {
                this.snackBar.open('Erro ao buscar trabalho. Tente novamente.', 'Fechar', {
                    duration: 3000,
                    horizontalPosition: 'right',
                    verticalPosition: 'top'
                });
            }
        } finally {
            this.buscando = false;
        }
    }

}
