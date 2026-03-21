import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamService } from '../services/team.service';
import { ScheduleService } from '../services/schedule.service';
import { PrepTaskService } from '../services/prep-task.service';
import { CleaningService } from '../services/cleaning.service';
import { CommunicationService } from '../services/communication.service';
import { InventoryService } from '../services/inventory.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">Visão Geral</h1>
          <p class="text-sm md:text-base text-stone-500 mt-1">Bem-vindo ao ChefFlow. Selecione um módulo abaixo.</p>
        </div>
        <div class="text-left md:text-right">
          <p class="text-xs md:text-sm font-medium text-stone-500 uppercase tracking-wider">Data</p>
          <p class="text-base md:text-lg font-semibold text-stone-900">{{ today | date:'dd MMM yyyy':'':'pt-BR' }}</p>
        </div>
      </header>

      <!-- App Drawer / Acesso Rápido -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <a routerLink="/equipe" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors active:scale-95">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <mat-icon class="text-3xl w-8 h-8 flex items-center justify-center">badge</mat-icon>
          </div>
          <span class="text-sm md:text-base font-semibold text-stone-700 text-center">Equipe</span>
        </a>
        <a routerLink="/escalas" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors active:scale-95">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <mat-icon class="text-3xl w-8 h-8 flex items-center justify-center">groups</mat-icon>
          </div>
          <span class="text-sm md:text-base font-semibold text-stone-700 text-center">Escalas</span>
        </a>
        <a routerLink="/producao" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors active:scale-95">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <mat-icon class="text-3xl w-8 h-8 flex items-center justify-center">receipt_long</mat-icon>
          </div>
          <span class="text-sm md:text-base font-semibold text-stone-700 text-center">Produção</span>
        </a>
        <a routerLink="/estoque" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors active:scale-95">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <mat-icon class="text-3xl w-8 h-8 flex items-center justify-center">inventory_2</mat-icon>
          </div>
          <span class="text-sm md:text-base font-semibold text-stone-700 text-center">Estoque</span>
        </a>
        <a routerLink="/limpeza" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors active:scale-95">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <mat-icon class="text-3xl w-8 h-8 flex items-center justify-center">cleaning_services</mat-icon>
          </div>
          <span class="text-sm md:text-base font-semibold text-stone-700 text-center">Limpeza</span>
        </a>
        <a routerLink="/comunicacao" class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors active:scale-95">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <mat-icon class="text-3xl w-8 h-8 flex items-center justify-center">campaign</mat-icon>
          </div>
          <span class="text-sm md:text-base font-semibold text-stone-700 text-center">Avisos</span>
        </a>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-2 md:mb-4">
            <h3 class="text-xs md:text-sm font-medium text-stone-500">Equipe</h3>
            <div class="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <mat-icon class="text-[18px] md:text-[24px] w-4.5 h-4.5 md:w-6 md:h-6">group</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-1 md:gap-2">
            <span class="text-2xl md:text-3xl font-bold text-stone-900">{{ teamPresent() }}</span>
            <span class="text-xs md:text-sm text-stone-500">/ {{ teamTotal() }}</span>
          </div>
        </div>

        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-2 md:mb-4">
            <h3 class="text-xs md:text-sm font-medium text-stone-500">Prep List</h3>
            <div class="p-1.5 md:p-2 bg-amber-50 text-amber-600 rounded-lg">
              <mat-icon class="text-[18px] md:text-[24px] w-4.5 h-4.5 md:w-6 md:h-6">receipt_long</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl md:text-3xl font-bold text-stone-900">{{ prepProgress() }}%</span>
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 mt-2 md:mt-3">
            <div class="bg-amber-500 h-1.5 rounded-full transition-all duration-500" [style.width.%]="prepProgress()"></div>
          </div>
        </div>

        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-2 md:mb-4">
            <h3 class="text-xs md:text-sm font-medium text-stone-500">Limpeza</h3>
            <div class="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg">
              <mat-icon class="text-[18px] md:text-[24px] w-4.5 h-4.5 md:w-6 md:h-6">cleaning_services</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-lg md:text-2xl font-bold text-stone-900 truncate">
              {{ cleaningFechamento().isDone ? 'Concluído' : 'Pendente' }}
            </span>
          </div>
          <p class="text-[10px] md:text-xs text-stone-500 mt-1 md:mt-2">{{ cleaningFechamento().completed }}/{{ cleaningFechamento().total }} tarefas</p>
        </div>

        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-2 md:mb-4">
            <h3 class="text-xs md:text-sm font-medium text-stone-500">Estoque</h3>
            <div class="p-1.5 md:p-2 bg-rose-50 text-rose-600 rounded-lg">
              <mat-icon class="text-[18px] md:text-[24px] w-4.5 h-4.5 md:w-6 md:h-6">inventory_2</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl md:text-3xl font-bold text-stone-900">{{ lowStockItems().length }}</span>
          </div>
          <p class="text-[10px] md:text-xs text-stone-500 mt-1 md:mt-2">Itens abaixo do mínimo</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <!-- Avisos -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div class="p-4 md:p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 class="text-base md:text-lg font-bold text-stone-900">Mural do Chef</h2>
            <a routerLink="/comunicacao" class="text-xs md:text-sm font-medium text-emerald-600 hover:text-emerald-700">Ver Todos</a>
          </div>
          <div class="divide-y divide-stone-100 flex-1">
            @if (announcements().length === 0) {
              <div class="p-6 md:p-8 text-center text-stone-500 text-sm md:text-base">
                Nenhum aviso recente.
              </div>
            }
            @for (announcement of announcements(); track announcement.id) {
              <div class="p-4 md:p-6 flex gap-3 md:gap-4">
                <div class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0"
                  [ngClass]="{
                    'bg-rose-100 text-rose-600': announcement.type === 'urgent',
                    'bg-amber-100 text-amber-600': announcement.type === 'warning',
                    'bg-blue-100 text-blue-600': announcement.type === 'info'
                  }">
                  <mat-icon class="text-[18px] md:text-[24px] w-4.5 h-4.5 md:w-6 md:h-6">{{ announcement.type === 'urgent' ? 'campaign' : (announcement.type === 'warning' ? 'warning' : 'info') }}</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm md:text-base font-bold text-stone-900">{{ announcement.title }}</h4>
                  <p class="text-xs md:text-sm text-stone-600 mt-1">{{ announcement.content }}</p>
                  <p class="text-[10px] md:text-xs text-stone-400 mt-1.5 md:mt-2">{{ announcement.created_at | date:'dd/MM HH:mm' }} • {{ announcement.author?.name || 'Equipe' }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Alertas de Estoque Baixo -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div class="p-4 md:p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 class="text-base md:text-lg font-bold text-stone-900">Estoque Baixo</h2>
            <a routerLink="/estoque" class="text-xs md:text-sm font-medium text-emerald-600 hover:text-emerald-700">Ver Estoque</a>
          </div>
          <div class="p-3 md:p-4 space-y-2 md:space-y-3 flex-1 overflow-y-auto">
            @if (lowStockItems().length === 0) {
              <div class="p-4 text-center text-stone-500 text-xs md:text-sm">
                Nenhum item abaixo do estoque mínimo.
              </div>
            }
            @for (item of lowStockItems(); track item.id) {
              <div class="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2 md:gap-3">
                <mat-icon class="text-rose-500 mt-0.5 text-[18px] md:text-[24px] w-4.5 h-4.5 md:w-6 md:h-6">warning</mat-icon>
                <div class="flex-1">
                  <h4 class="text-xs md:text-sm font-bold text-rose-900">{{ item.name }}</h4>
                  <div class="flex justify-between items-center mt-1">
                    <p class="text-[10px] md:text-xs text-rose-700 font-medium">Atual: {{ item.quantity }} {{ item.unit }}</p>
                    <p class="text-[10px] md:text-xs text-rose-600">Mín: {{ item.min_quantity }} {{ item.unit }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  teamService = inject(TeamService);
  scheduleService = inject(ScheduleService);
  prepTaskService = inject(PrepTaskService);
  cleaningService = inject(CleaningService);
  communicationService = inject(CommunicationService);
  inventoryService = inject(InventoryService);

  today = new Date();
  todayStr = this.today.toISOString().split('T')[0];

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
    const tasks = this.cleaningService.tasks().filter(t => t.shift_moment === 'fechamento' && t.category === 'checklist');
    const completed = tasks.filter(t => t.status === 'conforme' || t.status === 'na').length;
    return {
      completed,
      total: tasks.length,
      isDone: tasks.length > 0 && completed === tasks.length
    };
  });

  lowStockItems = computed(() => {
    return this.inventoryService.items().filter(i => i.quantity <= i.min_quantity).slice(0, 5);
  });

  announcements = computed(() => {
    return this.communicationService.announcements().slice(0, 3);
  });

  ngOnInit() {
    this.teamService.loadTeam();
    this.scheduleService.loadSchedules(this.todayStr, this.todayStr);
    this.prepTaskService.loadTasks();
    this.cleaningService.loadTasks(undefined, this.todayStr);
    this.communicationService.loadAnnouncements();
    this.inventoryService.loadItems();
  }
}
