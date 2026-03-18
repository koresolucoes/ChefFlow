import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { InventoryService, InventoryItem } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';
import { EquipmentService, Equipment } from '../services/equipment.service';
import { ChecklistService, ChecklistItem } from '../services/checklist.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Estoque</h1>
          <p class="text-stone-500 mt-1">Controle de insumos e segurança alimentar.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="generateReport()" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium hover:bg-stone-200 transition-colors flex items-center gap-2">
            <mat-icon>picture_as_pdf</mat-icon>
            Relatório PDF
          </button>
          @if (canManageInventory()) {
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
            (click)="activeTab.set('inventory')"
            [class.border-stone-900]="activeTab() === 'inventory'"
            [class.text-stone-900]="activeTab() === 'inventory'"
            [class.border-transparent]="activeTab() !== 'inventory'"
            [class.text-stone-500]="activeTab() !== 'inventory'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            Estoque Atual
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
            <!-- Inventory Item -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-emerald-500">inventory_2</mat-icon>
                Novo Item de Estoque
              </h3>
              <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="space-y-3">
                <input type="text" formControlName="name" placeholder="Nome do Item" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                <div class="grid grid-cols-2 gap-2">
                  <select formControlName="category" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                    <option value="Secos">Secos</option>
                    <option value="Frios">Frios</option>
                    <option value="Carnes">Carnes</option>
                    <option value="Hortifruti">Hortifruti</option>
                  </select>
                  <select formControlName="unit" class="w-full px-3 py-2 border border-stone-200 rounded-lg">
                    <option value="kg">kg</option>
                    <option value="l">L</option>
                    <option value="un">un</option>
                  </select>
                </div>
                <button type="submit" [disabled]="itemForm.invalid || isSubmitting()" class="w-full py-2 bg-stone-900 text-white rounded-lg font-medium">
                  Salvar Item
                </button>
              </form>
            </div>

            <!-- Equipment -->
            <div class="space-y-4">
              <h3 class="font-bold text-stone-900 flex items-center gap-2">
                <mat-icon class="text-blue-500">ac_unit</mat-icon>
                Novo Equipamento (Frio)
              </h3>
              <form (ngSubmit)="addEquipment()" class="space-y-3">
                <input type="text" [(ngModel)]="newEquipment.name" name="eqName" placeholder="Nome (Ex: Câmara Fria 01)" required class="w-full px-3 py-2 border border-stone-200 rounded-lg">
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
                  <option value="estoque">Recebimento</option>
                  <option value="organizacao">Organização</option>
                  <option value="validade">Validade</option>
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
        @if (inventoryService.loading() || equipmentService.loading() || checklistService.loading()) {
          <div class="flex flex-col items-center justify-center p-24 space-y-4">
            <mat-icon class="animate-spin text-stone-400 text-5xl">autorenew</mat-icon>
            <p class="text-stone-500">Sincronizando dados...</p>
          </div>
        } @else {
          <!-- Inventory Tab -->
          @if (activeTab() === 'inventory') {
            <div class="space-y-6">
              <div class="flex gap-2 overflow-x-auto pb-2">
                <button (click)="activeCategory.set('Todas')" [class.bg-stone-900]="activeCategory() === 'Todas'" [class.text-white]="activeCategory() === 'Todas'" class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">Todas as Categorias</button>
                @for (category of categories(); track category) {
                  <button (click)="activeCategory.set(category)" [class.bg-stone-900]="activeCategory() === category" [class.text-white]="activeCategory() === category" class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">{{ category }}</button>
                }
              </div>

              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <table class="w-full text-left">
                  <thead>
                    <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase font-bold">
                      <th class="px-6 py-4">Item</th>
                      <th class="px-6 py-4">Categoria</th>
                      <th class="px-6 py-4">Quantidade</th>
                      <th class="px-6 py-4">Status</th>
                      <th class="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-stone-200">
                    @for (item of filteredItems(); track item.id) {
                      <tr class="hover:bg-stone-50/50 transition-colors">
                        <td class="px-6 py-4 font-medium text-stone-900">{{ item.name }}</td>
                        <td class="px-6 py-4"><span class="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-full">{{ item.category }}</span></td>
                        <td class="px-6 py-4"><span class="font-medium">{{ item.quantity }}</span> <span class="text-stone-500 text-xs">{{ item.unit }}</span></td>
                        <td class="px-6 py-4">
                          @if (item.quantity <= item.min_quantity) {
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"><mat-icon class="text-[14px] w-3.5 h-3.5">warning</mat-icon> Baixo</span>
                          } @else {
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full"><mat-icon class="text-[14px] w-3.5 h-3.5">check_circle</mat-icon> OK</span>
                          }
                        </td>
                        <td class="px-6 py-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button (click)="updateQuantity(item, -1)" class="p-1.5 text-stone-400 hover:text-stone-900"><mat-icon>remove</mat-icon></button>
                            <button (click)="updateQuantity(item, 1)" class="p-1.5 text-stone-400 hover:text-stone-900"><mat-icon>add</mat-icon></button>
                            @if (canManageInventory()) {
                              <button (click)="removeItem(item.id)" class="p-1.5 text-stone-400 hover:text-red-600"><mat-icon>delete_outline</mat-icon></button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Checklists Tab -->
          @if (activeTab() === 'checklists') {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 space-y-6">
                @for (cat of ['estoque', 'organizacao', 'validade']; track cat) {
                  <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div class="p-4 border-b border-stone-100 bg-stone-50 font-bold text-stone-900 uppercase text-xs">{{ cat }}</div>
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
                <div class="p-4 border-b border-stone-100 bg-stone-50 font-bold text-stone-900">Histórico de Temperatura</div>
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
                          <td class="px-6 py-4"><span [class.text-emerald-600]="r.status === 'conforme'" [class.text-rose-600]="r.status === 'nao_conforme'" class="font-bold uppercase text-[10px]">{{ r.status }}</span></td>
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
export class EstoqueComponent implements OnInit {
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  equipmentService = inject(EquipmentService);
  checklistService = inject(ChecklistService);
  private fb = inject(FormBuilder);

  activeTab = signal<'inventory' | 'checklists' | 'termometria' | 'historico'>('inventory');
  activeCategory = signal<string>('Todas');
  showRegistrationForm = signal(false);
  isSubmitting = signal(false);

  newEquipment: Partial<Equipment> = { name: '', target_min: 0, target_max: 0 };
  newChecklistItem: Partial<ChecklistItem> = { title: '', category: 'estoque' };

  itemForm = this.fb.group({
    name: ['', Validators.required],
    category: ['Secos', Validators.required],
    unit: ['kg', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    min_quantity: [0, [Validators.required, Validators.min(0)]]
  });

  categories = computed(() => {
    const items = this.inventoryService.items();
    const cats = new Set(items.map(i => i.category));
    return Array.from(cats).sort();
  });

  filteredItems = computed(() => {
    const items = this.inventoryService.items();
    const category = this.activeCategory();
    if (category === 'Todas') return items;
    return items.filter(i => i.category === category);
  });

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    await Promise.all([
      this.inventoryService.loadItems(),
      this.equipmentService.loadEquipment(undefined, 'estoque'),
      this.equipmentService.loadReadings(),
      this.checklistService.loadItems('estoque'),
      this.checklistService.loadRecords()
    ]);
  }

  canManageInventory(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin' || user?.role === 'chef';
  }

  toggleForm() {
    this.showRegistrationForm.update(v => !v);
  }

  filterChecklistItems(category: string) {
    return this.checklistService.items().filter((i: ChecklistItem) => i.category === category);
  }

  isItemCompletedToday(itemId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.checklistService.records().some((r: { item_id: string; created_at: string }) => r.item_id === itemId && r.created_at.startsWith(today));
  }

  async updateQuantity(item: InventoryItem, change: number) {
    const newQuantity = Math.max(0, item.quantity + change);
    if (newQuantity !== item.quantity) {
      await this.inventoryService.updateItem({ id: item.id, quantity: newQuantity });
    }
  }

  async onSubmit() {
    if (this.itemForm.valid) {
      this.isSubmitting.set(true);
      const success = await this.inventoryService.addItem({
        ...this.itemForm.value as Partial<InventoryItem>,
        cost_per_unit: 0
      });
      this.isSubmitting.set(false);
      if (success) {
        this.itemForm.reset({ category: 'Secos', unit: 'kg', quantity: 0, min_quantity: 0 });
      }
    }
  }

  async addEquipment() {
    if (!this.newEquipment.name) return;
    await this.equipmentService.addEquipment({ ...this.newEquipment, category: 'estoque' });
    this.newEquipment = { name: '', target_min: 0, target_max: 0 };
  }

  async removeEquipment(id: string) {
    if (confirm('Remover equipamento?')) await this.equipmentService.removeEquipment(id);
  }

  async addChecklistItem() {
    if (!this.newChecklistItem.title) return;
    await this.checklistService.addItem({ ...this.newChecklistItem, category: this.newChecklistItem.category || 'estoque' });
    this.newChecklistItem = { title: '', category: 'estoque' };
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

  async removeItem(id: string) {
    if (confirm('Remover item?')) await this.inventoryService.removeItem(id);
  }

  generateReport() {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(20);
    doc.text('Relatório de Estoque e Segurança', 14, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    doc.setFontSize(14);
    doc.text('Itens em Baixo Estoque', 14, 40);
    const lowStock = this.inventoryService.items().filter(i => i.quantity <= i.min_quantity).map(i => [i.name, `${i.quantity} ${i.unit}`, `${i.min_quantity} ${i.unit}`]);
    autoTable(doc, { startY: 45, head: [['Item', 'Qtd Atual', 'Qtd Mín']], body: lowStock });

    const docWithTable = doc as unknown as { lastAutoTable: { finalY: number } };
    doc.text('Termometria de Estoque', 14, docWithTable.lastAutoTable.finalY + 15);
    const tempData = this.equipmentService.readings().map((r: { equipment?: { name: string }; value: number; status: string; created_at: string }) => [r.equipment?.name || 'N/A', `${r.value}°C`, r.status.toUpperCase(), new Date(r.created_at).toLocaleString('pt-BR')]);
    autoTable(doc, { startY: docWithTable.lastAutoTable.finalY + 20, head: [['Equipamento', 'Valor', 'Status', 'Data/Hora']], body: tempData });

    doc.save(`relatorio-estoque-${today.replace(/\//g, '-')}.pdf`);
  }
}
