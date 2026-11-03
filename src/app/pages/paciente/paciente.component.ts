import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, lastValueFrom, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { buscarEmpresas } from '../../../services/empresa.service';
import { buscaDentistaPorEmpresaId } from 'src/services/dentista.service';
import { PacienteService } from 'src/services/paciente.service';
import { PacienteCadastroComponent } from './paciente-cadastro/paciente-cadastro.component';


interface Empresa {
  id: string;
  nome: string;
}

interface Dentista {
  idDentista: string;
  nome: string;
}

export interface PacienteElement {
  id: string;
  nome: string;
}

@Component({
  selector: 'app-paciente',
  templateUrl: './paciente.component.html',
  styleUrls: ['./paciente.component.sass'],
})
export class PacienteComponent implements OnInit, OnDestroy {
  empresaFilter: FormControl = new FormControl();
  dentistaFilter: FormControl = new FormControl();
  pacienteFilter: FormControl = new FormControl();

  empresas$ = new BehaviorSubject<Empresa[]>([]);
  dentistas$ = new BehaviorSubject<Dentista[]>([]);
  pacientes$ = new BehaviorSubject<PacienteElement[]>([]);

  showNotFound = false;
  pacienteNaoEncontrado = false;
  searchTerm: string | null = null;

  listaPacientes = new MatTableDataSource<PacienteElement>([]);
  displayedColumns = [{coluna: 'nome', titulo: 'Nome'}];

  private _onDestroy = new Subject<void>();

  constructor(
    private pacienteService: PacienteService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadEmpresas();

    this.empresaFilter.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(empresaId => {
      // Limpa os filtros e listas dependentes
      this.dentistaFilter.setValue(null, { emitEvent: false });
      this.pacienteFilter.setValue(null);
      this.dentistas$.next([]);
      this.pacientes$.next([]);
      this.listaPacientes.data = [];

      if (empresaId) {
        this.loadDentistas(empresaId);
      }
    });

    this.pacienteFilter.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(idPaciente => {
        // Se o valor for uma string, significa que o usuário está digitando.
        if (typeof idPaciente === 'string') {
            this.searchTerm = idPaciente;
            const lowerCaseSearchTerm = idPaciente.toLowerCase();
            const pacientes = this.pacientes$.getValue();
            const match = pacientes.some(p => p.nome.toLowerCase().includes(lowerCaseSearchTerm));
            this.pacienteNaoEncontrado = lowerCaseSearchTerm.length > 0 && !match;
        } else if (idPaciente) { // Se for um objeto (selecionado), mostre na lista.
            this.searchTerm = null;
            this.pacienteNaoEncontrado = false;
            this.abrirDetalhesCadastro({ idPaciente });
        } else { // Se for nulo ou vazio, limpe tudo.
            this.listaPacientes.data = [];
            this.searchTerm = null;
            this.pacienteNaoEncontrado = false;
        }
    });

    this.dentistaFilter.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(idProfissional => {
      const idEmpresa = this.empresaFilter.value;
      this.onPacienteSearch(idEmpresa, idProfissional);
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  async loadEmpresas() {
    try {
      const response = await buscarEmpresas();
      this.empresas$.next(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas', error);
    }
  }

  async loadDentistas(idEmpresa: number) {
    if (!idEmpresa) return;
    try {
      const response = await buscaDentistaPorEmpresaId(idEmpresa);
      if (response) {
        this.dentistas$.next(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dentistas', error);
    }
  }

  async onPacienteSearch(idEmpresa: number, idProfissional: number) {
    if (idEmpresa) {
      try {
        const response = await lastValueFrom(this.pacienteService.buscarPacientesPorEmpresaId(idEmpresa, idProfissional));
        this.pacientes$.next(response);
      } catch (error) {
        console.error('Erro ao carregar pacientes', error);
        this.pacientes$.next([]);
      }
    } else {
      this.pacientes$.next([]);
    }
  }

  cadastrarPaciente() {
    const dialogRef = this.dialog.open(PacienteCadastroComponent, {
      width: '700px',
      data: {
        empresaId: this.empresaFilter.value,
        nome: this.searchTerm
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.idPaciente) {
        this.snackBar.open('Paciente cadastrado com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
        this.abrirDetalhesCadastro(result);
      }
    });
  }

  abrirDetalhesCadastro(event: any) {
    this.router.navigate([`/l/paciente/edit/${event.idPaciente}`]);
  }
}
