import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentService, Equipment } from '../services/equipment.service';
import { ChecklistService, ChecklistItem } from '../services/checklist.service';
import { AuthService } from '../services/auth.service';
import { jsPDF } from 'jspdf';
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
          <p class="text-stone-500 mt-1">Checklists sanitários e termometria dinâmica.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="generateReport()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium hover:bg-stone-200 transition-colors flex items-center gap-2">
            <mat-icon>picture_as_pdf</mat-icon>
            Relatório PDF
          </button>
          @if (canManage()) {
            <button (click)="showRegistrationForm.set(!showRegistrationForm())" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>{{ showRegistrationForm() ? 'close' : 'settings' }}</mat-icon>
              {{ showRegistrationForm() ? 'Fechar Config' : 'Configurar Itens' }}
            </button>
          }
        </div>
      </header>

      @if (equipmentService.error() || checklistService.error()) {
        <div class="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3">
          <mat-icon>error_outline</mat-icon>
          <p>{{ equipmentService.error() || checklistService.error() }}</p>
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
            Checklists Diários
          </button>
          <button 
            (click)="activeTab.set('termometria')"
            [class.border-stone-900]="activeTab() === 'termometria'"
            [class.text-stone-900]="activeTab() === 'termometria'"
            [class.border-transparent]="activeTab() !== 'termometria'"
            [class.text-stone-500]="activeTab() !== 'termometria'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Termometria
          </button>
          <button 
            (click)="activeTab.set('historico')"
            [class.border-stone-900]="activeTab() === 'historico'"
            [class.text-stone-900]="activeTab() === 'historico'"
            [class.border-transparent]="activeTab() !== 'historico'"
            [class.text-stone-500]="activeTab() !== 'historico'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Histórico de Registros
          </button>
        </nav>
      </div>

      <!-- Registration Form (Admin/Chef only) -->
      @if (showRegistrationForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-stone-900">Configurar Itens do Sistema</h2>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Add Equipment -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-blue-500">ac_unit</mat-icon>
                Novo Equipamento
              </h3>
              <form (ngSubmit)="addEquipment()" class="space-y-3">
                <input type="text" [(ngModel)]="newEquipment.name" name="eqName" placeholder="Nome do Equipamento (Ex: Freezer 01)" required class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <div class="grid grid-cols-2 gap-2">
                  <div class="space-y-1">
                    <label for="eqMin" class="text-[10px] uppercase font-bold text-stone-400">Mín °C</label>
                    <input id="eqMin" type="number" [(ngModel)]="newEquipment.target_min" name="eqMin" placeholder="Mín" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                  </div>
                  <div class="space-y-1">
                    <label for="eqMax" class="text-[10px] uppercase font-bold text-stone-400">Máx °C</label>
                    <input id="eqMax" type="number" [(ngModel)]="newEquipment.target_max" name="eqMax" placeholder="Máx" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                  </div>
                </div>
                <button type="submit" class="w-full py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors">Adicionar Equipamento</button>
              </form>
              
              <div class="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                @for (eq of equipmentService.equipment(); track eq.id) {
                  <div class="flex justify-between items-center p-3 bg-stone-50 rounded-lg text-sm border border-stone-100">
                    <div class="flex flex-col">
                      <span class="font-bold text-stone-900">{{ eq.name }}</span>
                      <span class="text-xs text-stone-500">{{ eq.target_min }}°C a {{ eq.target_max }}°C</span>
                    </div>
                    <button (click)="removeEquipment(eq.id)" class="text-rose-400 hover:text-rose-600 p-1">
                      <mat-icon class="text-sm">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Add Checklist Item -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-emerald-500">checklist</mat-icon>
                Novo Item de Checklist
              </h3>
              <form (ngSubmit)="addChecklistItem()" class="space-y-3">
                <input type="text" [(ngModel)]="newChecklistItem.title" name="itemTitle" placeholder="Título da Tarefa (Ex: Limpeza de Bancada)" required class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <div class="space-y-1">
                  <label for="itemCat" class="text-[10px] uppercase font-bold text-stone-400">Categoria</label>
                  <select id="itemCat" [(ngModel)]="newChecklistItem.category" name="itemCat" required class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                    <option value="abertura">Abertura</option>
                    <option value="limpeza">Limpeza Geral</option>
                    <option value="fechamento">Fechamento</option>
                  </select>
                </div>
                <button type="submit" class="w-full py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors">Adicionar Item</button>
              </form>

              <div class="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                @for (item of checklistService.items(); track item.id) {
                  <div class="flex justify-between items-center p-3 bg-stone-50 rounded-lg text-sm border border-stone-100">
                    <div class="flex flex-col">
                      <span class="font-bold text-stone-900">{{ item.title }}</span>
                      <span class="text-[10px] uppercase text-stone-400 font-bold">{{ item.category }}</span>
                    </div>
                    <button (click)="removeChecklistItem(item.id)" class="text-rose-400 hover:text-rose-600 p-1">
                      <mat-icon class="text-sm">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content -->
      <div class="mt-6">
        @if (equipmentService.loading() || checklistService.loading()) {
          <div class="flex flex-col items-center justify-center p-24 space-y-4">
            <mat-icon class="animate-spin text-stone-400 text-5xl">autorenew</mat-icon>
            <p class="text-stone-500 font-medium">Sincronizando dados...</p>
          </div>
        } @else {
          <!-- Checklist Tab -->
          @if (activeTab() === 'checklist') {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 space-y-6">
                @for (cat of ['abertura', 'limpeza', 'fechamento']; track cat) {
                  <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div class="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                      <h2 class="font-bold text-stone-900 uppercase tracking-wider text-xs flex items-center gap-2">
                        <mat-icon class="text-[16px] w-4 h-4">{{ cat === 'abertura' ? 'wb_sunny' : cat === 'fechamento' ? 'nights_stay' : 'cleaning_services' }}</mat-icon>
                        {{ cat }}
                      </h2>
                    </div>
                    <div class="divide-y divide-stone-100">
                      @for (item of filterItems(cat); track item.id) {
                        <div class="p-4 flex items-center justify-between group hover:bg-stone-50 transition-colors">
                          <div class="flex-1">
                            <h3 class="font-medium text-stone-900">{{ item.title }}</h3>
                            @if (isItemCompletedToday(item.id)) {
                              <span class="text-[10px] text-emerald-600 font-bold uppercase">Concluído hoje</span>
                            }
                          </div>
                          <div class="flex gap-2">
                            <button 
                              (click)="recordChecklist(item.id, 'completed')" 
                              [disabled]="isItemCompletedToday(item.id)"
                              class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30">
                              <mat-icon>check_circle</mat-icon>
                            </button>
                            <button 
                              (click)="recordChecklist(item.id, 'nao_conforme')"
                              class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                              <mat-icon>cancel</mat-icon>
                            </button>
                          </div>
                        </div>
                      }
                      @if (filterItems(cat).length === 0) {
                        <div class="p-8 text-center text-stone-400 text-sm italic">Nenhum item configurado para esta categoria.</div>
                      }
                    </div>
                  </div>
                }
              </div>
              
              <div class="space-y-6">
                <div class="bg-stone-900 text-white rounded-2xl p-6 shadow-xl">
                  <h3 class="font-bold text-lg mb-2">Resumo de Conformidade</h3>
                  <p class="text-stone-400 text-sm mb-6">Acompanhamento em tempo real dos checklists sanitários.</p>
                  
                  <div class="space-y-6">
                    <div class="space-y-2">
                      <div class="flex justify-between text-sm font-bold">
                        <span class="text-stone-400">Progresso Geral</span>
                        <span class="text-emerald-400">{{ todayProgress() }}%</span>
                      </div>
                      <div class="w-full bg-white/10 rounded-full h-3">
                        <div class="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" [style.width.%]="todayProgress()"></div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <span class="text-[10px] uppercase font-bold text-stone-500">Itens Totais</span>
                        <p class="text-2xl font-bold">{{ checklistService.items().length }}</p>
                      </div>
                      <div>
                        <span class="text-[10px] uppercase font-bold text-stone-500">Concluídos</span>
                        <p class="text-2xl font-bold text-emerald-400">{{ completedTodayCount() }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
                  <h4 class="font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <mat-icon class="text-amber-500">info</mat-icon>
                    Instruções
                  </h4>
                  <ul class="text-xs text-stone-500 space-y-3 list-disc pl-4">
                    <li>Registre as temperaturas pelo menos 2x por turno.</li>
                    <li>Qualquer valor fora da meta deve ser registrado como "Não Conforme".</li>
                    <li>Checklists devem ser finalizados antes da troca de turno.</li>
                  </ul>
                </div>
              </div>
            </div>
          }

          <!-- Termometria Tab -->
          @if (activeTab() === 'termometria') {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (eq of equipmentService.equipment(); track eq.id) {
                <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4 hover:shadow-md transition-shadow group">
                  <div class="flex justify-between items-start">
                    <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <mat-icon>ac_unit</mat-icon>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Meta de Segurança</span>
                      <p class="text-sm font-bold text-stone-900">{{ eq.target_min }}°C a {{ eq.target_max }}°C</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 class="text-lg font-bold text-stone-900">{{ eq.name }}</h3>
                    @if (getLastReading(eq.id)) {
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs font-medium" [class.text-emerald-600]="getLastReading(eq.id)?.status === 'conforme'" [class.text-rose-600]="getLastReading(eq.id)?.status === 'nao_conforme'">
                          {{ getLastReading(eq.id)?.value }}°C
                        </span>
                        <span class="text-[10px] text-stone-400">• {{ getLastReading(eq.id)?.created_at | date:'HH:mm' }}</span>
                      </div>
                    } @else {
                      <p class="text-xs text-stone-400 mt-1 italic">Nenhuma leitura hoje</p>
                    }
                  </div>

                  <div class="flex gap-2 pt-2">
                    <div class="relative flex-1">
                      <input #tempInput type="number" step="0.1" placeholder="0.0" class="w-full pl-3 pr-8 py-2.5 border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-stone-900 outline-none">
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">°C</span>
                    </div>
                    <button (click)="recordTemperature(eq, tempInput.value); tempInput.value = ''" class="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm">
                      Salvar
                    </button>
                  </div>
                </div>
              }
              @if (equipmentService.equipment().length === 0) {
                <div class="col-span-full p-24 text-center text-stone-400 bg-white rounded-2xl border border-dashed border-stone-300">
                  <mat-icon class="text-6xl mb-4 opacity-20">ac_unit</mat-icon>
                  <p class="text-lg font-medium">Nenhum equipamento cadastrado.</p>
                  <p class="text-sm">Use o botão "Configurar Itens" para adicionar freezers e geladeiras.</p>
                </div>
              }
            </div>
          }

          <!-- Histórico Tab -->
          @if (activeTab() === 'historico') {
            <div class="space-y-8 animate-in fade-in duration-500">
              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div class="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                  <h2 class="font-bold text-stone-900 flex items-center gap-2">
                    <mat-icon class="text-blue-500">thermostat</mat-icon>
                    Leituras de Temperatura (Últimos 7 dias)
                  </h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th class="px-6 py-4">Data/Hora</th>
                        <th class="px-6 py-4">Equipamento</th>
                        <th class="px-6 py-4">Valor</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Responsável</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                      @for (r of equipmentService.readings(); track r.id) {
                        <tr class="hover:bg-stone-50 transition-colors">
                          <td class="px-6 py-4 text-stone-500">{{ r.created_at | date:'dd/MM HH:mm' }}</td>
                          <td class="px-6 py-4 font-bold text-stone-900">{{ r.equipment?.name }}</td>
                          <td class="px-6 py-4 font-mono">{{ r.value }}°C</td>
                          <td class="px-6 py-4">
                            <span [class.bg-emerald-100]="r.status === 'conforme'" [class.text-emerald-700]="r.status === 'conforme'" [class.bg-rose-100]="r.status === 'nao_conforme'" [class.text-rose-700]="r.status === 'nao_conforme'" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {{ r.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-stone-500">{{ r.user?.name }}</td>
                        </tr>
                      }
                      @if (equipmentService.readings().length === 0) {
                        <tr>
                          <td colspan="5" class="px-6 py-12 text-center text-stone-400 italic">Nenhum registro encontrado.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div class="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                  <h2 class="font-bold text-stone-900 flex items-center gap-2">
                    <mat-icon class="text-emerald-500">task_alt</mat-icon>
                    Registros de Checklist (Últimos 7 dias)
                  </h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th class="px-6 py-4">Data/Hora</th>
                        <th class="px-6 py-4">Item</th>
                        <th class="px-6 py-4">Categoria</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Responsável</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                      @for (r of checklistService.records(); track r.id) {
                        <tr class="hover:bg-stone-50 transition-colors">
                          <td class="px-6 py-4 text-stone-500">{{ r.created_at | date:'dd/MM HH:mm' }}</td>
                          <td class="px-6 py-4 font-bold text-stone-900">{{ r.item?.title }}</td>
                          <td class="px-6 py-4 uppercase text-[10px] font-medium text-stone-400">{{ r.item?.category }}</td>
                          <td class="px-6 py-4">
                            <span [class.bg-emerald-100]="r.status === 'completed' || r.status === 'conforme'" [class.text-emerald-700]="r.status === 'completed' || r.status === 'conforme'" [class.bg-rose-100]="r.status === 'nao_conforme'" [class.text-rose-700]="r.status === 'nao_conforme'" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {{ r.status === 'completed' ? 'CONFORME' : r.status.toUpperCase() }}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-stone-500">{{ r.user?.name }}</td>
                        </tr>
                      }
                      @if (checklistService.records().length === 0) {
                        <tr>
                          <td colspan="5" class="px-6 py-12 text-center text-stone-400 italic">Nenhum registro encontrado.</td>
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
export class LimpezaComponent implements OnInit {
  equipmentService = inject(EquipmentService);
  checklistService = inject(ChecklistService);
  authService = inject(AuthService);

  activeTab = signal<'checklist' | 'termometria' | 'historico'>('checklist');
  showRegistrationForm = signal(false);

  newEquipment: Partial<Equipment> = { name: '', target_min: 0, target_max: 0 };
  newChecklistItem: Partial<ChecklistItem> = { title: '', category: 'limpeza' };

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    await Promise.all([
      this.equipmentService.loadEquipment(undefined, 'limpeza'),
      this.equipmentService.loadReadings(),
      this.checklistService.loadItems('limpeza'),
      this.checklistService.loadRecords()
    ]);
  }

  canManage() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'chef';
  }

  filterItems(category: string) {
    return this.checklistService.items().filter(i => i.category === category);
  }

  isItemCompletedToday(itemId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.checklistService.records().some(r => r.item_id === itemId && r.created_at.startsWith(today));
  }

  getLastReading(equipmentId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.equipmentService.readings().find(r => r.equipment_id === equipmentId && r.created_at.startsWith(today));
  }

  completedTodayCount() {
    const today = new Date().toISOString().split('T')[0];
    // Count unique items completed today
    const completedIds = new Set(
      this.checklistService.records()
        .filter(r => r.created_at.startsWith(today))
        .map(r => r.item_id)
    );
    return completedIds.size;
  }

  todayProgress() {
    const total = this.checklistService.items().length;
    if (total === 0) return 0;
    const completed = this.completedTodayCount();
    return Math.round((completed / total) * 100);
  }

  async addEquipment() {
    if (!this.newEquipment.name) return;
    await this.equipmentService.addEquipment({ ...this.newEquipment, category: 'limpeza' });
    this.newEquipment = { name: '', target_min: 0, target_max: 0 };
  }

  async removeEquipment(id: string) {
    if (confirm('Remover este equipamento?')) {
      await this.equipmentService.removeEquipment(id);
    }
  }

  async addChecklistItem() {
    if (!this.newChecklistItem.title) return;
    await this.checklistService.addItem({ ...this.newChecklistItem, category: this.newChecklistItem.category || 'limpeza' });
    this.newChecklistItem = { title: '', category: 'limpeza' };
  }

  async removeChecklistItem(id: string) {
    if (confirm('Remover este item?')) {
      await this.checklistService.removeItem(id);
    }
  }

  async recordTemperature(eq: Equipment, valueStr: string) {
    const value = parseFloat(valueStr);
    if (isNaN(value)) return;
    
    const status = (value >= eq.target_min && value <= eq.target_max) ? 'conforme' : 'nao_conforme';
    await this.equipmentService.addReading({
      equipment_id: eq.id,
      value,
      status
    });
  }

  async recordChecklist(itemId: string, status: 'completed' | 'nao_conforme') {
    await this.checklistService.addRecord({
      item_id: itemId,
      status
    });
  }

  generateReport() {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('pt-BR');
    const now = new Date().toLocaleString('pt-BR');

    // Header
    doc.setFillColor(41, 37, 36); // stone-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Relatório de Higiene e Segurança', 14, 25);
    
    doc.setFontSize(10);
    doc.text(`Emissão: ${now}`, 14, 33);
    doc.text(`Unidade: KORE Gastronomia`, 160, 33);

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Resumo de Conformidade Diária', 14, 55);
    
    doc.setFontSize(10);
    doc.text(`Checklists Concluídos: ${this.completedTodayCount()} de ${this.checklistService.items().length}`, 14, 65);
    doc.text(`Índice de Conformidade: ${this.todayProgress()}%`, 14, 72);

    // Temperature Table
    doc.setFontSize(14);
    doc.text('Histórico de Termometria', 14, 85);
    
    const tempData = this.equipmentService.readings().map(r => [
      new Date(r.created_at).toLocaleString('pt-BR'),
      r.equipment?.name || '',
      `${r.value}°C`,
      r.status.toUpperCase(),
      r.user?.name || ''
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Data/Hora', 'Equipamento', 'Valor', 'Status', 'Responsável']],
      body: tempData,
      theme: 'grid',
      headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.raw as string;
          if (status === 'NAO_CONFORME') {
            data.cell.styles.textColor = [225, 29, 72]; // rose-600
          } else if (status === 'CONFORME') {
            data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          }
        }
      }
    });

    // Checklist Table
    const docWithTable = doc as unknown as { lastAutoTable: { finalY: number }; internal: { getNumberOfPages: () => number } };
    const finalY = docWithTable.lastAutoTable.finalY || 90;
    if (finalY + 30 > 280) doc.addPage();
    
    doc.setFontSize(14);
    doc.text('Histórico de Checklists', 14, docWithTable.lastAutoTable.finalY + 15);

    const checklistData = this.checklistService.records().map((r: { created_at: string; item?: { title: string; category: string }; status: string; user?: { name: string } }) => [
      new Date(r.created_at).toLocaleString('pt-BR'),
      r.item?.title || '',
      r.item?.category.toUpperCase() || '',
      r.status === 'completed' ? 'CONFORME' : r.status.toUpperCase(),
      r.user?.name || ''
    ]);

    autoTable(doc, {
      startY: docWithTable.lastAutoTable.finalY + 20,
      head: [['Data/Hora', 'Item', 'Categoria', 'Status', 'Responsável']],
      body: checklistData,
      theme: 'grid',
      headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.raw as string;
          if (status === 'NAO_CONFORME') {
            data.cell.styles.textColor = [225, 29, 72];
          } else {
            data.cell.styles.textColor = [5, 150, 105];
          }
        }
      }
    });

    // Footer
    const pageCount = docWithTable.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Documento gerado via KORE Management System`, 105, 290, { align: 'center' });
    }

    doc.save(`relatorio-higiene-${today.replace(/\//g, '-')}.pdf`);
  }
}
