import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PrepTaskService, PrepTask } from '../services/prep-task.service';
import { TeamService } from '../services/team.service';
import { AuthService } from '../services/auth.service';
import { ExportService } from '../services/export.service';
import { RecipeService } from '../services/recipe.service';

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
            
            @if (authService.isAdmin()) {
              <div class="space-y-1.5">
                <label for="task-team" class="text-sm font-medium text-stone-700">Praça (Equipe)</label>
                <select id="task-team" formControlName="team_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="">Nenhuma praça (Geral)</option>
                  @for (team of teamService.teams(); track team.id) {
                    <option [value]="team.id">{{ team.name }}</option>
                  }
                </select>
              </div>
            }

            <div class="space-y-1.5 md:col-span-2">
              <label for="task-description" class="text-sm font-medium text-stone-700">Descrição / Instruções</label>
              <input id="task-description" type="text" formControlName="description" placeholder="Ex: Fazer 10 litros para o serviço da noite" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            <!-- Fichas Técnicas Integradas -->
            <div class="space-y-1.5">
              <label for="task-recipe" class="text-sm font-medium text-stone-700">Vincular Receita / Ficha Técnica (Opcional)</label>
              <select id="task-recipe" formControlName="recipe_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="">Nenhuma receita</option>
                @for (recipe of recipeService.recipes(); track recipe.id) {
                  <option [value]="recipe.id">{{ recipe.name }}</option>
                }
              </select>
            </div>

            @if (taskForm.get('recipe_id')?.value) {
              <div class="space-y-1.5">
                <label for="task-target-portions" class="text-sm font-medium text-stone-700">Porções a Produzir</label>
                <input id="task-target-portions" type="number" formControlName="target_portions" min="1" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>
            }

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
      @if (authService.isAdmin()) {
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
      }

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
                <div class="bg-white rounded-2xl shadow-sm border p-4 sm:p-5 relative overflow-hidden group flex flex-col" 
                     [ngClass]="{
                       'border-stone-200': task.status === 'pending',
                       'border-amber-300 bg-amber-50/50': task.status === 'in-progress',
                       'border-emerald-300 bg-emerald-50/70': task.status === 'completed'
                     }">
                  
                  @if (task.status === 'in-progress') {
                    <div class="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
                  } @else if (task.status === 'completed') {
                    <div class="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                  }

                  <div class="flex justify-between items-start mb-2">
                    <div class="flex flex-wrap gap-2 pt-1">
                      @if (task.teams?.name) {
                        <span class="px-2.5 py-1 bg-stone-100 text-stone-700 text-[11px] uppercase font-bold tracking-wider rounded-lg">{{ task.teams?.name }}</span>
                      }
                      @if (task.status === 'in-progress') {
                        <span class="px-2.5 py-1 bg-amber-200 text-amber-900 text-[11px] uppercase font-bold tracking-wider rounded-lg flex items-center gap-1">
                           <mat-icon class="text-[14px] w-3.5 h-3.5 animate-spin">sync</mat-icon> Em Andamento
                         </span>
                      }
                    </div>
                    @if (canManageTasks()) {
                      <button (click)="removeTask(task.id)" class="text-stone-400 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 -mr-2 -mt-2 rounded-full">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </div>
                  
                  <div class="flex-1 mb-6">
                    <h3 class="text-xl sm:text-lg font-black text-stone-900 leading-tight" [class.line-through]="task.status === 'completed'">
                      {{ task.name }}
                    </h3>
                    @if (task.recipe_id && task.target_portions) {
                      <div class="mt-2 inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                        <mat-icon class="text-[16px] w-4 h-4 mr-1">receipt</mat-icon> Fazer: {{ task.target_portions }} porções
                      </div>
                    }
                    @if (task.description) {
                      <p class="text-base text-stone-600 mt-3">{{ task.description }}</p>
                    }
                  </div>
                  
                  <div class="mt-auto pt-4 border-t border-stone-200/50">
                    @if (task.status === 'pending') {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-4 sm:py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm text-lg sm:text-base disabled:opacity-50">
                        <mat-icon>play_arrow</mat-icon>
                        Começar
                      </button>
                    } @else if (task.status === 'in-progress') {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-4 sm:py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm text-lg sm:text-base disabled:opacity-50">
                        <mat-icon>check_circle</mat-icon>
                        Pronto!
                      </button>
                    } @else {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-4 sm:py-3 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm text-lg sm:text-base disabled:opacity-50">
                        <mat-icon>undo</mat-icon>
                        Desfazer
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
  recipeService = inject(RecipeService);
  private fb = inject(FormBuilder);

  activePraca = signal<string>('todas');
  showForm = signal(false);
  isSubmitting = signal(false);

  taskForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    team_id: [''],
    recipe_id: [''],
    target_portions: [1]
  });

  completionPercentage = computed(() => {
    const tasks = this.prepTaskService.tasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  });

  ngOnInit() {
    if (this.authService.isAdmin()) {
      this.teamService.loadTeams();
    }
    const user = this.authService.currentUser();
    this.prepTaskService.loadTasks(user?.role === 'admin' ? undefined : user?.team_id);
    this.recipeService.loadRecipes();
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
      this.taskForm.reset({ team_id: '', recipe_id: '', target_portions: 1 });
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
        recipe_id: formValue.recipe_id || undefined,
        target_portions: formValue.recipe_id ? (formValue.target_portions || 1) : undefined,
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
