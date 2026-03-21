import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PrepTaskService, PrepTask } from '../services/prep-task.service';
import { TeamService } from '../services/team.service';
import { AuthService } from '../services/auth.service';

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
          <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancelar' : 'Nova Tarefa' }}
          </button>
        </div>
      </header>

      <!-- Formulário de Nova Tarefa -->
      @if (showForm()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Adicionar Nova Tarefa</h2>
          
          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Nome da Tarefa</label>
              <input type="text" formControlName="name" placeholder="Ex: Caldo de Legumes" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Praça (Equipe)</label>
              <select formControlName="team_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="">Nenhuma praça (Geral)</option>
                @for (team of teamService.teams(); track team.id) {
                  <option [value]="team.id">{{ team.name }}</option>
                }
              </select>
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label class="text-sm font-medium text-stone-700">Descrição / Instruções</label>
              <input type="text" formControlName="description" placeholder="Ex: Fazer 10 litros para o serviço da noite" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
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
        <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 class="font-bold text-stone-900">Prep List de Hoje</h2>
          <div class="text-sm font-medium text-stone-500">{{ completionPercentage() }}% Concluído</div>
        </div>
        
        <div class="divide-y divide-stone-100">
          @if (prepTaskService.isLoading() && prepTaskService.tasks().length === 0) {
            <div class="p-8 text-center text-stone-500">
              <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
              <p>Carregando tarefas...</p>
            </div>
          } @else if (prepTaskService.tasks().length === 0) {
            <div class="p-8 text-center text-stone-500">
              <p>Nenhuma tarefa encontrada para esta praça.</p>
            </div>
          } @else {
            @for (task of prepTaskService.tasks(); track task.id) {
              <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors group" [ngClass]="{'bg-amber-50/30': task.status === 'in-progress'}">
                
                <button (click)="toggleTaskStatus(task)" class="mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  [ngClass]="{
                    'border-emerald-500 text-emerald-500 bg-emerald-50': task.status === 'completed',
                    'border-amber-500': task.status === 'in-progress',
                    'border-stone-300': task.status === 'pending'
                  }">
                  @if (task.status === 'completed') {
                    <mat-icon class="text-[16px] w-4 h-4">check</mat-icon>
                  } @else if (task.status === 'in-progress') {
                    <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
                  }
                </button>
                
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-base font-bold text-stone-900" [class.line-through]="task.status === 'completed'" [class.opacity-50]="task.status === 'completed'">
                      {{ task.name }}
                    </h3>
                    @if (task.teams?.name) {
                      <span class="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded">{{ task.teams?.name }}</span>
                    }
                    @if (task.status === 'in-progress') {
                      <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-wider rounded">Em Produção</span>
                    }
                  </div>
                  @if (task.description) {
                    <p class="text-sm text-stone-500 mt-1">{{ task.description }}</p>
                  }
                </div>
                
                <div class="flex items-center gap-2 shrink-0">
                  @if (canManageTasks()) {
                    <button (click)="removeTask(task.id)" class="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remover Tarefa">
                      <mat-icon class="text-[20px] w-5 h-5">delete_outline</mat-icon>
                    </button>
                  }
                </div>
              </div>
            }
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
}
