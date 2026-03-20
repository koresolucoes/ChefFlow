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
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Visão Geral</h1>
          <p class="text-stone-500 mt-1">Bem-vindo ao ChefFlow. Aqui está o resumo da operação de hoje.</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-stone-500 uppercase tracking-wider">Data</p>
          <p class="text-lg font-semibold text-stone-900">{{ today | date:'dd MMM yyyy':'':'pt-BR' }}</p>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Equipe Escalada</h3>
            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <mat-icon>group</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">{{ teamPresent() }}</span>
            <span class="text-sm text-stone-500">/ {{ teamTotal() }}</span>
          </div>
          <p class="text-xs text-stone-500 mt-2">Membros escalados hoje</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Prep List</h3>
            <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <mat-icon>receipt_long</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">{{ prepProgress() }}%</span>
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 mt-3">
            <div class="bg-amber-500 h-1.5 rounded-full transition-all duration-500" [style.width.%]="prepProgress()"></div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Limpeza (Fechamento)</h3>
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <mat-icon>cleaning_services</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">
              {{ cleaningFechamento().isDone ? 'Concluído' : 'Pendente' }}
            </span>
          </div>
          <p class="text-xs text-stone-500 mt-2">{{ cleaningFechamento().completed }}/{{ cleaningFechamento().total }} tarefas concluídas</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Alertas de Estoque</h3>
            <div class="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <mat-icon>inventory_2</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">{{ lowStockItems().length }}</span>
          </div>
          <p class="text-xs text-stone-500 mt-2">Itens abaixo do mínimo</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Avisos -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 class="text-lg font-bold text-stone-900">Mural do Chef</h2>
            <a routerLink="/comunicacao" class="text-sm font-medium text-emerald-600 hover:text-emerald-700">Ver Todos</a>
          </div>
          <div class="divide-y divide-stone-100 flex-1">
            @if (announcements().length === 0) {
              <div class="p-8 text-center text-stone-500">
                Nenhum aviso recente.
              </div>
            }
            @for (announcement of announcements(); track announcement.id) {
              <div class="p-6 flex gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  [ngClass]="{
                    'bg-rose-100 text-rose-600': announcement.type === 'urgent',
                    'bg-amber-100 text-amber-600': announcement.type === 'warning',
                    'bg-blue-100 text-blue-600': announcement.type === 'info'
                  }">
                  <mat-icon>{{ announcement.type === 'urgent' ? 'campaign' : (announcement.type === 'warning' ? 'warning' : 'info') }}</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-stone-900">{{ announcement.title }}</h4>
                  <p class="text-sm text-stone-600 mt-1">{{ announcement.content }}</p>
                  <p class="text-xs text-stone-400 mt-2">{{ announcement.created_at | date:'dd/MM HH:mm' }} • {{ announcement.author?.name || 'Equipe' }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Alertas de Estoque Baixo -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 class="text-lg font-bold text-stone-900">Estoque Baixo</h2>
            <a routerLink="/estoque" class="text-sm font-medium text-emerald-600 hover:text-emerald-700">Ver Estoque</a>
          </div>
          <div class="p-4 space-y-3 flex-1 overflow-y-auto">
            @if (lowStockItems().length === 0) {
              <div class="p-4 text-center text-stone-500 text-sm">
                Nenhum item abaixo do estoque mínimo.
              </div>
            }
            @for (item of lowStockItems(); track item.id) {
              <div class="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                <mat-icon class="text-rose-500 mt-0.5">warning</mat-icon>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-rose-900">{{ item.name }}</h4>
                  <div class="flex justify-between items-center mt-1">
                    <p class="text-xs text-rose-700 font-medium">Atual: {{ item.quantity }} {{ item.unit }}</p>
                    <p class="text-xs text-rose-600">Mín: {{ item.min_quantity }} {{ item.unit }}</p>
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
