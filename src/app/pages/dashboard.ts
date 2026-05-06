import { ChangeDetectionStrategy, Component, inject, OnInit, computed, effect, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamService } from '../services/team.service';
import { ScheduleService } from '../services/schedule.service';
import { PrepTaskService } from '../services/prep-task.service';
import { CleaningService } from '../services/cleaning.service';
import { CommunicationService } from '../services/communication.service';
import { InventoryService } from '../services/inventory.service';
import { ExportService } from '../services/export.service';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, CommonModule, RouterModule],
  template: `
    <div class="px-4 py-8 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
      
      <!-- Greeting Header (Mobile-Friendly) -->
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-[28px] md:text-3xl font-black tracking-tight text-stone-900 leading-tight">Olá, {{ firstName() }}</h1>
          <p class="text-sm md:text-base text-stone-500 font-medium">O que vamos fazer hoje?</p>
        </div>
        <button (click)="authService.logout()" class="w-12 h-12 rounded-full bg-stone-100 text-stone-500 border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 active:scale-95 transition-transform" title="Sair">
          <mat-icon class="text-[24px]">logout</mat-icon>
        </button>
      </header>

      <!-- KPI Cards (Top Row) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 pointer-events-none"></div>
          <div class="flex items-center justify-between mb-2 z-10">
            <h3 class="text-xs md:text-sm font-bold text-stone-500 uppercase tracking-wider">Eficiência Prep</h3>
            <div class="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <mat-icon class="text-[18px] w-4.5 h-4.5">trending_up</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2 z-10 mt-1">
            <span class="text-3xl md:text-4xl font-black text-stone-900">{{ prepProgress() }}%</span>
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 mt-3 z-10">
            <div class="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" [style.width.%]="prepProgress()"></div>
          </div>
        </div>

        <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 pointer-events-none"></div>
          <div class="flex items-center justify-between mb-2 z-10">
            <h3 class="text-xs md:text-sm font-bold text-stone-500 uppercase tracking-wider">Conformidade (Limpeza)</h3>
            <div class="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <mat-icon class="text-[18px] w-4.5 h-4.5">fact_check</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2 z-10 mt-1">
            <span class="text-3xl md:text-4xl font-black text-stone-900">{{ cleaningCompliance() }}%</span>
          </div>
          <p class="text-[10px] md:text-xs font-medium text-stone-500 mt-2 z-10">{{ cleaningFechamento().completed }} de {{ cleaningFechamento().total }} tarefas OK</p>
        </div>

        <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 pointer-events-none"></div>
          <div class="flex items-center justify-between mb-2 z-10">
            <h3 class="text-xs md:text-sm font-bold text-stone-500 uppercase tracking-wider">Risco de Ruptura</h3>
            <div class="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <mat-icon class="text-[18px] w-4.5 h-4.5">warning_amber</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2 z-10 mt-1">
            <span class="text-3xl md:text-4xl font-black text-stone-900" [class.text-rose-600]="lowStockItems().length > 0">{{ lowStockItems().length }}</span>
            <span class="text-xs md:text-sm font-bold text-stone-500">itens</span>
          </div>
          <p class="text-[10px] md:text-xs font-medium text-stone-500 mt-2 z-10">Abaixo do estoque mínimo</p>
        </div>

        <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 pointer-events-none"></div>
          <div class="flex items-center justify-between mb-2 z-10">
            <h3 class="text-xs md:text-sm font-bold text-stone-500 uppercase tracking-wider">Força de Trabalho</h3>
            <div class="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <mat-icon class="text-[18px] w-4.5 h-4.5">groups</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2 z-10 mt-1">
            <span class="text-3xl md:text-4xl font-black text-stone-900">{{ teamPresent() }}</span>
            <span class="text-sm font-bold text-stone-500">/ {{ teamTotal() }}</span>
          </div>
          <p class="text-[10px] md:text-xs font-medium text-stone-500 mt-2 z-10">Colaboradores escalados hoje</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <!-- Prep Tasks Chart -->
        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <h2 class="text-base md:text-lg font-bold text-stone-900 mb-4">Status da Produção (Prep List)</h2>
          <div class="relative h-64 w-full flex-1">
            <canvas #prepChart></canvas>
          </div>
        </div>

        <!-- Inventory Health Chart -->
        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <h2 class="text-base md:text-lg font-bold text-stone-900 mb-4">Saúde do Estoque (Curva ABC)</h2>
          <div class="relative h-64 w-full flex-1 flex justify-center">
            <canvas #inventoryChart></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Smart Alerts & Quick Access -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        <!-- Smart Alerts -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div class="p-4 md:p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <div class="flex items-center gap-2">
              <mat-icon class="text-amber-500">lightbulb</mat-icon>
              <h2 class="text-base md:text-lg font-bold text-stone-900">Insights & Alertas Inteligentes</h2>
            </div>
          </div>
          <div class="p-4 md:p-5 space-y-3 flex-1 overflow-y-auto bg-stone-50/50">
            @if (smartAlerts().length === 0) {
              <div class="p-6 text-center text-stone-500 text-sm">
                Nenhum alerta crítico no momento. A operação está fluindo bem!
              </div>
            }
            @for (alert of smartAlerts(); track alert.id) {
              <div class="p-4 bg-white rounded-xl border border-stone-200 shadow-sm flex items-start gap-3 transition-all hover:shadow-md">
                <div class="p-2 rounded-full shrink-0" [ngClass]="alert.bgColor + ' ' + alert.textColor">
                  <mat-icon class="text-[20px] w-5 h-5">{{ alert.icon }}</mat-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-stone-900">{{ alert.title }}</h4>
                  <p class="text-xs text-stone-600 mt-1 leading-relaxed">{{ alert.message }}</p>
                </div>
                @if (alert.link) {
                  <a [routerLink]="alert.link" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 mt-1 flex items-center gap-1">
                    Resolver <mat-icon class="text-[14px] w-3.5 h-3.5">arrow_forward</mat-icon>
                  </a>
                }
              </div>
            }
          </div>
        </div>

        <!-- Quick Access / App Drawer -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div class="p-4 md:p-5 border-b border-stone-100 bg-stone-50">
            <h2 class="text-base md:text-lg font-bold text-stone-900">Módulos Operacionais</h2>
          </div>
          <div class="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            @if (authService.canManageTeam()) {
              <a routerLink="/equipe" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-indigo-600 transition-colors w-8 h-8 text-[32px] mb-1">badge</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-indigo-700 text-center">Equipe</span>
              </a>
            }
            @if (!authService.isEstoque() && !authService.isAuditor()) {
              <a routerLink="/escalas" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-emerald-600 transition-colors w-8 h-8 text-[32px] mb-1">groups</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-emerald-700 text-center">Escalas</span>
              </a>
            }
            @if (!authService.isEstoque()) {
              <a routerLink="/producao" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-100 hover:text-amber-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-amber-600 transition-colors w-8 h-8 text-[32px] mb-1">receipt_long</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-amber-700 text-center">Produção</span>
              </a>
              <a routerLink="/receitas" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-100 hover:text-orange-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-orange-600 transition-colors w-8 h-8 text-[32px] mb-1">menu_book</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-orange-700 text-center">Receitas</span>
              </a>
            }
            @if (!authService.isCook()) {
              <a routerLink="/estoque" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-100 hover:text-teal-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-teal-600 transition-colors w-8 h-8 text-[32px] mb-1">inventory_2</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-teal-700 text-center">Estoque</span>
              </a>
              <a routerLink="/compras" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-cyan-50 hover:border-cyan-100 hover:text-cyan-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-cyan-600 transition-colors w-8 h-8 text-[32px] mb-1">local_shipping</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-cyan-700 text-center">Compras</span>
              </a>
            }
            @if (!authService.isEstoque()) {
              <a routerLink="/limpeza" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-100 hover:text-blue-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-blue-600 transition-colors w-8 h-8 text-[32px] mb-1">cleaning_services</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-blue-700 text-center">Checklists</span>
              </a>
              <a routerLink="/desperdicio" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-700 transition-colors group">
                <mat-icon class="text-stone-400 group-hover:text-rose-600 transition-colors w-8 h-8 text-[32px] mb-1">delete_sweep</mat-icon>
                <span class="text-xs font-bold text-stone-600 group-hover:text-rose-700 text-center">Desperdício</span>
              </a>
            }
            <a routerLink="/comunicacao" class="p-4 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-100 hover:text-purple-700 transition-colors group">
              <mat-icon class="text-stone-400 group-hover:text-purple-600 transition-colors w-8 h-8 text-[32px] mb-1">campaign</mat-icon>
              <span class="text-xs font-bold text-stone-600 group-hover:text-purple-700 text-center">Avisos</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, AfterViewInit {
  teamService = inject(TeamService);
  scheduleService = inject(ScheduleService);
  prepTaskService = inject(PrepTaskService);
  cleaningService = inject(CleaningService);
  communicationService = inject(CommunicationService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  exportService = inject(ExportService);

  @ViewChild('prepChart') prepChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('inventoryChart') inventoryChartRef!: ElementRef<HTMLCanvasElement>;

  private prepChartInstance: Chart | null = null;
  private inventoryChartInstance: Chart | null = null;

  today = new Date();
  todayStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(this.today);

  firstName = computed(() => {
    const name = this.authService.currentUser()?.name || '';
    return name.split(' ')[0] || 'Chef';
  });

  teamPresent = computed(() => {
    const schedules = this.scheduleService.schedules();
    const todaySchedules = schedules.filter(s => s.date.startsWith(this.todayStr) && s.type !== 'folga');
    return todaySchedules.length;
  });

  teamTotal = computed(() => this.teamService.teamMembers().length);

  prepProgress = computed(() => {
    const tasks = this.prepTaskService.tasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  });

  cleaningFechamento = computed(() => {
    const tasks = this.cleaningService.tasks().filter(t => t.category === 'checklist');
    const completed = tasks.filter(t => t.status === 'conforme' || t.status === 'na').length;
    return {
      completed,
      total: tasks.length,
      isDone: tasks.length > 0 && completed === tasks.length
    };
  });

  cleaningCompliance = computed(() => {
    const data = this.cleaningFechamento();
    if (data.total === 0) return 100;
    return Math.round((data.completed / data.total) * 100);
  });

  lowStockItems = computed(() => {
    return this.inventoryService.items().filter(i => i.quantity <= i.min_quantity);
  });

  smartAlerts = computed(() => {
    const alerts = [];
    
    // 1. Estoque Alert
    const lowStock = this.lowStockItems();
    if (lowStock.length > 0) {
      alerts.push({
        id: 'stock',
        title: 'Risco de Ruptura de Estoque',
        message: `${lowStock.length} itens atingiram o nível mínimo. Ação de compra recomendada imediatamente para evitar paradas na produção.`,
        icon: 'inventory_2',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-700',
        link: '/estoque'
      });
    }

    // 2. Prep Alert
    const prepProg = this.prepProgress();
    const currentHour = new Date().getHours();
    if (prepProg < 50 && currentHour >= 15) {
      alerts.push({
        id: 'prep',
        title: 'Atraso na Produção (Prep List)',
        message: `A produção está em apenas ${prepProg}%, e já passou das 15h. Considere realocar equipe para acelerar o preparo.`,
        icon: 'timer',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        link: '/producao'
      });
    }

    // 3. Cleaning Alert
    const cleaningData = this.cleaningService.tasks().filter(t => t.category === 'termometria' && t.status === 'nao_conforme');
    if (cleaningData.length > 0) {
      alerts.push({
        id: 'temp',
        title: 'Alerta de Segurança Alimentar',
        message: `${cleaningData.length} equipamentos registraram temperatura fora do padrão seguro hoje. Verifique imediatamente.`,
        icon: 'ac_unit',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-700',
        link: '/limpeza'
      });
    }

    // 4. Communication Alert
    const urgentNotices = this.communicationService.announcements().filter(a => a.type === 'urgent');
    if (urgentNotices.length > 0) {
      alerts.push({
        id: 'notice',
        title: 'Aviso Urgente da Gestão',
        message: urgentNotices[0].title,
        icon: 'campaign',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        link: '/comunicacao'
      });
    }

    // Default positive alert if everything is fine
    if (alerts.length === 0) {
      alerts.push({
        id: 'ok',
        title: 'Operação Saudável',
        message: 'Todos os indicadores estão dentro da normalidade. Bom serviço!',
        icon: 'verified',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        link: null
      });
    }

    return alerts;
  });

  constructor() {
    // Effect to update Prep Chart
    effect(() => {
      const tasks = this.prepTaskService.tasks();
      if (this.prepChartInstance && tasks) {
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        
        this.prepChartInstance.data.datasets[0].data = [completed, inProgress, pending];
        this.prepChartInstance.update();
      }
    });

    // Effect to update Inventory Chart
    effect(() => {
      const items = this.inventoryService.items();
      if (this.inventoryChartInstance && items) {
        const healthy = items.filter(i => i.quantity > i.min_quantity * 1.5).length;
        const warning = items.filter(i => i.quantity > i.min_quantity && i.quantity <= i.min_quantity * 1.5).length;
        const critical = items.filter(i => i.quantity <= i.min_quantity).length;

        this.inventoryChartInstance.data.datasets[0].data = [healthy, warning, critical];
        this.inventoryChartInstance.update();
      }
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    
    this.teamService.loadTeam(user?.role === 'admin' ? undefined : user?.team_id);
    this.scheduleService.loadSchedules(this.todayStr, this.todayStr, user?.role === 'admin' ? undefined : user?.team_id);
    this.prepTaskService.loadTasks(user?.role === 'admin' ? undefined : user?.team_id);
    this.cleaningService.loadTasks(undefined, this.todayStr, user?.role === 'admin' ? undefined : user?.team_id);
    this.communicationService.loadAnnouncements(user?.role === 'admin' ? undefined : user?.team_id);
    
    if (user?.role === 'admin' || user?.role === 'estoque') {
      this.inventoryService.loadItems();
    } else if (user?.team_id) {
      this.inventoryService.loadItems(user.team_id);
    }
  }

  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initPrepChart();
      this.initInventoryChart();
    }
  }

  private initPrepChart() {
    if (!this.prepChartRef) return;
    
    const ctx = this.prepChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.prepChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Concluído', 'Em Andamento', 'Pendente'],
        datasets: [{
          label: 'Tarefas',
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)', // emerald-500
            'rgba(245, 158, 11, 0.8)', // amber-500
            'rgba(244, 63, 94, 0.8)'   // rose-500
          ],
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(28, 25, 23, 0.9)',
            padding: 12,
            titleFont: { size: 14, family: 'Inter' },
            bodyFont: { size: 14, family: 'Inter' },
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(231, 229, 228, 0.5)' },
            ticks: { stepSize: 1, font: { family: 'Inter' } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', weight: 'bold' } }
          }
        }
      }
    });
  }

  private initInventoryChart() {
    if (!this.inventoryChartRef) return;
    
    const ctx = this.inventoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.inventoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Saudável', 'Atenção', 'Crítico (Abaixo Mín)'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)', // emerald-500
            'rgba(245, 158, 11, 0.8)', // amber-500
            'rgba(244, 63, 94, 0.8)'   // rose-500
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(28, 25, 23, 0.9)',
            padding: 12,
            titleFont: { size: 14, family: 'Inter' },
            bodyFont: { size: 14, family: 'Inter' },
            cornerRadius: 8
          }
        }
      }
    });
  }

  exportarVisaoGeral() {
    const data = [
      { metrica: 'Equipe Presente', valor: `${this.teamPresent()} / ${this.teamTotal()}` },
      { metrica: 'Progresso Prep List', valor: `${this.prepProgress()}%` },
      { metrica: 'Conformidade Limpeza', valor: `${this.cleaningCompliance()}%` },
      { metrica: 'Itens Estoque Baixo', valor: `${this.lowStockItems().length} itens` }
    ];

    const headers = [
      { key: 'metrica', label: 'Métrica (Visão Geral)' },
      { key: 'valor', label: 'Valor Atual' }
    ];

    this.exportService.exportToCsv('Relatorio_BI_ChefFlow', data, headers);
  }
}

