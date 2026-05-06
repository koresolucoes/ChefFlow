import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { PrepTaskService, PrepTask } from '../services/prep-task.service';
import { TeamService } from '../services/team.service';
import { AuthService } from '../services/auth.service';
import { ExportService } from '../services/export.service';
import { RecipeService } from '../services/recipe.service';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Produção (Mise en Place)</h1>
          <p class="text-stone-500 mt-1">Prep list inteligente e fichas técnicas.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="exportarRelatorio()" class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2 shadow-sm">
            <mat-icon>download</mat-icon>
            <span class="hidden sm:inline">Exportar CSV</span>
          </button>
          @if (canManageTasks()) {
            <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-sm">
              <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
              <span class="hidden sm:inline">{{ showForm() ? 'Cancelar' : 'Nova Tarefa' }}</span>
              <span class="sm:hidden">{{ showForm() ? 'Cancelar' : 'Nova' }}</span>
            </button>
          }
        </div>
      </header>

      <!-- Formulário de Nova Tarefa -->
      @if (showForm() && canManageTasks()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Adicionar Nova Tarefa</h2>
          
          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="space-y-1.5 lg:col-span-2">
              <label for="task-name" class="text-sm font-medium text-stone-700">Nome da Tarefa *</label>
              <input id="task-name" type="text" formControlName="name" placeholder="Ex: Caldo de Legumes" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label for="task-date" class="text-sm font-medium text-stone-700">Data Alvo</label>
              <input id="task-date" type="date" formControlName="due_date" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5 lg:col-span-3">
              <label for="task-description" class="text-sm font-medium text-stone-700">Descrição / Instruções</label>
              <input id="task-description" type="text" formControlName="description" placeholder="Ex: Fazer 10 litros para o serviço da noite" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            @if (canManageTasks()) {
              <div class="space-y-1.5">
                <label for="task-team" class="text-sm font-medium text-stone-700">Praça (Equipe)</label>
                <select id="task-team" formControlName="team_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="">Nenhuma praça (Geral)</option>
                  @for (team of teamService.teams(); track team.id) {
                    <option [value]="team.id">{{ team.name }}</option>
                  }
                </select>
              </div>
              
              <div class="space-y-1.5">
                <label for="task-assignee" class="text-sm font-medium text-stone-700">Atribuir para (Opcional)</label>
                <select id="task-assignee" formControlName="assigned_to" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="">Qualquer pessoa da praça</option>
                  @for (member of filteredMembers(); track member.id) {
                    <option [value]="member.id">{{ member.name }}</option>
                  }
                </select>
              </div>
            }

            <!-- Fichas Técnicas Integradas -->
            <div class="space-y-1.5">
              <label for="task-recipe" class="text-sm font-medium text-stone-700">Ficha Técnica Origem</label>
              <select id="task-recipe" formControlName="recipe_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="">Nenhuma receita base</option>
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

            <div class="lg:col-span-3 flex justify-end mt-2">
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
      @if (canManageTasks()) {
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
        <div class="p-4 md:p-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50">
          <div class="flex items-center gap-4">
            <h2 class="text-lg font-bold text-stone-900 leading-none">Prep List</h2>
            <div class="relative">
              <input type="date" [ngModel]="activeDate()" (ngModelChange)="filterByDate($event)" class="bg-white border border-stone-200 text-stone-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full px-3 py-1.5 font-medium shadow-sm cursor-pointer">
            </div>
          </div>
          
          <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm w-full md:w-auto mt-2 md:mt-0">
            <div class="w-full md:w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-500" [style.width.%]="completionPercentage()"></div>
            </div>
            <span class="text-sm font-bold text-stone-700 whitespace-nowrap">{{ completionPercentage() }}% Concluído</span>
          </div>
        </div>
        
        <div class="p-4 md:p-6 bg-stone-50/50">
          @if (prepTaskService.isLoading() && prepTaskService.tasks().length === 0) {
            <div class="p-12 text-center text-stone-500 flex flex-col items-center">
              <mat-icon class="animate-spin text-emerald-600 text-4xl mb-4">refresh</mat-icon>
              <p class="font-medium">Carregando tarefas de produção...</p>
            </div>
          } @else if (prepTaskService.tasks().length === 0) {
            <div class="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 border-dashed backdrop-blur-sm">
              <mat-icon class="text-4xl mb-3 opacity-50">receipt_long</mat-icon>
              <p class="font-medium pb-2 text-stone-700">Nenhuma tarefa encontrada para esta data.</p>
              @if (canManageTasks()) {
                <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 mt-2 transition-colors inline-flex items-center gap-2 shadow-sm">
                  <mat-icon class="text-sm">add</mat-icon> Criar Tarefa
                </button>
              }
            </div>
          } @else {
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
              @for (task of prepTaskService.tasks(); track task.id) {
                <div class="bg-white rounded-2xl shadow-sm border p-4 sm:p-5 relative overflow-hidden group flex flex-col sm:flex-row gap-4" 
                     [ngClass]="{
                       'border-stone-200': task.status === 'pending',
                       'border-amber-300 bg-amber-50/50': task.status === 'in-progress',
                       'border-emerald-300 bg-emerald-50/70': task.status === 'completed'
                     }">
                  
                  @if (task.status === 'in-progress') {
                    <div class="absolute top-0 left-0 w-full sm:w-2 sm:h-full h-2 bg-amber-500"></div>
                  } @else if (task.status === 'completed') {
                    <div class="absolute top-0 left-0 w-full sm:w-2 sm:h-full h-2 bg-emerald-500"></div>
                  }

                  <div class="flex-1 min-w-0 sm:pl-2 flex flex-col pt-1">
                    <div class="flex justify-between items-start mb-2">
                       <div class="flex flex-wrap gap-2 items-center">
                         @if (task.teams?.name) {
                           <span class="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded border border-stone-200 shrink-0">{{ task.teams?.name }}</span>
                         }
                         @if (task.assigned_to_user?.name) {
                           <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider rounded border border-indigo-200 flex items-center gap-1 shrink-0">
                             <mat-icon class="text-[12px] w-3 h-3">person</mat-icon> {{ task.assigned_to_user?.name }}
                           </span>
                         }
                         @if (task.status === 'in-progress') {
                           <span class="px-2.5 py-1 bg-amber-200 text-amber-900 text-[11px] uppercase font-bold tracking-wider rounded-lg flex items-center gap-1 shrink-0">
                              <mat-icon class="text-[14px] w-3.5 h-3.5 animate-spin">sync</mat-icon> Em Andamento
                            </span>
                         }
                       </div>
                       @if (canManageTasks()) {
                         <button (click)="removeTask(task.id)" class="text-stone-400 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 -mr-2 -mt-2 rounded-full hidden sm:block">
                           <mat-icon class="w-5 h-5 text-[20px]">close</mat-icon>
                         </button>
                       }
                    </div>
                    
                    <h3 class="text-lg font-black text-stone-900 leading-tight mb-2" [class.line-through]="task.status === 'completed'">
                      {{ task.name }}
                    </h3>
                    
                    @if (task.recipe_id && task.target_portions) {
                      <div class="mb-3 inline-flex items-center px-2 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold shrink-0 self-start">
                        <mat-icon class="text-[14px] w-3.5 h-3.5 mr-1">receipt</mat-icon> {{ task.target_portions }} porções
                      </div>
                    }
                    
                    @if (task.description) {
                      <p class="text-sm text-stone-600 mb-3">{{ task.description }}</p>
                    }
                    
                    <div class="mt-auto">
                      @if (task.notes && task.status === 'completed') {
                        <div class="bg-white border border-stone-200 text-stone-700 text-sm p-3 rounded-xl italic flex gap-3 shadow-sm items-start mt-3">
                          <mat-icon class="text-[18px] w-4 h-4 text-emerald-500 shrink-0 mt-0.5">chat</mat-icon>
                          <span>{{ task.notes }}</span>
                        </div>
                      }
                      
                      @if (task.status === 'in-progress') {
                         <div class="mt-3">
                           <label class="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Anotações Relevantes / Feedback (Opcional)</label>
                           <textarea [(ngModel)]="taskNotes[task.id]" rows="2" placeholder="Ex: Rendeu menos do que o normal" class="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-sm shadow-sm resize-none text-stone-700"></textarea>
                         </div>
                      }
                    </div>
                  </div>
                  
                  <div class="sm:w-40 flex flex-col justify-end border-t sm:border-t-0 sm:border-l border-stone-200/50 pt-4 sm:pt-0 sm:pl-4 mt-auto sm:mt-0 shrink-0">
                     @if (canManageTasks() && task.status === 'pending') {
                       <button (click)="removeTask(task.id)" class="text-rose-500 hover:text-rose-700 text-sm font-medium mb-4 text-center sm:hidden transition-colors">
                         Apagar Tarefa
                       </button>
                     }
                  
                    @if (task.status === 'pending') {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 h-12">
                        <mat-icon>play_arrow</mat-icon>
                        Começar
                      </button>
                    } @else if (task.status === 'in-progress') {
                      <button (click)="toggleTaskStatus(task, taskNotes[task.id])" [disabled]="!canEditTasks()" class="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 h-12">
                        <mat-icon>check_circle</mat-icon>
                        Finalizar
                      </button>
                    } @else {
                      <button (click)="toggleTaskStatus(task)" [disabled]="!canEditTasks()" class="w-full py-3 bg-stone-100 text-stone-600 border border-stone-200 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 h-12">
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
  private datePipe = inject(DatePipe);

  activePraca = signal<string>('todas');
  activeDate = signal<string>(this.getTodayStr());
  showForm = signal(false);
  isSubmitting = signal(false);
  taskNotes: Record<string, string> = {};

  taskForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    team_id: [''],
    assigned_to: [''],
    due_date: [this.getTodayStr()],
    recipe_id: [''],
    target_portions: [1]
  });

  completionPercentage = computed(() => {
    const tasks = this.prepTaskService.tasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  });

  filteredMembers = computed(() => {
    const teamId = this.taskForm.get('team_id')?.value;
    const allMembers = this.teamService.teamMembers();
    if (!teamId) return allMembers;
    return allMembers.filter(m => m.team_id === teamId);
  });

  ngOnInit() {
    if (this.canManageTasks()) {
      this.teamService.loadTeams();
      this.teamService.loadTeam(); // Carrega todos os membros da cozinha
    }
    const user = this.authService.currentUser();
    const isManager = this.canManageTasks();
    this.prepTaskService.loadTasks(isManager ? undefined : user?.team_id, this.activeDate());
    this.recipeService.loadRecipes();

    this.taskForm.get('team_id')?.valueChanges.subscribe(() => {
       this.taskForm.patchValue({ assigned_to: '' });
    });
  }
  
  getTodayStr(): string {
     const d = new Date();
     return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
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
       this.taskForm.reset({ 
         team_id: this.activePraca() === 'todas' ? '' : this.activePraca(), 
         recipe_id: '', 
         target_portions: 1,
         due_date: this.activeDate(),
         assigned_to: ''
       });
    } else {
       this.taskForm.patchValue({
          team_id: this.activePraca() === 'todas' ? '' : this.activePraca(),
          due_date: this.activeDate()
       });
    }
  }

  filterByTeam(teamId: string) {
    this.activePraca.set(teamId);
    this.prepTaskService.loadTasks(teamId, this.activeDate());
  }
  
  filterByDate(dateStr: string) {
    if (!dateStr) return;
    this.activeDate.set(dateStr);
    const user = this.authService.currentUser();
    const teamIdStr = this.activePraca() === 'todas' && !this.canManageTasks() ? user?.team_id : this.activePraca();
    this.prepTaskService.loadTasks(teamIdStr, this.activeDate());
  }

  async toggleTaskStatus(task: PrepTask, notes?: string) {
    const nextStatus: Record<PrepTask['status'], PrepTask['status']> = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending'
    };
    
    let updatedNotes = notes;
    if (task.status !== 'in-progress') {
       updatedNotes = task.notes; // Keep existing notes if changing state back to pending or leaving as is
    }

    await this.prepTaskService.updateTask({
      id: task.id,
      status: nextStatus[task.status],
      notes: updatedNotes !== undefined ? updatedNotes : task.notes
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
        assigned_to: formValue.assigned_to || undefined,
        due_date: formValue.due_date || this.activeDate(),
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
    const dateStr = this.datePipe.transform(this.activeDate(), 'dd/MM/yyyy') || this.activeDate();
    const data = this.prepTaskService.tasks().map((task: PrepTask) => ({
      tarefa: task.name,
      descricao: task.description || '',
      responsavel: task.assigned_to_user?.name || 'Não Atribuída',
      praca: task.teams?.name || 'Geral',
      status: task.status === 'completed' ? 'Concluído' : (task.status === 'in-progress' ? 'Em Progresso' : 'Pendente'),
      obs: task.notes || ''
    }));

    const headers = [
      { key: 'tarefa', label: 'Tarefa' },
      { key: 'descricao', label: 'Descrição' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'praca', label: 'Praça' },
      { key: 'status', label: 'Status' },
      { key: 'obs', label: 'Obs/Anotações' }
    ];

    this.exportService.exportToCsv(`Relatorio_Producao_${dateStr.replace(/\//g, '')}`, data, headers);
  }
}
