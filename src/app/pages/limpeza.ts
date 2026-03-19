import { ChangeDetectionStrategy, Component, signal, inject, OnInit, computed } from '@angular/core';
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
            (click)="activeTab.set('checklist')"
            [class.border-stone-900]="activeTab() === 'checklist'"
            [class.text-stone-900]="activeTab() === 'checklist'"
            [class.border-transparent]="activeTab() !== 'checklist'"
            [class.text-stone-500]="activeTab() !== 'checklist'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Checklist Diário
          </button>
          <button 
            (click)="activeTab.set('termometria')"
            [class.border-stone-900]="activeTab() === 'termometria'"
            [class.text-stone-900]="activeTab() === 'termometria'"
            [class.border-transparent]="activeTab() !== 'termometria'"
            [class.text-stone-500]="activeTab() !== 'termometria'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Termometria (Equipamentos)
          </button>
          <button 
            (click)="activeTab.set('fechamento')"
            [class.border-stone-900]="activeTab() === 'fechamento'"
            [class.text-stone-900]="activeTab() === 'fechamento'"
            [class.border-transparent]="activeTab() !== 'fechamento'"
            [class.text-stone-500]="activeTab() !== 'fechamento'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Fechamento de Plantão (Chef)
          </button>
        </nav>
      </div>

      <!-- New Task Form -->
      @if (showNewTaskForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-stone-900">
              @if (activeTab() === 'checklist') { Novo Item de Checklist Diário }
              @if (activeTab() === 'termometria') { Novo Equipamento (Termometria) }
              @if (activeTab() === 'fechamento') { Nova Tarefa de Fechamento de Plantão }
            </h2>
            <button (click)="showNewTaskForm.set(false)" class="text-stone-400 hover:text-stone-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div [class.md:col-span-2]="activeTab() !== 'termometria'">
                <label class="block text-sm font-medium text-stone-700 mb-1">
                  @if (activeTab() === 'termometria') { Nome do Equipamento }
                  @else { Título da Tarefa }
                </label>
                <input type="text" [(ngModel)]="newTask.title" name="title" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
              </div>
              
              @if (activeTab() === 'termometria') {
                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">Meta (Ex: 0°C a 4°C)</label>
                  <input type="text" [(ngModel)]="newTask.target_value" name="target_value" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
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
      <div class="mt-6">
        @if (cleaningService.loading() && !showNewTaskForm()) {
          <div class="flex justify-center p-12">
            <mat-icon class="animate-spin text-stone-400 text-4xl">autorenew</mat-icon>
          </div>
        } @else {
          @if (activeTab() === 'checklist') {
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h2 class="font-bold text-stone-900">Checklists</h2>
                <div class="text-sm font-medium text-stone-500">
                  {{ completedChecklists() }}/{{ checklists().length }} Concluído
                </div>
              </div>
              
              <div class="divide-y divide-stone-100">
                @if (checklists().length === 0) {
                  <div class="p-8 text-center text-stone-500">
                    Nenhum checklist cadastrado.
                  </div>
                }
                @for (task of checklists(); track task.id) {
                  <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors group">
                    <button 
                      (click)="toggleTaskStatus(task)"
                      [class.bg-emerald-500]="task.status === 'completed'"
                      [class.border-emerald-500]="task.status === 'completed'"
                      [class.border-stone-300]="task.status !== 'completed'"
                      class="mt-1 w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors" 
                      aria-label="Marcar como concluído">
                      @if (task.status === 'completed') {
                        <mat-icon class="text-white text-[16px] w-4 h-4">check</mat-icon>
                      }
                    </button>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-base font-bold text-stone-900" [class.line-through]="task.status === 'completed'" [class.text-stone-400]="task.status === 'completed'">{{ task.title }}</h3>
                      @if (task.description) {
                        <p class="text-sm text-stone-500 mt-1">{{ task.description }}</p>
                      }
                    </div>
                    @if (canManageTasks()) {
                      <button (click)="deleteTask(task)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @if (activeTab() === 'termometria') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @if (termometria().length === 0) {
                <div class="col-span-full p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
                  Nenhum equipamento cadastrado.
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
                      <div class="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                        <input 
                          type="text" 
                          [ngModel]="task.value" 
                          (blur)="updateValue(task, $any($event.target).value)"
                          (keyup.enter)="updateValue(task, $any($event.target).value)"
                          class="w-16 px-2 py-1 text-right font-bold text-stone-900 focus:outline-none" 
                          placeholder="--">
                        <span class="px-2 py-1 bg-stone-50 text-stone-500 font-medium border-l border-stone-200">°C</span>
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
                </div>
              }
            </div>
          }

          @if (activeTab() === 'fechamento') {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Checklist de Auditoria -->
              <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div class="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <div>
                    <h2 class="font-bold text-stone-900">Auditoria de Fechamento</h2>
                    <p class="text-sm text-stone-500">Verificação final detalhada do Chef de Turno</p>
                  </div>
                  <span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wide">Em Andamento</span>
                </div>
                
                <div class="divide-y divide-stone-100">
                  @if (fechamento().length === 0) {
                    <div class="p-8 text-center text-stone-500">
                      Nenhuma tarefa de fechamento cadastrada.
                    </div>
                  }
                  @for (task of fechamento(); track task.id) {
                    <div class="p-4 hover:bg-stone-50 transition-colors group">
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <h3 class="text-base font-bold text-stone-900">{{ task.title }}</h3>
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
                        <div class="flex items-center gap-2 shrink-0">
                          <button 
                            (click)="setStatus(task, 'conforme')"
                            [class.bg-emerald-100]="task.status === 'conforme'"
                            [class.text-emerald-800]="task.status === 'conforme'"
                            [class.border-emerald-200]="task.status === 'conforme'"
                            [class.bg-white]="task.status !== 'conforme'"
                            [class.text-stone-500]="task.status !== 'conforme'"
                            [class.border-stone-200]="task.status !== 'conforme'"
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
                        </div>
                      </div>
                      
                      @if (task.status === 'nao_conforme') {
                        <div class="mt-3 pl-0 sm:pl-4 border-l-2 border-rose-200">
                          <label [for]="'reason-' + task.id" class="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">Motivo da Não Conformidade</label>
                          <textarea 
                            [id]="'reason-' + task.id"
                            [ngModel]="task.reason"
                            (blur)="updateReason(task, $any($event.target).value)"
                            class="w-full p-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none" 
                            rows="2" 
                            placeholder="Ex: Faltou produto de limpeza, equipamento quebrado, equipe saiu mais cedo..."></textarea>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Análise e Assinatura -->
              <div class="space-y-6">
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                  <h3 class="text-lg font-bold text-stone-900 mb-4">Análise Geral do Plantão</h3>
                  <textarea class="w-full h-32 p-3 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" placeholder="Registre ocorrências gerais, quebras de equipamento, faltas ou observações sobre o serviço de hoje..." aria-label="Análise do plantão"></textarea>
                  
                  <div class="mt-6 pt-6 border-t border-stone-100">
                    <button class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                      <mat-icon>verified</mat-icon>
                      Assinar e Encerrar Plantão
                    </button>
                  </div>
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

  activeTab = signal<'checklist' | 'termometria' | 'fechamento'>('fechamento');
  showNewTaskForm = signal(false);

  newTask: Partial<CleaningTask> = {
    title: '',
    category: 'fechamento',
    description: '',
    target_value: ''
  };

  checklists = computed(() => this.cleaningService.tasks().filter(t => t.category === 'checklist'));
  termometria = computed(() => this.cleaningService.tasks().filter(t => t.category === 'termometria'));
  fechamento = computed(() => this.cleaningService.tasks().filter(t => t.category === 'fechamento'));

  completedChecklists = computed(() => this.checklists().filter(t => t.status === 'completed').length);

  ngOnInit() {
    this.cleaningService.loadTasks();
  }

  canManageTasks() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'chef';
  }

  async onSubmit() {
    this.newTask.category = this.activeTab();
    if (!this.newTask.title || !this.newTask.category) return;
    
    try {
      await this.cleaningService.addTask(this.newTask);
      this.showNewTaskForm.set(false);
      this.newTask = {
        title: '',
        category: this.activeTab(),
        description: '',
        target_value: ''
      };
    } catch (error) {
      // Error is handled by service
    }
  }

  async toggleTaskStatus(task: CleaningTask) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await this.cleaningService.updateTaskStatus(task.id, task.category, newStatus);
  }

  async setStatus(task: CleaningTask, status: 'conforme' | 'nao_conforme') {
    await this.cleaningService.updateTaskStatus(task.id, task.category, status);
  }

  async updateReason(task: CleaningTask, reason: string) {
    await this.cleaningService.updateTaskStatus(task.id, task.category, 'nao_conforme', reason);
  }

  async updateValue(task: CleaningTask, value: string) {
    if (task.value === value) return;
    await this.cleaningService.updateTaskStatus(task.id, task.category, task.status, undefined, value);
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
      t.status === 'completed' ? 'Concluído' : 'Pendente',
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
    
    doc.text('Fechamento de Plantão', 14, finalY2 + 15);
    
    const fechamentoData = this.fechamento().map(t => [
      t.title,
      t.status === 'conforme' ? 'Conforme' : (t.status === 'nao_conforme' ? 'Não Conforme' : 'Pendente'),
      t.reason || '-'
    ]);
    
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Tarefa', 'Status', 'Motivo']],
      body: fechamentoData,
    });
    
    doc.save(`relatorio-limpeza-${date.replace(/\//g, '-')}.pdf`);
  }
}

