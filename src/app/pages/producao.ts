import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PrepTaskService, PrepTask } from '../services/prep-task.service';
import { TeamService } from '../services/team.service';
import { AuthService } from '../services/auth.service';
import { ExportService } from '../services/export.service';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Produção (Mise en Place)</h1>
          <p class="text-stone-500 mt-1">Prep list inteligente e fichas técnicas.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="exportarRelatorio()" class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
            <mat-icon>download</mat-icon>
            <span class="hidden sm:inline">Exportar CSV</span>
          </button>
          <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            <span class="hidden sm:inline">{{ showForm() ? 'Cancelar' : 'Nova Tarefa' }}</span>
            <span class="sm:hidden">{{ showForm() ? 'Cancelar' : 'Nova' }}</span>
          </button>
        </div>
      </header>

      <!-- Formulário de Nova Tarefa -->
      @if (showForm()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Adicionar Nova Tarefa</h2>
          
          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="task-name" class="text-sm font-medium text-stone-700">Nome da Tarefa</label>
              <input id="task-name" type="text" formControlName="name" placeholder="Ex: Caldo de Legumes" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label for="task-team" class="text-sm font-medium text-stone-700">Praça (Equipe)</label>
              <select id="task-team" formControlName="team_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="">Nenhuma praça (Geral)</option>
                @for (team of teamService.teams(); track team.id) {
                  <option [value]="team.id">{{ team.name }}</option>
                }
              </select>
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label for="task-description" class="text-sm font-medium text-stone-700">Descrição / Instruções</label>
              <input id="task-description" type="text" formControlName="description" placeholder="Ex: Fazer 10 litros para o serviço da noite" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            <div class="md:col-span-2 flex justify-end mt-2">
              <button type="submit" [disabled]="taskForm.invalid || isSubmitting()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">save</mat-icon>
                  Salvar Tarefa
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Praças Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button 
          (click)="filterByTeam('todas')"
          [class.bg-stone-900]="activePraca() === 'todas'"
          [class.text-white]="activePraca() === 'todas'"
          [class.bg-white]="activePraca() !== 'todas'"
          [class.text-stone-600]="activePraca() !== 'todas'"
          class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
          Todas as Praças
        </button>
        @for (team of teamService.teams(); track team.id) {
          <button 
            (click)="filterByTeam(team.id)"
            [class.bg-stone-900]="activePraca() === team.id"
            [class.text-white]="activePraca() === team.id"
            [class.bg-white]="activePraca() !== team.id"
            [class.text-stone-600]="activePraca() !== team.id"
            class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
            {{ team.name }}
          </button>
        }
      </div>

      <!-- Prep List -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden relative" [class.opacity-60]="prepTaskService.isLoading() && prepTaskService.tasks().length > 0">
        <div class="p-4 md:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50">
          <div>
            <h2 class="text-lg font-bold text-stone-900">Prep List de Hoje</h2>
            <p class="text-sm text-stone-500 mt-1">Acompanhe o progresso da produção</p>
          </div>
          <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
            <div class="w-12 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-500" [style.width.%]="completionPercentage()"></div>
            </div>
            <span class="text-sm font-bold text-stone-700">{{ completionPercentage() }}% Concluído</span>
          </div>
        </div>
        
        <div class="p-4 md:p-6 bg-stone-50/50">
          @if (prepTaskService.isLoading() && prepTaskService.tasks().length === 0) {
            <div class="p-12 text-center text-stone-500 flex flex-col items-center">
              <mat-icon class="animate-spin text-emerald-600 text-4xl mb-4">refresh</mat-icon>
              <p class="font-medium">Carregando tarefas de produção...</p>
            </div>
          } @else if (prepTaskService.tasks().length === 0) {
            <div class="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 border-dashed">
              <mat-icon class="text-4xl mb-3 opacity-50">receipt_long</mat-icon>
              <p class="font-medium">Nenhuma tarefa encontrada para esta praça.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (task of prepTaskService.tasks(); track task.id) {
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 relative overflow-hidden group transition-all hover:shadow-md flex flex-col" 
                     [ngClass]="{
                       'border-amber-300 bg-amber-50/30': task.status === 'in-progress',
                       'border-emerald-200 bg-emerald-50/30 opacity-75': task.status === 'completed'
                     }">
                  
                  @if (task.status === 'in-progress') {
                    <div class="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                  } @else if (task.status === 'completed') {
                    <div class="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                  }

                  <div class="flex justify-between items-start mb-3 mt-1">
                    <div class="flex flex-wrap gap-2">
                      @if (task.teams?.name) {
                        <span class="px-2.5 py-1 bg-stone-100 text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded-md">{{ task.teams?.name }}</span>
                      }
                      @if (task.status === 'in-progress') {
                        <span class="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-wider rounded-md animate-pulse">Em Produção</span>
                      }
                    </div>
                    @if (canManageTasks()) {
                      <button (click)="removeTask(task.id)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-full shadow-sm">
                        <mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon>
                      </button>
                    }
                  </div>
                  
                  <div class="flex-1 mb-5">
                    <h3 class="text-lg font-bold text-stone-900 leading-tight" [class.line-through]="task.status === 'completed'">
                      {{ task.name }}
                    </h3>
                    @if (task.description) {
                      <p class="text-sm text-stone-500 mt-2 line-clamp-3">{{ task.description }}</p>
                    }
                  </div>
                  
                  <div class="mt-auto pt-4 border-t border-stone-100">
                    @if (task.status === 'pending') {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                        <mat-icon>play_arrow</mat-icon>
                        Iniciar Produção
                      </button>
                    } @else if (task.status === 'in-progress') {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                        <mat-icon>check</mat-icon>
                        Concluir Tarefa
                      </button>
                    } @else {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                        <mat-icon>undo</mat-icon>
                        Reabrir Tarefa
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProducaoComponent implements OnInit {
  prepTaskService = inject(PrepTaskService);
  teamService = inject(TeamService);
  authService = inject(AuthService);
  exportService = inject(ExportService);
  private fb = inject(FormBuilder);

  activePraca = signal<string>('todas');
  showForm = signal(false);
  isSubmitting = signal(false);

  taskForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    team_id: ['']
  });

  completionPercentage = computed(() => {
    const tasks = this.prepTaskService.tasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  });

  ngOnInit() {
    this.teamService.loadTeams();
    this.prepTaskService.loadTasks();
  }

  canManageTasks(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin' || user?.role === 'chef';
  }

  canEditTasks(): boolean {
    const user = this.authService.currentUser();
    return user?.role !== 'auditor';
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.taskForm.reset({ team_id: '' });
    }
  }

  filterByTeam(teamId: string) {
    this.activePraca.set(teamId);
    this.prepTaskService.loadTasks(teamId);
  }

  async toggleTaskStatus(task: PrepTask) {
    const nextStatus: Record<PrepTask['status'], PrepTask['status']> = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending'
    };
    
    await this.prepTaskService.updateTask({
      id: task.id,
      status: nextStatus[task.status]
    });
  }

  async onSubmit() {
    if (this.taskForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.taskForm.value;
      
      const success = await this.prepTaskService.addTask({
        name: formValue.name || '',
        description: formValue.description || '',
        team_id: formValue.team_id || undefined,
        status: 'pending'
      });
      
      this.isSubmitting.set(false);
      
      if (success) {
        this.toggleForm();
      }
    }
  }

  async removeTask(id: string) {
    if (confirm('Tem certeza que deseja remover esta tarefa?')) {
      await this.prepTaskService.removeTask(id);
    }
  }

  exportarRelatorio() {
    const data = this.prepTaskService.tasks().map((task: PrepTask) => ({
      tarefa: task.name,
      descricao: task.description || '',
      praca: task.teams?.name || 'Geral',
      status: task.status === 'completed' ? 'Concluído' : (task.status === 'in-progress' ? 'Em Progresso' : 'Pendente'),
      criado_em: task.created_at ? new Date(task.created_at).toLocaleDateString('pt-BR') : '-'
    }));

    const headers = [
      { key: 'tarefa', label: 'Tarefa' },
      { key: 'descricao', label: 'Descrição' },
      { key: 'praca', label: 'Praça' },
      { key: 'status', label: 'Status' },
      { key: 'criado_em', label: 'Criado Em' }
    ];

    this.exportService.exportToCsv('Relatorio_Producao', data, headers);
  }
}
