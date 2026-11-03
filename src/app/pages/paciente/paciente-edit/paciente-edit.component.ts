import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { PacienteCadastroComponent } from '../paciente-cadastro/paciente-cadastro.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PacienteService } from 'src/services/paciente.service';
import { PacienteElement } from '../paciente.component';

@Component({
  selector: 'app-paciente-edit',
  templateUrl: './paciente-edit.component.html',
  styleUrl: './paciente-edit.component.sass'
})
export class PacienteEditComponent implements OnInit, OnDestroy {
  @ViewChild('cadastroPaciente') cadastroPaciente?: PacienteCadastroComponent;

  paciente: PacienteElement | null = null;
  pacienteId: string | null = null;
  private destroy$ = new Subject<void>();
  private carregando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacienteService: PacienteService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Detecta mudanças nos parâmetros da rota
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const newPacienteId = params.get('id');
        // Recarrega apenas se o ID mudou (evita chamadas duplicadas)
        if (newPacienteId && newPacienteId !== this.pacienteId) {
          this.pacienteId = newPacienteId;
          this.loadPaciente(this.pacienteId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPaciente(id: string): Promise<void> {
    // Evita chamadas duplicadas simultâneas
    if (this.carregando) {
      return;
    }

    try {
      this.carregando = true;

      const response = await lastValueFrom(this.pacienteService.buscarPacientePorId(id));
      // Cria uma nova referência do objeto para garantir detecção de mudança
      // Não seta como null antes para evitar disparar ngOnChanges desnecessariamente
      this.paciente = { ...response };
    } catch (error) {
      console.error('Erro ao carregar paciente', error);
      this.snackBar.open('Erro ao carregar paciente. Tente novamente.', 'Fechar', { duration: 3000 });
      this.paciente = null;
    } finally {
      this.carregando = false;
    }
  }

  async handleSave(pacientePayload: PacienteElement): Promise<void> {
    if (!this.pacienteId) return;

    try {
      await lastValueFrom(this.pacienteService.atualizarPaciente(this.pacienteId, pacientePayload));
      this.snackBar.open('Paciente atualizado com sucesso!', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      this.cadastroPaciente?.encerrarModoEdicaoTrabalhosAposSalvarComSucesso();
    } catch (error: any) {
      const errorMessage = error?.error?.resposta || 'Erro ao salvar paciente. Tente novamente.';
      this.snackBar.open(errorMessage, 'Fechar', { duration: 3000 });
    }
  }
}
