import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './AuthGuard';
import { GuardRoutePermission } from './GuardRoutePermission';
import { LoginGuard } from './LoginGuard';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe, DatePipe, NgIf, registerLocaleData } from '@angular/common';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ReauthDialogComponent } from './auth/reauth-dialog/reauth-dialog.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { CadastrarComponent } from './pages/cadastrar/cadastrar.component';
import { DialogCadastroComponent } from './components/dialog-cadastro/dialog-cadastro.component';
import { ErroTenteMaisTardeComponent } from './components/erro-tente-mais-tarde/erro-tente-mais-tarde.component';
import { AprovacaoCadastroComponent } from './pages/aprovacao-cadastro/aprovacao-cadastro.component';
import { DetalheCadastroComponent } from './pages/detalhe-cadastro/detalhe-cadastro.component';
import { CarregamentoComponent } from './pages/carregamento/carregamento.component';
import { DialogEmpresaAprovadaComponent } from './components/dialog-empresa-aprovada/dialog-empresa-aprovada.component';
import { ProdutoCadastroComponent } from './pages/produto-cadastro/produto-cadastro.component';
import { ProdutoComponent } from './pages/produto/produto.component';
import { DialogEnvioFotoComponent } from './components/dialog-envio-foto/dialog-envio-foto.component';
import { AuthInterceptor } from './AuthAuthorization';
import { SecurePipe } from './SecurePipe';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DialogArquivoApagadoComponent } from './components/dialog-arquivo-apagado/dialog-arquivo-apagado.component';
import { DialogConfirmacaoExclusaoArquivoComponent } from './components/dialog-confirmacao-exclusao-arquivo/dialog-confirmacao-exclusao-arquivo.component';
import { DialogSalvoComponent } from './components/dialog-salvo/dialog-salvo.component';
import { DialogDesativarEmpresaComponent } from './components/dialog-desativar-empresa/dialog-desativar-empresa.component';
import { CadastroComplementarEmpresaComponent } from './pages/cadastro-complementar-empresa/cadastro-complementar-empresa.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DialogCadastroSucessoComponent } from './components/dialog-cadastro-sucesso/dialog-cadastro-sucesso.component';
import { DialogCadastroErroComponent } from './components/dialog-cadastro-erro/dialog-cadastro-erro.component';
import { ProdutoEditComponent } from './pages/produto-edit/produto-edit.component';
import { CustomizerSettingsComponent } from './pages/externalComponents/customizer-settings/customizer-settings.component';
import { OdontogramComponent } from './odontogram/odontogram.component';
import { SidebarComponent } from './components/common/sidebar/sidebar.component';
import { HeaderComponent } from './components/common/header/header.component';
import { FooterComponent } from './components/common/footer/footer.component';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ListagemComponent } from './components/common/listagem/listagem.component';
import { ComponentesComponent } from './pages/componentes/componentes.component';
import { ComponentesCadastroComponent } from './pages/componentes/componentes-cadastro/componentes-cadastro.component';
import { ComponentesEditComponent } from './pages/componentes/componentes-edit/componentes-edit.component';
import { MarcasComponent } from './pages/marcas/marcas.component';
import { MarcasCadastroComponent } from './pages/marcas/marcas-cadastro/marcas-cadastro.component';
import { MarcasEditComponent } from './pages/marcas/marcas-edit/marcas-edit.component';
import { CoresComponent } from './pages/cores/cores.component';
import { CoresCadastroComponent } from './pages/cores/cores-cadastro/cores-cadastro.component';
import { CoresEditComponent } from './pages/cores/cores-edit/cores-edit.component';
import { NoUserComponent } from './components/no-user/no-user.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { ListaArquivosComponent } from './pages/arquivos/lista-arquivos/lista-arquivos.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
// import { TrabalhoEditComponent } from './pages/trabalho/trabalho-edit/trabalho-edit.component';
import { TrabalhoCadastroComponent } from './pages/trabalho/trabalho-cadastro/trabalho-cadastro.component';
import { TrabalhoComponent } from './pages/trabalho/trabalho/trabalho.component';
import { TrabalhoConcluidoComponent } from './pages/trabalho/trabalhoConcluido/trabalhoConcluido.component';
import { MultipleSelectionModule } from './components/common/multiple-selection/multiple-selection.module';
import ptBr from '@angular/common/locales/pt';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TabelaPrecoProdutoComponent } from './pages/tabela-preco-produto/tabela-preco-produto.component';
import { TabelaPrecoProdutoCadastroComponent } from './pages/tabela-preco-produto/tabela-preco-produto-cadastro/tabela-preco-produto-cadastro.component';
import { TabelaPrecoProdutoEditComponent } from './pages/tabela-preco-produto/tabela-preco-produto-edit/tabela-preco-produto-edit.component';
import { EmpresaTabelaPrecoComponent } from './pages/empresa-tabela-preco/empresa-tabela-preco.component';
import { EmpresaTabelaPrecoCadastroComponent } from './pages/empresa-tabela-preco/empresa-tabela-preco-cadastro/empresa-tabela-preco-cadastro.component';
import { CriarVersaoDialogComponent } from './pages/tabela-preco-produto/criar-versao-dialog/criar-versao-dialog.component';
import { SelecionarVersaoDialogComponent } from './pages/tabela-preco-produto/selecionar-versao-dialog/selecionar-versao-dialog.component';
import { RelatorioComponent } from './pages/relatorio/relatorio/relatorio.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TrabalhoListaTrabalhosComponent } from './pages/trabalho/trabalhoListaTrabalhos/trabalhoListaTrabalhos.component';
import { EstoqueModule } from './pages/estoque/estoque.module';
import { EstoqueComponent } from './pages/estoque/estoque/estoque.component';
import { AlmoxarifadoCadastroComponent } from './pages/estoque/almoxarifado-cadastro/almoxarifado-cadastro.component';
import { EstoqueCadastroComponent } from './pages/estoque/estoque-cadastro/estoque-cadastro.component';
import { ContasCadastroComponent } from './pages/financeiro/contas/contas-cadastro/contas-cadastro.component';
import { ContasEditComponent } from './pages/financeiro/contas/contas-edit/contas-edit.component';
import { ContasComponent } from './pages/financeiro/contas/contas.component';
import { ContasPagarReceberComponent } from './pages/financeiro/contas-pagar-receber/contas-pagar-receber.component';
import { ImportarCsvHistoricoDialogComponent } from './pages/financeiro/contas-pagar-receber/importar-csv-historico-dialog/importar-csv-historico-dialog.component';
import { ContasPagarReceberCadastroComponent } from './pages/financeiro/contas-pagar-receber/contas-pagar-receber-cadastro/contas-pagar-receber-cadastro.component';
import { ContasPagarReceberEditComponent } from './pages/financeiro/contas-pagar-receber/contas-pagar-receber-edit/contas-pagar-receber-edit.component';
import { ContasPagarReceberEditLancamentoComponent } from './pages/financeiro/contas-pagar-receber/contas-pagar-receber-edit-lancamento/contas-pagar-receber-edit-lancamento.component';
import { ContasAPagarComponent } from './pages/financeiro/contas-a-pagar/contas-a-pagar.component';
import { ImportarOfxContasPagarDialogComponent } from './pages/financeiro/contas-a-pagar/importar-ofx-contas-pagar-dialog/importar-ofx-contas-pagar-dialog.component';
import { ContasAReceberComponent } from './pages/financeiro/contas-a-receber/contas-a-receber.component';
import { FornecedoresComponent } from './pages/financeiro/fornecedores/fornecedores.component';
import { FornecedorFinanceiroDialogComponent } from './pages/financeiro/fornecedores/fornecedor-financeiro-dialog/fornecedor-financeiro-dialog.component';
import { DespesasRecorrentesComponent } from './pages/financeiro/despesas-recorrentes/despesas-recorrentes.component';
import { DespesasRecorrentesCadastroComponent } from './pages/financeiro/despesas-recorrentes/despesas-recorrentes-cadastro/despesas-recorrentes-cadastro.component';
import { DespesasRecorrentesEditComponent } from './pages/financeiro/despesas-recorrentes/despesas-recorrentes-edit/despesas-recorrentes-edit.component';
import { FinanceiroComponent } from './pages/financeiro/financeiro/financeiro.component';
import { CategoriaComponent } from './pages/financeiro/categoria/categoria.component';
import { CategoriaEditComponent } from './pages/financeiro/categoria/categoria-edit/categoria-edit.component';
import { CategoriaCadastroComponent } from './pages/financeiro/categoria/categoria-cadastro/categoria-cadastro.component';
import { PacienteComponent } from './pages/paciente/paciente.component'; // This was duplicated, keeping one
import { PacienteCadastroComponent } from './pages/paciente/paciente-cadastro/paciente-cadastro.component'; // This was duplicated, keeping one
import { PacienteEditComponent } from './pages/paciente/paciente-edit/paciente-edit.component'; // This was duplicated, keeping one
import { SingleSelectionComponent } from './components/common/single-selection/single-selection.component';
import { ConfirmacaoDialogComponent } from './components/common/componentsconfirmacao-dialog.component';
import { FaturaComponent } from './pages/financeiro/fatura/fatura.component';
import { FaturasPendentesComponent } from './pages/financeiro/faturas-pendentes/faturas-pendentes.component';
import { FaturaDetalhesComponent } from './pages/financeiro/fatura/fatura-detalhes/fatura-detalhes.component';
import { LancarValorFaturaDialogComponent } from './pages/financeiro/fatura/lancar-valor-fatura-dialog/lancar-valor-fatura-dialog.component';
import { AlterarCompetenciaFaturaDialogComponent } from './pages/financeiro/fatura/alterar-competencia-fatura-dialog/alterar-competencia-fatura-dialog.component';
import { TrocarFaturaDialogComponent } from './pages/financeiro/fatura/fatura-detalhes/trocar-fatura-dialog.component';
import { DividirFaturaDialogComponent } from './pages/financeiro/fatura/fatura-detalhes/dividir-fatura-dialog.component';
import { AplicarDescontoDialogComponent } from './pages/financeiro/fatura/fatura-detalhes/aplicar-desconto-dialog.component';
import { FaturaDetalhamentoImpressaoComponent } from './pages/financeiro/fatura/fatura-detalhes/fatura-detalhamento-impressao.component';
import { DescontoDevolucaoComponentesDialogComponent } from './pages/financeiro/fatura/desconto-devolucao-componentes-dialog/desconto-devolucao-componentes-dialog.component';
import { ReciboPagamentoDialogComponent } from './pages/financeiro/fatura/fatura-detalhes/recibo-pagamento-dialog.component';
import { ComponentesPendentesComponent } from './pages/financeiro/componentes-pendentes/componentes-pendentes.component';
import { DashboardComponent } from './pages/financeiro/dashboard/dashboard.component';
import { BoletosAtrasadosComponent } from './pages/financeiro/boletos-atrasados/boletos-atrasados.component';
import { QuitarBoletoDialogComponent } from './pages/financeiro/boletos-atrasados/quitar-boleto-dialog/quitar-boleto-dialog.component';
import { CombustivelComponent } from './pages/financeiro/combustivel/combustivel.component';
import { VeiculoDialogComponent } from './pages/financeiro/combustivel/veiculo-dialog/veiculo-dialog.component';
import { AbastecimentoDialogComponent } from './pages/financeiro/combustivel/abastecimento-dialog/abastecimento-dialog.component';
import { ConfiguracaoKmDialogComponent } from './pages/financeiro/combustivel/configuracao-km-dialog/configuracao-km-dialog.component';
import { PagamentoKmDialogComponent } from './pages/financeiro/combustivel/pagamento-km-dialog/pagamento-km-dialog.component';
import { LogisticaComponent } from './pages/financeiro/logistica/logistica.component';
import { FornecedorDialogComponent } from './pages/financeiro/logistica/fornecedor-dialog/fornecedor-dialog.component';
import { EntregaDialogComponent } from './pages/financeiro/logistica/entrega-dialog/entrega-dialog.component';
import { CapitalComponent } from './pages/financeiro/capital/capital.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { UsuarioCadastroComponent } from './pages/usuario/usuario-cadastro/usuario-cadastro.component';
import { UsuarioPermissoesComponent } from './pages/usuario/usuario-permissoes/usuario-permissoes.component';
import { AporteDialogComponent } from './pages/financeiro/capital/aporte-dialog/aporte-dialog.component';
import { EmprestimoHistoricoDialogComponent } from './pages/financeiro/capital/emprestimo-historico-dialog/emprestimo-historico-dialog.component';
import { EmprestimoMovimentacaoDialogComponent } from './pages/financeiro/capital/emprestimo-movimentacao-dialog/emprestimo-movimentacao-dialog.component';
import { EmprestimoDialogComponent } from './pages/financeiro/capital/emprestimo-dialog/emprestimo-dialog.component';
import { SocioDialogComponent } from './pages/financeiro/capital/socio-dialog/socio-dialog.component';
import { CredorDialogComponent } from './pages/financeiro/capital/credor-dialog/credor-dialog.component';
import { ConciliacaoBancariaComponent } from './pages/financeiro/conciliacao/conciliacao-bancaria.component';
import { BoletosPendentesDialogComponent } from './components/common/boletos-pendentes-dialog/boletos-pendentes-dialog.component';
import { ImportarOfxDialogComponent } from './pages/financeiro/conciliacao/importar-ofx-dialog/importar-ofx-dialog.component';
import { RetiradaDialogComponent } from './pages/financeiro/capital/retirada-dialog/retirada-dialog.component';
import { DetalhesConciliacaoComponent } from './pages/financeiro/conciliacao/detalhes-conciliacao/detalhes-conciliacao.component';
import { DreComponent } from './pages/financeiro/dre/dre.component';
import { MotivosComponent } from './pages/motivos/motivos.component';
import { MotivosCadastroComponent } from './pages/motivos/motivos-cadastro/motivos-cadastro.component';
import { MotivosEditComponent } from './pages/motivos/motivos-edit/motivos-edit.component';
import { TrabalhoStatusComponent } from './pages/trabalho/trabalho-status/trabalho-status.component';
import { NgChartsModule } from 'ng2-charts';
import { PontoEquilibrioComponent } from './pages/financeiro/ponto-equilibrio/ponto-equilibrio.component';
import { PontoEquilibrioChartDialogComponent } from './pages/financeiro/dre/ponto-equilibrio-chart-dialog/ponto-equilibrio-chart-dialog.component';
import { WaterfallChartDialogComponent } from './pages/financeiro/dre/waterfall-chart-dialog/waterfall-chart-dialog.component';

registerLocaleData(ptBr);

@NgModule({
  declarations: [
    AppComponent,
    ChangePasswordDialogComponent,
    HomeComponent,
    PontoEquilibrioComponent,
    PontoEquilibrioChartDialogComponent,
    WaterfallChartDialogComponent,
    LoginComponent,
    BoletosPendentesDialogComponent,
    CustomizerSettingsComponent,
    ConfirmacaoDialogComponent,
    LayoutComponent,
    CadastrarComponent,
    DialogCadastroComponent,
    ErroTenteMaisTardeComponent,
    AprovacaoCadastroComponent,
    DetalheCadastroComponent,
    CarregamentoComponent,
    DialogEmpresaAprovadaComponent,
    ProdutoCadastroComponent,
    ProdutoComponent,
    DialogEnvioFotoComponent,
    SecurePipe,
    DialogArquivoApagadoComponent,
    DialogConfirmacaoExclusaoArquivoComponent,
    DialogSalvoComponent,
    DialogDesativarEmpresaComponent,
    CadastroComplementarEmpresaComponent,
    DialogCadastroSucessoComponent,
    DialogCadastroErroComponent,
    ProdutoEditComponent,
    OdontogramComponent,
    RegisterComponent,
    ReauthDialogComponent,
    SidebarComponent,
    HeaderComponent,
    FooterComponent,
    ListagemComponent,
    ComponentesComponent,
    ComponentesCadastroComponent,
    ComponentesEditComponent,
    MarcasComponent,
    MarcasCadastroComponent,
    MarcasEditComponent,
    CoresComponent,
    CoresCadastroComponent,
    CoresEditComponent,
    NoUserComponent,
    UnauthorizedComponent,
    ListaArquivosComponent,
    TrabalhoComponent,
    TrabalhoConcluidoComponent,
    TrabalhoCadastroComponent,
    // TrabalhoEditComponent,
    TabelaPrecoProdutoComponent,
    TabelaPrecoProdutoCadastroComponent,
    TabelaPrecoProdutoEditComponent,
    CriarVersaoDialogComponent,
    SelecionarVersaoDialogComponent,
    EmpresaTabelaPrecoComponent,
    EmpresaTabelaPrecoCadastroComponent,
    RelatorioComponent,
    TrabalhoListaTrabalhosComponent,
    TrabalhoStatusComponent,
    EstoqueComponent,
    AlmoxarifadoCadastroComponent,
    EstoqueCadastroComponent,
    // financeiro
    ContasCadastroComponent,
    ContasComponent,
    ContasEditComponent,
    ContasPagarReceberComponent,
    ImportarCsvHistoricoDialogComponent,
    ContasPagarReceberCadastroComponent,
    ContasPagarReceberEditComponent,
    ContasPagarReceberEditLancamentoComponent,
    ContasAPagarComponent,
    ImportarOfxContasPagarDialogComponent,
    ContasAReceberComponent,
    FornecedoresComponent,
    FornecedorFinanceiroDialogComponent,
    DespesasRecorrentesComponent,
    DespesasRecorrentesCadastroComponent,
    DespesasRecorrentesEditComponent,
    FinanceiroComponent,
    CategoriaComponent,
    CategoriaEditComponent,
    CategoriaCadastroComponent,
    PacienteComponent,
    PacienteCadastroComponent,
    PacienteEditComponent,
    SingleSelectionComponent,
    FaturaComponent,
    FaturasPendentesComponent,
    FaturaDetalhesComponent,
    LancarValorFaturaDialogComponent,
    AlterarCompetenciaFaturaDialogComponent,
    TrocarFaturaDialogComponent,
    DividirFaturaDialogComponent,
    FaturaDetalhamentoImpressaoComponent,
    AplicarDescontoDialogComponent,
    DescontoDevolucaoComponentesDialogComponent,
    ReciboPagamentoDialogComponent,
    ComponentesPendentesComponent,
    DashboardComponent,
    BoletosAtrasadosComponent,
    QuitarBoletoDialogComponent,
    CombustivelComponent,
    VeiculoDialogComponent,
    AbastecimentoDialogComponent,
    ConfiguracaoKmDialogComponent,
    PagamentoKmDialogComponent,
    LogisticaComponent,
    FornecedorDialogComponent,
    EntregaDialogComponent,
    CapitalComponent,
    AporteDialogComponent,
    EmprestimoHistoricoDialogComponent,
    EmprestimoMovimentacaoDialogComponent,
    EmprestimoDialogComponent,
    SocioDialogComponent,
    CredorDialogComponent,
    ConciliacaoBancariaComponent,
    ImportarOfxDialogComponent,
    RetiradaDialogComponent,
    DetalhesConciliacaoComponent,
    DreComponent,
    MotivosComponent,
    MotivosCadastroComponent,
    MotivosEditComponent,
    UsuarioComponent,
    UsuarioCadastroComponent,
    UsuarioPermissoesComponent
  ],
  imports: [
    MatSnackBarModule,
    CdkAccordionModule,
    MatExpansionModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    NgIf,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatSelectModule,
    MatDialogModule,
    MatCardModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    NgScrollbarModule,
    MatPaginatorModule,
    MatTableModule,
    MatStepperModule,
    DragDropModule,
    MatRadioModule,
    MatAutocompleteModule,
    AsyncPipe,
    MultipleSelectionModule,
    // SingleSelectionModule, // Ensure this is imported
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatChipsModule,
    NgChartsModule,
    NgxMaterialTimepickerModule.setOpts('pt-br')
  ],
  providers: [
    AuthGuard,
    GuardRoutePermission,
    LoginGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    DatePipe,
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
