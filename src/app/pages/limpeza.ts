import { ChangeDetectionStrategy, Component, signal, inject, OnInit, computed, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleaningService, CleaningTask } from '../services/cleaning.service';
import { AuthService } from '../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-limpeza',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Higiene & Limpeza</h1>
          <p class="text-stone-500 mt-1">Checklists sanitários e termometria.</p>
        </div>
        <div class="flex gap-3">
          <div class="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 rounded-lg px-3 py-2 font-medium">
            <mat-icon class="text-stone-500">calendar_today</mat-icon>
            <input type="date" [ngModel]="selectedDate()" (ngModelChange)="onDateChange($event)" class="border-none focus:ring-0 text-stone-700 font-medium bg-transparent p-0 outline-none">
          </div>
          <button (click)="generateReport()" class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
            <mat-icon>picture_as_pdf</mat-icon>
            Gerar Relatório
          </button>
          @if (canManageTasks()) {
            <button (click)="showNewTaskForm.set(true)" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>add</mat-icon>
              Novo Registro
            </button>
          }
        </div>
      </header>

      @if (cleaningService.error()) {
        <div class="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3">
          <mat-icon>error_outline</mat-icon>
          <p>{{ cleaningService.error() }}</p>
        </div>
      }

      <!-- Tabs -->
      <div class="border-b border-stone-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button 
            (click)="activeTab.set('abertura')"
            [class.border-stone-900]="activeTab() === 'abertura'"
            [class.text-stone-900]="activeTab() === 'abertura'"
            [class.border-transparent]="activeTab() !== 'abertura'"
            [class.text-stone-500]="activeTab() !== 'abertura'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Abertura
          </button>
          <button 
            (click)="activeTab.set('operacao')"
            [class.border-stone-900]="activeTab() === 'operacao'"
            [class.text-stone-900]="activeTab() === 'operacao'"
            [class.border-transparent]="activeTab() !== 'operacao'"
            [class.text-stone-500]="activeTab() !== 'operacao'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Operação
          </button>
          <button 
            (click)="activeTab.set('fechamento')"
            [class.border-stone-900]="activeTab() === 'fechamento'"
            [class.text-stone-900]="activeTab() === 'fechamento'"
            [class.border-transparent]="activeTab() !== 'fechamento'"
            [class.text-stone-500]="activeTab() !== 'fechamento'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Fechamento
          </button>
        </nav>
      </div>

      <!-- New Task Form -->
      @if (showNewTaskForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-stone-900">
              Novo Registro
            </h2>
            <button (click)="showNewTaskForm.set(false)" class="text-stone-400 hover:text-stone-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-stone-700 mb-1">
                  Título da Tarefa / Equipamento
                </label>
                <input type="text" [(ngModel)]="newTask.title" name="title" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                <select [(ngModel)]="newTask.category" name="category" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white">
                  <option value="checklist">Checklist</option>
                  <option value="termometria">Termometria</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-stone-700 mb-1">Momentos do Plantão</label>
                <div class="flex gap-4 mt-2">
                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" [checked]="newTaskShiftMoments.includes('abertura')" (change)="toggleShiftMoment('abertura')" class="rounded border-stone-300 text-stone-900 focus:ring-stone-900">
                    Abertura
                  </label>
                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" [checked]="newTaskShiftMoments.includes('operacao')" (change)="toggleShiftMoment('operacao')" class="rounded border-stone-300 text-stone-900 focus:ring-stone-900">
                    Operação
                  </label>
                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" [checked]="newTaskShiftMoments.includes('fechamento')" (change)="toggleShiftMoment('fechamento')" class="rounded border-stone-300 text-stone-900 focus:ring-stone-900">
                    Fechamento
                  </label>
                </div>
              </div>

              @if (newTask.category === 'termometria') {
                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">Temp. Mínima (°C)</label>
                  <input type="number" [(ngModel)]="newTaskMinTemp" name="min_temp" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">Temp. Máxima (°C)</label>
                  <input type="number" [(ngModel)]="newTaskMaxTemp" name="max_temp" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                </div>
              }
            </div>
            
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Descrição (Opcional)</label>
              <textarea [(ngModel)]="newTask.description" name="description" rows="2" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"></textarea>
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" (click)="showNewTaskForm.set(false)" class="px-4 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="cleaningService.loading() || !newTask.title" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2">
                @if (cleaningService.loading()) {
                  <mat-icon class="animate-spin">autorenew</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon>save</mat-icon>
                  Salvar Registro
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Tab Content -->
      <div class="mt-6 space-y-8">
        @if (cleaningService.loading() && !showNewTaskForm()) {
          <div class="flex justify-center p-12">
            <mat-icon class="animate-spin text-stone-400 text-4xl">autorenew</mat-icon>
          </div>
        } @else {
          <!-- Checklist Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 class="font-bold text-stone-900">Checklists de {{ activeTab() | titlecase }}</h2>
              <div class="text-sm font-medium text-stone-500">
                {{ completedChecklists() }}/{{ checklists().length }} Concluído
              </div>
            </div>
            
            <div class="divide-y divide-stone-100">
              @if (checklists().length === 0) {
                <div class="p-8 text-center text-stone-500">
                  Nenhum checklist cadastrado para este momento.
                </div>
              }
              @for (task of checklists(); track task.id) {
                  <div class="p-4 hover:bg-stone-50 transition-colors group">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h3 class="text-base font-bold text-stone-900" [class.text-stone-400]="task.status !== 'pending'">{{ task.title }}</h3>
                          @if (canManageTasks()) {
                            <button (click)="deleteTask(task)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon>
                            </button>
                          }
                        </div>
                        @if (task.description) {
                          <p class="text-sm text-stone-500 mt-1">{{ task.description }}</p>
                        }
                      </div>
                      <div class="flex flex-wrap items-center gap-2 shrink-0">
                        <button 
                          (click)="setStatus(task, 'conforme')"
                          [class.bg-emerald-100]="task.status === 'conforme' || task.status === 'completed'"
                          [class.text-emerald-800]="task.status === 'conforme' || task.status === 'completed'"
                          [class.border-emerald-200]="task.status === 'conforme' || task.status === 'completed'"
                          [class.bg-white]="task.status !== 'conforme' && task.status !== 'completed'"
                          [class.text-stone-500]="task.status !== 'conforme' && task.status !== 'completed'"
                          [class.border-stone-200]="task.status !== 'conforme' && task.status !== 'completed'"
                          class="px-3 py-1.5 border rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">check_circle</mat-icon>
                          Conforme
                        </button>
                        <button 
                          (click)="setStatus(task, 'nao_conforme')"
                          [class.bg-rose-100]="task.status === 'nao_conforme'"
                          [class.text-rose-800]="task.status === 'nao_conforme'"
                          [class.border-rose-200]="task.status === 'nao_conforme'"
                          [class.bg-white]="task.status !== 'nao_conforme'"
                          [class.text-stone-500]="task.status !== 'nao_conforme'"
                          [class.border-stone-200]="task.status !== 'nao_conforme'"
                          class="px-3 py-1.5 border rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors hover:bg-rose-50 hover:text-rose-700">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">cancel</mat-icon>
                          Não Conforme
                        </button>
                        <button 
                          (click)="setStatus(task, 'na')"
                          [class.bg-stone-200]="task.status === 'na'"
                          [class.text-stone-800]="task.status === 'na'"
                          [class.border-stone-300]="task.status === 'na'"
                          [class.bg-white]="task.status !== 'na'"
                          [class.text-stone-500]="task.status !== 'na'"
                          [class.border-stone-200]="task.status !== 'na'"
                          class="px-3 py-1.5 border rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors hover:bg-stone-100 hover:text-stone-700">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">remove_circle_outline</mat-icon>
                          N/A
                        </button>
                      </div>
                    </div>
                    
                    @if (task.status === 'nao_conforme') {
                      <div class="mt-3 pl-0 sm:pl-4 border-l-2 border-rose-200">
                        <label [for]="'reason-chk-' + task.id" class="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">Motivo da Não Conformidade</label>
                        <textarea 
                          [id]="'reason-chk-' + task.id"
                          [ngModel]="task.reason"
                          (blur)="updateReason(task, $any($event.target).value)"
                          class="w-full p-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none" 
                          rows="2" 
                          placeholder="Ex: Falta de material, equipamento com defeito..."></textarea>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

          <!-- Termometria Section -->
          <div>
            <h2 class="text-xl font-bold text-stone-900 mb-4">Termometria de {{ activeTab() | titlecase }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @if (termometria().length === 0) {
                <div class="col-span-full p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
                  Nenhum equipamento cadastrado para este momento.
                </div>
              }
              @for (task of termometria(); track task.id) {
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 relative overflow-hidden group">
                  @if (task.status === 'nao_conforme') {
                    <div class="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                  }
                  <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <mat-icon>ac_unit</mat-icon>
                    </div>
                    <div class="flex items-center gap-2">
                      @if (canManageTasks()) {
                        <button (click)="deleteTask(task)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                      <div class="flex items-center gap-2">
                        @if (editingTaskId() === task.id || !task.value) {
                          <div class="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                            <input 
                              #tempInput
                              type="text" 
                              [value]="task.value || ''" 
                              (keyup.enter)="saveTemperature(task, tempInput.value)"
                              class="w-16 px-2 py-1 text-right font-bold text-stone-900 focus:outline-none" 
                              placeholder="--">
                            <span class="px-2 py-1 bg-stone-50 text-stone-500 font-medium border-l border-stone-200">°C</span>
                          </div>
                          <button (click)="saveTemperature(task, tempInput.value)" class="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Salvar">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">check</mat-icon>
                          </button>
                        } @else {
                          <div class="flex items-center bg-stone-50 border border-stone-200 rounded-lg overflow-hidden px-3 py-1">
                            <span class="font-bold text-stone-900">{{ task.value }}</span>
                            <span class="text-stone-500 ml-1">°C</span>
                          </div>
                          <button (click)="editTemperature(task.id)" class="p-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors" title="Editar">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">edit</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                  <h3 class="text-lg font-bold text-stone-900">{{ task.title }}</h3>
                  @if (task.target_value) {
                    <p class="text-sm text-stone-500 mt-1">Meta: {{ task.target_value }}</p>
                  }
                  <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                    <span class="text-xs text-stone-500">
                      {{ task.updated_at ? ('Última leitura: ' + (task.updated_at | date:'HH:mm')) : 'Sem leitura' }}
                    </span>
                    @if (task.value) {
                      <span 
                        [class.bg-emerald-100]="task.status !== 'nao_conforme'"
                        [class.text-emerald-800]="task.status !== 'nao_conforme'"
                        [class.bg-rose-100]="task.status === 'nao_conforme'"
                        [class.text-rose-800]="task.status === 'nao_conforme'"
                        class="px-2 py-1 text-xs font-bold rounded uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                        (click)="toggleConformity(task)">
                        @if (task.status === 'nao_conforme') {
                          <mat-icon class="text-[14px] w-3.5 h-3.5">warning</mat-icon>
                          Alerta
                        } @else {
                          Normal
                        }
                      </span>
                    }
                  </div>
                  @if (task.status === 'nao_conforme') {
                    <div class="mt-4 pt-4 border-t border-stone-100">
                      <label [for]="'reason-term-' + task.id" class="block text-xs font-bold text-rose-700 mb-1 uppercase tracking-wider">
                        <mat-icon class="text-[14px] w-3.5 h-3.5 inline align-text-bottom">warning</mat-icon>
                        Justificativa / Ação Corretiva
                      </label>
                      <textarea 
                        [id]="'reason-term-' + task.id"
                        [ngModel]="task.reason"
                        (blur)="updateReason(task, $any($event.target).value)"
                        class="w-full p-2.5 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none bg-rose-50" 
                        rows="2" 
                        placeholder="Ex: Termostato ajustado, técnico acionado..."></textarea>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          @if (activeTab() === 'fechamento') {
            <div class="mt-8">
              <!-- Análise e Assinatura -->
              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <h3 class="text-lg font-bold text-stone-900 mb-4">Análise Geral do Plantão</h3>
                <textarea [(ngModel)]="shiftAnalysis" class="w-full h-32 p-3 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" placeholder="Registre ocorrências gerais, quebras de equipamento, faltas ou observações sobre o serviço de hoje..." aria-label="Análise do plantão"></textarea>
                
                <div class="mt-6 pt-6 border-t border-stone-100">
                  <button (click)="encerrarPlantao()" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <mat-icon>verified</mat-icon>
                    Assinar e Encerrar Plantão
                  </button>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LimpezaComponent implements OnInit {
  cleaningService = inject(CleaningService);
  authService = inject(AuthService);

  activeTab = signal<'abertura' | 'operacao' | 'fechamento'>('abertura');
  showNewTaskForm = signal(false);
  shiftAnalysis = signal('');
  selectedDate = signal(new Date().toISOString().split('T')[0]);

  editingTaskId = signal<string | null>(null);

  newTaskMinTemp: number | null = null;
  newTaskMaxTemp: number | null = null;
  newTaskShiftMoments: string[] = ['abertura'];

  newTask: Partial<CleaningTask> = {
    title: '',
    category: 'checklist',
    description: '',
    target_value: ''
  };

  currentTasks = computed(() => this.cleaningService.tasks().filter(t => t.shift_moment === this.activeTab()));
  checklists = computed(() => this.currentTasks().filter(t => t.category === 'checklist'));
  termometria = computed(() => this.currentTasks().filter(t => t.category === 'termometria'));
  shiftAnalysisTask = computed(() => this.cleaningService.tasks().find(t => t.title === 'Análise Geral do Plantão' && t.category === 'fechamento'));

  completedChecklists = computed(() => this.checklists().filter(t => t.status !== 'pending').length);

  constructor() {
    effect(() => {
      const task = this.shiftAnalysisTask();
      if (task && task.reason) {
        this.shiftAnalysis.set(task.reason);
      } else {
        this.shiftAnalysis.set('');
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.cleaningService.loadTasks(undefined, this.selectedDate());
  }

  onDateChange(newDate: string) {
    this.selectedDate.set(newDate);
    this.cleaningService.loadTasks(undefined, newDate);
  }

  toggleShiftMoment(moment: string) {
    const idx = this.newTaskShiftMoments.indexOf(moment);
    if (idx > -1) {
      this.newTaskShiftMoments.splice(idx, 1);
    } else {
      this.newTaskShiftMoments.push(moment);
    }
  }

  canManageTasks() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'chef';
  }

  async onSubmit() {
    if (!this.newTask.title || !this.newTask.category || this.newTaskShiftMoments.length === 0) return;
    
    if (this.newTask.category === 'termometria') {
      if (this.newTaskMinTemp !== null && this.newTaskMaxTemp !== null) {
        this.newTask.target_value = `${this.newTaskMinTemp}°C a ${this.newTaskMaxTemp}°C`;
      } else if (this.newTaskMinTemp !== null) {
        this.newTask.target_value = `> ${this.newTaskMinTemp}°C`;
      } else if (this.newTaskMaxTemp !== null) {
        this.newTask.target_value = `< ${this.newTaskMaxTemp}°C`;
      }
    }

    try {
      await this.cleaningService.addTask({
        ...this.newTask,
        shift_moments: this.newTaskShiftMoments
      });
      this.showNewTaskForm.set(false);
      this.newTaskMinTemp = null;
      this.newTaskMaxTemp = null;
      this.newTaskShiftMoments = [this.activeTab()];
      this.newTask = {
        title: '',
        category: 'checklist',
        description: '',
        target_value: ''
      };
    } catch (error) {
      // Error is handled by service
    }
  }

  async encerrarPlantao() {
    if (confirm('Tem certeza que deseja encerrar o plantão? Isso registrará a análise geral.')) {
      try {
        let task = this.shiftAnalysisTask();
        if (!task) {
          const newTasks = await this.cleaningService.addTask({
            title: 'Análise Geral do Plantão',
            category: 'fechamento',
            description: 'Registro geral do plantão',
            shift_moments: ['fechamento']
          });
          task = newTasks[0];
        }
        
        if (task) {
          await this.cleaningService.updateTaskStatus(task.id, 'fechamento', 'conforme', this.shiftAnalysis(), this.shiftAnalysis());
          this.generateReport();
          alert('Plantão encerrado e relatório gerado com sucesso!');
        }
      } catch (error) {
        alert('Erro ao encerrar plantão. Tente novamente.');
      }
    }
  }

  async setStatus(task: CleaningTask, status: 'conforme' | 'nao_conforme' | 'na') {
    await this.cleaningService.updateTaskStatus(task.id, task.category, status);
  }

  async updateReason(task: CleaningTask, reason: string) {
    await this.cleaningService.updateTaskStatus(task.id, task.category, 'nao_conforme', reason);
  }

  validateTemperature(value: string, target?: string): boolean {
    if (!target || !value) return true;
    
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return true;

    const targetStr = target.toLowerCase().replace('°c', '').trim();
    
    const rangeMatch = targetStr.match(/(-?\d+(?:\.\d+)?)\s*(?:a|até|-)\s*(-?\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return numValue >= min && numValue <= max;
    }

    const maxMatch = targetStr.match(/(?:<|máx|max|abaixo de)\s*(-?\d+(?:\.\d+)?)/);
    if (maxMatch) {
      const max = parseFloat(maxMatch[1]);
      return numValue <= max;
    }

    const minMatch = targetStr.match(/(?:>|mín|min|acima de)\s*(-?\d+(?:\.\d+)?)/);
    if (minMatch) {
      const min = parseFloat(minMatch[1]);
      return numValue >= min;
    }

    const exactMatch = targetStr.match(/^(-?\d+(?:\.\d+)?)$/);
    if (exactMatch) {
      const exact = parseFloat(exactMatch[1]);
      return numValue === exact;
    }

    return true;
  }

  async updateValue(task: CleaningTask, value: string) {
    if (task.value === value) return;
    
    let newStatus = task.status;
    if (task.target_value) {
      const isValid = this.validateTemperature(value, task.target_value);
      newStatus = isValid ? 'conforme' : 'nao_conforme';
    } else {
      newStatus = 'conforme';
    }

    await this.cleaningService.updateTaskStatus(task.id, task.category, newStatus, task.reason, value);
  }

  editTemperature(id: string) {
    this.editingTaskId.set(id);
  }

  async saveTemperature(task: CleaningTask, value: string) {
    await this.updateValue(task, value);
    this.editingTaskId.set(null);
  }

  async toggleConformity(task: CleaningTask) {
    const newStatus = task.status === 'nao_conforme' ? 'conforme' : 'nao_conforme';
    await this.cleaningService.updateTaskStatus(task.id, task.category, newStatus);
  }

  async deleteTask(task: CleaningTask) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await this.cleaningService.removeTask(task.id, task.category);
    }
  }

  generateReport() {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(18);
    doc.text(`Relatório de Higiene e Limpeza - ${date}`, 14, 22);
    
    doc.setFontSize(14);
    doc.text('Checklist Diário', 14, 35);
    
    const checklistData = this.checklists().map(t => [
      t.title,
      t.status === 'conforme' ? 'Conforme' : (t.status === 'nao_conforme' ? 'Não Conforme' : (t.status === 'na' ? 'N/A' : 'Pendente')),
      t.updated_at ? new Date(t.updated_at).toLocaleTimeString('pt-BR') : '-'
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Tarefa', 'Status', 'Horário']],
      body: checklistData,
    });
    
    const finalY1 = (doc as any).lastAutoTable.finalY || 40;
    
    doc.text('Termometria (Equipamentos)', 14, finalY1 + 15);
    
    const termometriaData = this.termometria().map(t => [
      t.title,
      t.target_value || '-',
      t.value ? `${t.value}°C` : '-',
      t.status === 'nao_conforme' ? 'Não Conforme' : 'Normal',
      t.updated_at ? new Date(t.updated_at).toLocaleTimeString('pt-BR') : '-'
    ]);
    
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Equipamento', 'Meta', 'Leitura', 'Status', 'Horário']],
      body: termometriaData,
    });
    
    const finalY2 = (doc as any).lastAutoTable.finalY || finalY1 + 20;
    
    if (this.shiftAnalysis()) {
      doc.text('Análise Geral do Plantão', 14, finalY2 + 15);
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(this.shiftAnalysis(), 180);
      doc.text(splitText, 14, finalY2 + 25);
    }
    
    doc.save(`relatorio-limpeza-${date.replace(/\//g, '-')}.pdf`);
  }
}

