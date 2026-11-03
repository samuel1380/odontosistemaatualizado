import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-listagem',
  templateUrl: './listagem.component.html',
  styleUrls: ['./listagem.component.sass']
})
export class ListagemComponent implements OnInit {

  @ViewChild('conteudoLinha', {static: true})
  conteudoLinha: TemplateRef<any> | undefined;

  @Input() lista: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @Output() onclick = new EventEmitter<any>();
  @Output() onclickCriar = new EventEmitter<any>();
  @Input() habilitarbotaoCriar: boolean | null = null;
  @Input() tituloLista: string | null = null;
  @Input() columns: ColumnsInterface[] = [];
  @Input() rowClassFunction?: (row: any) => object;
  displayedColumns: string[] = [];

  constructor(private viewContainerRef: ViewContainerRef) {
  }

  ngOnInit(): void {
    this.displayedColumns = this.columns.map((column) => column.coluna);
  }

  onclickListagem(row: any) {
    if (this.onclick) {
      this.onclick.emit(row);
    }
  }

  onclickCriarInterno() {
    if (this.onclickCriar) {
      this.onclickCriar.emit();
    }
  }

  /** Abre o link do WhatsApp sem disparar o click da linha da tabela. */
  abrirWhatsApp(element: any, coluna: ColumnsInterface) {
    const linkField = coluna.whatsappLinkField || 'linkWhatsApp';
    const link = element[linkField];
    if (link) {
      window.open(link, '_blank');
    }
  }
}

export interface ColumnsInterface {
  coluna: string;
  titulo: string;
  price?: string;
  date?: boolean;
  datetime?: boolean;
  /** Quando true, renderiza o ícone do WhatsApp ao lado do valor da célula. */
  whatsapp?: boolean;
  /** Nome do campo no objeto que contém o número de telefone para WhatsApp. Padrão: 'telefoneFinanceiro' */
  whatsappTelefoneField?: string;
  /** Nome do campo no objeto que contém o link WhatsApp pronto. Padrão: 'linkWhatsApp' */
  whatsappLinkField?: string;
}
