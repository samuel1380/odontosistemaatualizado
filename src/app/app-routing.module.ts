import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './AuthGuard';
import { GuardRoutePermission } from './GuardRoutePermission';
import { AprovacaoCadastroComponent } from './pages/aprovacao-cadastro/aprovacao-cadastro.component';
import { CadastroComplementarEmpresaComponent } from './pages/cadastro-complementar-empresa/cadastro-complementar-empresa.component';
import { DetalheCadastroComponent } from './pages/detalhe-cadastro/detalhe-cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { ProdutoCadastroComponent } from './pages/produto-cadastro/produto-cadastro.component';
import { ProdutoEditComponent } from './pages/produto-edit/produto-edit.component';
import { ProdutoComponent } from './pages/produto/produto.component';
import { TrabalhoComponent } from './pages/trabalho/trabalho/trabalho.component';
import { RegisterComponent } from './pages/register/register.component';
import { ComponentesComponent } from './pages/componentes/componentes.component';
import { ComponentesCadastroComponent } from './pages/componentes/componentes-cadastro/componentes-cadastro.component';
import { ComponentesEditComponent } from './pages/componentes/componentes-edit/componentes-edit.component';
import { MarcasComponent } from './pages/marcas/marcas.component';
import { MarcasCadastroComponent } from './pages/marcas/marcas-cadastro/marcas-cadastro.component';
import { MarcasEditComponent } from './pages/marcas/marcas-edit/marcas-edit.component';
import { CoresComponent } from './pages/cores/cores.component';
import { CoresEditComponent } from './pages/cores/cores-edit/cores-edit.component';
import { CoresCadastroComponent } from './pages/cores/cores-cadastro/cores-cadastro.component';
import { NoUserComponent } from './components/no-user/no-user.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
// import { TrabalhoEditComponent } from './pages/trabalho/trabalho-edit/trabalho-edit.component';
import { TrabalhoCadastroComponent } from './pages/trabalho/trabalho-cadastro/trabalho-cadastro.component';
import { TabelaPrecoProdutoComponent } from './pages/tabela-preco-produto/tabela-preco-produto.component';
import { TabelaPrecoProdutoCadastroComponent } from './pages/tabela-preco-produto/tabela-preco-produto-cadastro/tabela-preco-produto-cadastro.component';
import { TabelaPrecoProdutoEditComponent } from './pages/tabela-preco-produto/tabela-preco-produto-edit/tabela-preco-produto-edit.component';
import { RelatorioComponent } from './pages/relatorio/relatorio/relatorio.component';
import { CadastrarComponent } from './pages/cadastrar/cadastrar.component';
import { TrabalhoConcluidoComponent } from './pages/trabalho/trabalhoConcluido/trabalhoConcluido.component';
import { TrabalhoStatusComponent } from './pages/trabalho/trabalho-status/trabalho-status.component';
import { EstoqueComponent } from './pages/estoque/estoque/estoque.component';
import { AlmoxarifadoCadastroComponent } from './pages/estoque/almoxarifado-cadastro/almoxarifado-cadastro.component';
import { EstoqueCadastroComponent } from './pages/estoque/estoque-cadastro/estoque-cadastro.component';
import { ContasComponent } from './pages/financeiro/contas/contas.component';
import { ContasCadastroComponent } from './pages/financeiro/contas/contas-cadastro/contas-cadastro.component';
import { ContasEditComponent } from './pages/financeiro/contas/contas-edit/contas-edit.component';
import { ContasPagarReceberComponent } from './pages/financeiro/contas-pagar-receber/contas-pagar-receber.component';
import { ContasAPagarComponent } from './pages/financeiro/contas-a-pagar/contas-a-pagar.component';
import { ContasAReceberComponent } from './pages/financeiro/contas-a-receber/contas-a-receber.component';
import { FornecedoresComponent } from './pages/financeiro/fornecedores/fornecedores.component';
import { CategoriaEditComponent } from './pages/financeiro/categoria/categoria-edit/categoria-edit.component';
import { CategoriaCadastroComponent } from './pages/financeiro/categoria/categoria-cadastro/categoria-cadastro.component';
import { CategoriaComponent } from './pages/financeiro/categoria/categoria.component';
import { PacienteComponent } from './pages/paciente/paciente.component';
import { PacienteCadastroComponent } from './pages/paciente/paciente-cadastro/paciente-cadastro.component';
import { PacienteEditComponent } from './pages/paciente/paciente-edit/paciente-edit.component';
import { FaturaComponent } from './pages/financeiro/fatura/fatura.component';
import { FaturasPendentesComponent } from './pages/financeiro/faturas-pendentes/faturas-pendentes.component';
import { ComponentesPendentesComponent } from './pages/financeiro/componentes-pendentes/componentes-pendentes.component';
import { DashboardComponent } from './pages/financeiro/dashboard/dashboard.component';
import { BoletosAtrasadosComponent } from './pages/financeiro/boletos-atrasados/boletos-atrasados.component';
import { CombustivelComponent } from './pages/financeiro/combustivel/combustivel.component';
import { LogisticaComponent } from './pages/financeiro/logistica/logistica.component';
import { CapitalComponent } from './pages/financeiro/capital/capital.component';
import { ConciliacaoBancariaComponent } from './pages/financeiro/conciliacao/conciliacao-bancaria.component';
import { DreComponent } from './pages/financeiro/dre/dre.component';
import { PontoEquilibrioComponent } from './pages/financeiro/ponto-equilibrio/ponto-equilibrio.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { EmpresaTabelaPrecoComponent } from './pages/empresa-tabela-preco/empresa-tabela-preco.component';
import { EmpresaTabelaPrecoCadastroComponent } from './pages/empresa-tabela-preco/empresa-tabela-preco-cadastro/empresa-tabela-preco-cadastro.component';
import { MotivosComponent } from './pages/motivos/motivos.component';
import { MotivosCadastroComponent } from './pages/motivos/motivos-cadastro/motivos-cadastro.component';
import { MotivosEditComponent } from './pages/motivos/motivos-edit/motivos-edit.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'cadastrar', component: RegisterComponent },
  {
    path: 'l', component: LayoutComponent, canActivate: [AuthGuard], children: [
      { path: 'app-no-user', component: NoUserComponent },
      { path: 'app-unauthorized', component: UnauthorizedComponent },

      { path: 'home', component: HomeComponent, data: { permission: ["admin", "financeiro", "vendas", "producao"] } },

      { path: 'empresa', component: AprovacaoCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'empresa/cadastro', component: CadastrarComponent,  canActivate: [ AuthGuard, GuardRoutePermission ],data: { permission: ["admin"] } },
      { path: 'empresa/edit/:id', component: CadastrarComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'empresa/cadastrocomplementar/:id', component: CadastroComplementarEmpresaComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      { path: 'produto', component: ProdutoComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'produto/cadastro', component: ProdutoCadastroComponent,  canActivate: [ AuthGuard, GuardRoutePermission ],data: { permission: ["admin"] } },
      { path: 'produto/edit/:id', component: ProdutoEditComponent,  canActivate: [ AuthGuard, GuardRoutePermission ],data: { permission: ["admin"] } },

      { path: 'trabalho', component: TrabalhoComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas", "financeiro"] } },
      { path: 'trabalho/cadastro', component: TrabalhoCadastroComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas", "financeiro"] } },
      // { path: 'trabalho/edit/:id', component: TrabalhoEditComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas"] } },
      { path: 'trabalho/concluido', component: TrabalhoConcluidoComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas", "financeiro"] } },
      { path: 'trabalho/status', component: TrabalhoStatusComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      // { path: 'trabalho/lista', component: TrabalhoListStatusComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      { path: 'marca', component: MarcasComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'marca/cadastro', component: MarcasCadastroComponent,  canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'marca/edit/:id', component: MarcasEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      { path: 'componente', component: ComponentesComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'componente/cadastro', component: ComponentesCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'componente/edit/:id', component: ComponentesEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      { path: 'cor', component: CoresComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'cor/cadastro', component: CoresCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'cor/edit/:id', component: CoresEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      { path: 'motivo', component: MotivosComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'motivo/cadastro', component: MotivosCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'motivo/edit/:id', component: MotivosEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },

      { path: 'tabelaprecoproduto', component: TabelaPrecoProdutoComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas", "financeiro"] } },
      { path: 'tabelaprecoproduto/cadastro', component: TabelaPrecoProdutoCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas"] } },
      { path: 'tabelaprecoproduto/edit/:id', component: TabelaPrecoProdutoEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas", "financeiro"] } },

      { path: 'empresa-tabela-preco', component: EmpresaTabelaPrecoComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas"] } },
      { path: 'empresa-tabela-preco/cadastro', component: EmpresaTabelaPrecoCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas"] } },
      { path: 'empresa-tabela-preco/edit/:id', component: EmpresaTabelaPrecoCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas"] } },

      { path: 'almoxarifado', component: EstoqueComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas", "financeiro"] } },
      { path: 'almoxarifado/edit/:id', component: AlmoxarifadoCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas", "financeiro"] } },
      { path: 'estoque/cadastro/:id', component: EstoqueCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas", "financeiro"] } },

      { path: 'report/trabalho', component: RelatorioComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },


      { path: 'contas', component: ContasComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'contas/cadastro', component: ContasCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'contas/edit/:id', component: ContasEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },

      { path: 'contasPagarReceber', component: ContasPagarReceberComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/contas-a-pagar', component: ContasAPagarComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/contas-a-receber', component: ContasAReceberComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/fluxo-caixa', component: DashboardComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/fornecedores', component: FornecedoresComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },


      { path: 'categorias', component: CategoriaComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'categorias/cadastro', component: CategoriaCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'categorias/edit/:id', component: CategoriaEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },


      { path: 'paciente', component: PacienteComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas", "financeiro"] } },
      { path: 'paciente/cadastro', component: PacienteCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas", "financeiro"] } },
      { path: 'paciente/edit/:id', component: PacienteEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "producao", "vendas", "financeiro"] } },

      { path: 'faturas', component: FaturaComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/faturas-pendentes', component: FaturasPendentesComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },

      { path: 'componentes-pendentes', component: ComponentesPendentesComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas", "financeiro"] } },

      { path: 'financeiro/dashboard', component: DashboardComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'financeiro/boletos-atrasados', component: BoletosAtrasadosComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'financeiro/combustivel', component: CombustivelComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas"] } },
      { path: 'financeiro/logistica', component: LogisticaComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "vendas"] } },
      { path: 'financeiro/capital', component: CapitalComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      { path: 'financeiro/conciliacao', component: ConciliacaoBancariaComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/dre', component: DreComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'financeiro/ponto-equilibrio', component: PontoEquilibrioComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "financeiro"] } },
      { path: 'usuario', component: UsuarioComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin"] } },
      // { path: 'paciente/cadastro', component: PacienteCadastroComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "comum"] } },
      // { path: 'paciente/edit/:id', component: PacienteEditComponent, canActivate: [ AuthGuard, GuardRoutePermission ], data: { permission: ["admin", "comum"] } },

    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
