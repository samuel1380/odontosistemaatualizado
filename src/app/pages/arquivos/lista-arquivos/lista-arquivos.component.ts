import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomizerSettingsService } from 'src/app/pages/externalComponents/customizer-settings/customizer-settings.service';

@Component({
  selector: 'app-lista-arquivos',
  templateUrl: './lista-arquivos.component.html',
  styleUrls: ['./lista-arquivos.component.sass']
})
export class ListaArquivosComponent {

  @Input() arquivos: any[] = [];
  @Output() onclickDownload = new EventEmitter<any>();
  @Output() onclickRemover = new EventEmitter<any>();

  constructor(
    public themeService: CustomizerSettingsService
  ) {}

  onclickDownloadInterno(arquivo: any) {
    if (this.onclickDownload) {
      this.onclickDownload.emit(arquivo);
    }
  }

  onclickRemoverInterno(arquivo: any) {
    if (this.onclickRemover) {
      this.onclickRemover.emit(arquivo);
    }
  }

  toggleTheme() {
      this.themeService.toggleTheme();
  }

  toggleRTLEnabledTheme() {
      this.themeService.toggleRTLEnabledTheme();
  }
}
