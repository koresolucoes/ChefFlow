import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { PrepTaskService, PrepTask } from '../services/prep-task.service';
import { TeamService } from '../services/team.service';
import { AuthService } from '../services/auth.service';
import { EquipmentService, Equipment } from '../services/equipment.service';
import { ChecklistService, ChecklistItem } from '../services/checklist.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Produção (Mise en Place)</h1>
          <p class="text-stone-500 mt-1">Prep list inteligente e controle de qualidade.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="generateReport()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium hover:bg-stone-200 transition-colors flex items-center gap-2">
            <mat-icon>picture_as_pdf</mat-icon>
            Relatório PDF
          </button>
          @if (canManageTasks()) {
            <button (click)="showRegistrationForm.set(!showRegistrationForm())" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>{{ showRegistrationForm() ? 'close' : 'settings' }}</mat-icon>
              {{ showRegistrationForm() ? 'Fechar Config' : 'Configurar Itens' }}
            </button>
          }
        </div>
      </header>

      <!-- Tabs -->
      <div class="border-b border-stone-200">
        <nav class="-mb-px flex space-x-8">
          <button 
            (click)="activeTab.set('prep')"
            [class.border-stone-900]="activeTab() === 'prep'"
            [class.text-stone-900]="activeTab() === 'prep'"
            [class.border-transparent]="activeTab() !== 'prep'"
            [class.text-stone-500]="activeTab() !== 'prep'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Prep List
          </button>
          <button 
            (click)="activeTab.set('checklists')"
            [class.border-stone-900]="activeTab() === 'checklists'"
            [class.text-stone-900]="activeTab() === 'checklists'"
            [class.border-transparent]="activeTab() !== 'checklists'"
            [class.text-stone-500]="activeTab() !== 'checklists'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Checklists
          </button>
          <button 
            (click)="activeTab.set('termometria')"
            [class.border-stone-900]="activeTab() === 'termometria'"
            [class.text-stone-900]="activeTab() === 'termometria'"
            [class.border-transparent]="activeTab() !== 'termometria'"
            [class.text-stone-500]="activeTab() !== 'termometria'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Termometria
          </button>
          <button 
            (click)="activeTab.set('historico')"
            [class.border-stone-900]="activeTab() === 'historico'"
            [class.text-stone-900]="activeTab() === 'historico'"
            [class.border-transparent]="activeTab() !== 'historico'"
            [class.text-stone-500]="activeTab() !== 'historico'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Histórico
          </button>
        </nav>
      </div>

      <!-- Registration Form -->
      @if (showRegistrationForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Prep Task -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-emerald-500">add_task</mat-icon>
                Nova Tarefa de Prep
              </h3>
              <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-3">
                <input type="text" formControlName="name" placeholder="Nome da Tarefa" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <select formControlName="team_id" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                  <option value="">Nenhuma praça (Geral)</option>
                  @for (team of teamService.teams(); track team.id) {
                    <option [value]="team.id">{{ team.name }}</option>
                  }
                </select>
                <input type="text" formControlName="description" placeholder="Descrição" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <button type="submit" [disabled]="taskForm.invalid || isSubmitting()" class="w-full py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors">
                  Salvar Tarefa
                </button>
              </form>
            </div>

            <!-- Equipment -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-blue-500">ac_unit</mat-icon>
                Novo Equipamento
              </h3>
              <form (ngSubmit)="addEquipment()" class="space-y-3">
                <input type="text" [(ngModel)]="newEquipment.name" name="eqName" placeholder="Nome (Ex: Forno 01)" required class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <div class="grid grid-cols-2 gap-2">
                  <input type="number" [(ngModel)]="newEquipment.target_min" name="eqMin" placeholder="Mín °C" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                  <input type="number" [(ngModel)]="newEquipment.target_max" name="eqMax" placeholder="Máx °C" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                </div>
                <button type="submit" class="w-full py-2 bg-stone-900 text-white rounded-lg font-medium">Adicionar Equipamento</button>
              </form>
              <div class="max-h-32 overflow-y-auto space-y-1">
                @for (eq of equipmentService.equipment(); track eq.id) {
                  <div class="flex justify-between items-center p-2 bg-stone-50 rounded text-xs">
                    <span>{{ eq.name }}</span>
                    <button (click)="removeEquipment(eq.id)" class="text-rose-500"><mat-icon class="text-sm">delete</mat-icon></button>
                  </div>
                }
              </div>
            </div>

            <!-- Checklist -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-amber-500">checklist</mat-icon>
                Novo Item de Checklist
              </h3>
              <form (ngSubmit)="addChecklistItem()" class="space-y-3">
                <input type="text" [(ngModel)]="newChecklistItem.title" name="itemTitle" placeholder="Título da Tarefa" required class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <select [(ngModel)]="newChecklistItem.category" name="itemCat" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                  <option value="producao">Produção Geral</option>
                  <option value="abertura">Abertura Cozinha</option>
                  <option value="fechamento">Fechamento Cozinha</option>
                </select>
                <button type="submit" class="w-full py-2 bg-stone-900 text-white rounded-lg font-medium">Adicionar Item</button>
              </form>
              <div class="max-h-32 overflow-y-auto space-y-1">
                @for (item of checklistService.items(); track item.id) {
                  <div class="flex justify-between items-center p-2 bg-stone-50 rounded text-xs">
                    <span>{{ item.title }}</span>
                    <button (click)="removeChecklistItem(item.id)" class="text-rose-500"><mat-icon class="text-sm">delete</mat-icon></button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content -->
      <div class="mt-6">
        @if (prepTaskService.isLoading() || equipmentService.loading() || checklistService.loading()) {
          <div class="flex flex-col items-center justify-center p-24 space-y-4">
            <mat-icon class="animate-spin text-stone-400 text-5xl">autorenew</mat-icon>
            <p class="text-stone-500">Sincronizando dados...</p>
          </div>
        } @else {
          <!-- Prep List Tab -->
          @if (activeTab() === 'prep') {
            <div class="space-y-6">
              <div class="flex gap-2 overflow-x-auto pb-2">
                <button (click)="filterByTeam('todas')" [class.bg-stone-900]="activePraca() === 'todas'" [class.text-white]="activePraca() === 'todas'" class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">Todas as Praças</button>
                @for (team of teamService.teams(); track team.id) {
                  <button (click)="filterByTeam(team.id)" [class.bg-stone-900]="activePraca() === team.id" [class.text-white]="activePraca() === team.id" class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">{{ team.name }}</button>
                }
              </div>

              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <h2 class="font-bold text-stone-900">Prep List de Hoje</h2>
                  <div class="text-sm font-medium text-stone-500">{{ completionPercentage() }}% Concluído</div>
                </div>
                <div class="divide-y divide-stone-100">
                  @for (task of prepTaskService.tasks(); track task.id) {
                    <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors group" [ngClass]="{'bg-amber-50/30': task.status === 'in-progress'}">
                      <button (click)="toggleTaskStatus(task)" class="mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                        [ngClass]="{'border-emerald-500 text-emerald-500 bg-emerald-50': task.status === 'completed', 'border-amber-500': task.status === 'in-progress', 'border-stone-300': task.status === 'pending'}">
                        @if (task.status === 'completed') { <mat-icon class="text-[16px] w-4 h-4">check</mat-icon> }
                        @else if (task.status === 'in-progress') { <div class="w-2 h-2 bg-amber-500 rounded-full"></div> }
                      </button>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h3 class="text-base font-bold text-stone-900" [class.line-through]="task.status === 'completed'" [class.opacity-50]="task.status === 'completed'">{{ task.name }}</h3>
                          @if (task.teams?.name) { <span class="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded">{{ task.teams?.name }}</span> }
                        </div>
                        @if (task.description) { <p class="text-sm text-stone-500 mt-1">{{ task.description }}</p> }
                      </div>
                      @if (canManageTasks()) {
                        <button (click)="removeTask(task.id)" class="p-2 text-stone-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><mat-icon>delete_outline</mat-icon></button>
                      }
                    </div>
                  }
                  @if (prepTaskService.tasks().length === 0) {
                    <div class="p-12 text-center text-stone-400 italic">Nenhuma tarefa para esta praça.</div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Checklists Tab -->
          @if (activeTab() === 'checklists') {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 space-y-6">
                @for (cat of ['abertura', 'producao', 'fechamento']; track cat) {
                  <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div class="p-4 border-b border-stone-100 bg-stone-50">
                      <h2 class="font-bold text-stone-900 uppercase tracking-wider text-xs">{{ cat }}</h2>
                    </div>
                    <div class="divide-y divide-stone-100">
                      @for (item of filterChecklistItems(cat); track item.id) {
                        <div class="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                          <span class="font-medium text-stone-900">{{ item.title }}</span>
                          <div class="flex gap-2">
                            <button (click)="recordChecklist(item.id, 'completed')" [disabled]="isItemCompletedToday(item.id)" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30"><mat-icon>check_circle</mat-icon></button>
                            <button (click)="recordChecklist(item.id, 'nao_conforme')" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><mat-icon>cancel</mat-icon></button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
              <div class="bg-stone-900 text-white rounded-2xl p-6 h-fit">
                <h3 class="font-bold text-lg mb-4">Conformidade de Cozinha</h3>
                <div class="space-y-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-stone-400">Progresso</span>
                    <span class="text-emerald-400">{{ checklistProgress() }}%</span>
                  </div>
                  <div class="w-full bg-white/10 rounded-full h-2">
                    <div class="bg-emerald-500 h-2 rounded-full transition-all" [style.width.%]="checklistProgress()"></div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Termometria Tab -->
          @if (activeTab() === 'termometria') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (eq of equipmentService.equipment(); track eq.id) {
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
                  <div class="flex justify-between items-start">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><mat-icon>ac_unit</mat-icon></div>
                    <div class="text-right">
                      <span class="text-[10px] font-bold text-stone-400 uppercase">Meta</span>
                      <p class="text-sm font-bold text-stone-900">{{ eq.target_min }}°C / {{ eq.target_max }}°C</p>
                    </div>
                  </div>
                  <h3 class="font-bold text-stone-900">{{ eq.name }}</h3>
                  <div class="flex gap-2">
                    <input #tempInput type="number" step="0.1" placeholder="°C" class="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm font-bold">
                    <button (click)="recordTemperature(eq, tempInput.value); tempInput.value = ''" class="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold">Salvar</button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Histórico Tab -->
          @if (activeTab() === 'historico') {
            <div class="space-y-6">
              <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div class="p-4 border-b border-stone-100 bg-stone-50 font-bold text-stone-900">Últimas Leituras</div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th class="px-6 py-4">Data</th>
                        <th class="px-6 py-4">Equipamento</th>
                        <th class="px-6 py-4">Valor</th>
                        <th class="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                      @for (r of equipmentService.readings(); track r.id) {
                        <tr>
                          <td class="px-6 py-4 text-stone-500">{{ r.created_at | date:'dd/MM HH:mm' }}</td>
                          <td class="px-6 py-4 font-bold">{{ r.equipment?.name }}</td>
                          <td class="px-6 py-4">{{ r.value }}°C</td>
                          <td class="px-6 py-4">
                            <span [class.text-emerald-600]="r.status === 'conforme'" [class.text-rose-600]="r.status === 'nao_conforme'" class="font-bold uppercase text-[10px]">{{ r.status }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-in { animation: animate-in 0.3s ease-out; }
    @keyframes animate-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProducaoComponent implements OnInit {
  prepTaskService = inject(PrepTaskService);
  teamService = inject(TeamService);
  authService = inject(AuthService);
  equipmentService = inject(EquipmentService);
  checklistService = inject(ChecklistService);
  private fb = inject(FormBuilder);

  activeTab = signal<'prep' | 'checklists' | 'termometria' | 'historico'>('prep');
  activePraca = signal<string>('todas');
  showRegistrationForm = signal(false);
  isSubmitting = signal(false);

  newEquipment: Partial<Equipment> = { name: '', target_min: 0, target_max: 0 };
  newChecklistItem: Partial<ChecklistItem> = { title: '', category: 'producao' };

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

  checklistProgress = computed(() => {
    const items = this.checklistService.items();
    if (items.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const completedCount = new Set(
      this.checklistService.records()
        .filter(r => r.created_at.startsWith(today))
        .map(r => r.item_id)
    ).size;
    return Math.round((completedCount / items.length) * 100);
  });

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    await Promise.all([
      this.teamService.loadTeams(),
      this.prepTaskService.loadTasks(),
      this.equipmentService.loadEquipment(undefined, 'producao'),
      this.equipmentService.loadReadings(),
      this.checklistService.loadItems('producao'),
      this.checklistService.loadRecords()
    ]);
  }

  canManageTasks(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin' || user?.role === 'chef';
  }

  toggleForm() {
    this.showRegistrationForm.update(v => !v);
  }

  filterByTeam(teamId: string) {
    this.activePraca.set(teamId);
    this.prepTaskService.loadTasks(teamId);
  }

  filterChecklistItems(category: string) {
    return this.checklistService.items().filter((i: ChecklistItem) => i.category === category);
  }

  isItemCompletedToday(itemId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.checklistService.records().some((r: { item_id: string; created_at: string }) => r.item_id === itemId && r.created_at.startsWith(today));
  }

  async toggleTaskStatus(task: PrepTask) {
    const nextStatus: Record<PrepTask['status'], PrepTask['status']> = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending'
    };
    await this.prepTaskService.updateTask({ id: task.id, status: nextStatus[task.status] });
  }

  async onSubmit() {
    if (this.taskForm.valid) {
      this.isSubmitting.set(true);
      const success = await this.prepTaskService.addTask({
        ...this.taskForm.value as { name: string; team_id: string },
        status: 'pending'
      });
      this.isSubmitting.set(false);
      if (success) {
        this.taskForm.reset({ team_id: '' });
      }
    }
  }

  async addEquipment() {
    if (!this.newEquipment.name) return;
    await this.equipmentService.addEquipment({ ...this.newEquipment, category: 'producao' });
    this.newEquipment = { name: '', target_min: 0, target_max: 0 };
  }

  async removeEquipment(id: string) {
    if (confirm('Remover equipamento?')) await this.equipmentService.removeEquipment(id);
  }

  async addChecklistItem() {
    if (!this.newChecklistItem.title) return;
    await this.checklistService.addItem({ ...this.newChecklistItem, category: this.newChecklistItem.category || 'producao' });
    this.newChecklistItem = { title: '', category: 'producao' };
  }

  async removeChecklistItem(id: string) {
    if (confirm('Remover item?')) await this.checklistService.removeItem(id);
  }

  async recordTemperature(eq: Equipment, valueStr: string) {
    const value = parseFloat(valueStr);
    if (isNaN(value)) return;
    const status = (value >= (eq.target_min ?? -99) && value <= (eq.target_max ?? 99)) ? 'conforme' : 'nao_conforme';
    await this.equipmentService.addReading({ equipment_id: eq.id, value, status });
  }

  async recordChecklist(itemId: string, status: 'completed' | 'nao_conforme') {
    await this.checklistService.addRecord({ item_id: itemId, status });
  }

  async removeTask(id: string) {
    if (confirm('Remover tarefa?')) await this.prepTaskService.removeTask(id);
  }

  generateReport() {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(20);
    doc.text('Relatório de Produção e Segurança', 14, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    doc.setFontSize(14);
    doc.text('Prep List Status', 14, 40);
    const prepData = this.prepTaskService.tasks().map((t: { name: string; status: string; teams?: { name: string } }) => [t.name, t.status, t.teams?.name || 'Geral']);
    autoTable(doc, { startY: 45, head: [['Tarefa', 'Status', 'Praça']], body: prepData });

    const docWithTable = doc as unknown as { lastAutoTable: { finalY: number } };
    doc.text('Termometria de Produção', 14, docWithTable.lastAutoTable.finalY + 15);
    const tempData = this.equipmentService.readings().map((r: { equipment?: { name: string }; value: number; status: string; created_at: string }) => [r.equipment?.name || 'N/A', `${r.value}°C`, r.status.toUpperCase(), new Date(r.created_at).toLocaleString('pt-BR')]);
    autoTable(doc, { startY: docWithTable.lastAutoTable.finalY + 20, head: [['Equipamento', 'Valor', 'Status', 'Data/Hora']], body: tempData });

    doc.save(`relatorio-producao-${today.replace(/\//g, '-')}.pdf`);
  }
}
