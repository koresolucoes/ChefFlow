import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { InventoryService, InventoryItem } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';
import { ExportService } from '../services/export.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Estoque</h1>
          <p class="text-stone-500 mt-1">Controle de ingredientes e alertas de baixo estoque.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="exportarRelatorio()" class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
            <mat-icon>download</mat-icon>
            Exportar CSV
          </button>
          @if (canManageInventory()) {
            <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>{{ showForm() ? 'close' : (activeTab() === 'praca' ? 'link' : 'add') }}</mat-icon>
              {{ showForm() ? 'Cancelar' : (activeTab() === 'praca' ? 'Vincular Item' : 'Novo Item') }}
            </button>
          }
        </div>
      </header>

      <!-- Tabs -->
      <div class="flex border-b border-stone-200 mb-6">
        <button 
          (click)="setTab('central')"
          [class.border-emerald-600]="activeTab() === 'central'"
          [class.text-emerald-600]="activeTab() === 'central'"
          [class.border-transparent]="activeTab() !== 'central'"
          [class.text-stone-500]="activeTab() !== 'central'"
          class="px-6 py-3 border-b-2 font-medium text-sm transition-colors hover:text-emerald-600">
          Estoque Central
        </button>
        @if (authService.currentUser()?.team_id) {
          <button 
            (click)="setTab('praca')"
            [class.border-emerald-600]="activeTab() === 'praca'"
            [class.text-emerald-600]="activeTab() === 'praca'"
            [class.border-transparent]="activeTab() !== 'praca'"
            [class.text-stone-500]="activeTab() !== 'praca'"
            class="px-6 py-3 border-b-2 font-medium text-sm transition-colors hover:text-emerald-600">
            Estoque da Praça
          </button>
        }
      </div>

      <!-- Formulário de Novo/Editar Item -->
      @if (showForm()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">{{ editingItem() ? 'Editar Item' : (activeTab() === 'praca' ? 'Vincular Item do Estoque Central' : 'Adicionar Novo Item') }}</h2>
          
          <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @if (activeTab() === 'praca') {
              @if (!editingItem()) {
                <div class="space-y-1.5 md:col-span-3">
                  <label for="central-item" class="text-sm font-medium text-stone-700">Item do Estoque Central</label>
                  <select id="central-item" formControlName="central_item_id" (change)="onCentralItemSelect($event)" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                    <option value="">Selecione um item...</option>
                    @for (cItem of availableCentralItems(); track cItem.id) {
                      <option [value]="cItem.id">{{ cItem.name }} ({{ cItem.category }} - {{ cItem.unit }})</option>
                    }
                  </select>
                </div>
              } @else {
                <div class="space-y-1.5 md:col-span-3">
                  <span class="text-sm font-medium text-stone-700">Item</span>
                  <div class="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-700 font-medium">
                    {{ itemForm.get('name')?.value }} ({{ itemForm.get('unit')?.value }})
                  </div>
                </div>
              }
            } @else {
              <div class="space-y-1.5 md:col-span-2">
                <label for="item-name" class="text-sm font-medium text-stone-700">Nome do Item</label>
                <input id="item-name" type="text" formControlName="name" placeholder="Ex: Farinha de Trigo" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>
              
              <div class="space-y-1.5">
                <label for="item-category" class="text-sm font-medium text-stone-700">Categoria</label>
                <select id="item-category" formControlName="category" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="Secos">Secos</option>
                  <option value="Frios">Frios / Laticínios</option>
                  <option value="Carnes">Carnes</option>
                  <option value="Hortifruti">Hortifruti</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label for="item-unit" class="text-sm font-medium text-stone-700">Unidade de Medida</label>
                <select id="item-unit" formControlName="unit" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (L)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="un">Unidade (un)</option>
                  <option value="cx">Caixa (cx)</option>
                </select>
              </div>
            }

            <div class="space-y-1.5">
              <label for="item-quantity" class="text-sm font-medium text-stone-700">Quantidade Atual</label>
              <input id="item-quantity" type="number" formControlName="quantity" min="0" step="0.01" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            <div class="space-y-1.5">
              <label for="item-min-quantity" class="text-sm font-medium text-stone-700">Estoque Mínimo</label>
              <input id="item-min-quantity" type="number" formControlName="min_quantity" min="0" step="0.01" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            <div class="md:col-span-3 flex justify-end mt-2">
              <button type="submit" [disabled]="itemForm.invalid || isSubmitting()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">save</mat-icon>
                  Salvar Item
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Filtros e Busca -->
      <div class="flex flex-col sm:flex-row gap-4 mb-2">
        <div class="relative flex-1">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</mat-icon>
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)" 
            placeholder="Buscar itens..." 
            class="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors shadow-sm">
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button 
            (click)="activeCategory.set('Todas')"
            [class.bg-stone-900]="activeCategory() === 'Todas'"
            [class.text-white]="activeCategory() === 'Todas'"
            [class.bg-white]="activeCategory() !== 'Todas'"
            [class.text-stone-600]="activeCategory() !== 'Todas'"
            class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors shadow-sm">
            Todas as Categorias
          </button>
          @for (category of categories(); track category) {
            <button 
              (click)="activeCategory.set(category)"
              [class.bg-stone-900]="activeCategory() === category"
              [class.text-white]="activeCategory() === category"
              [class.bg-white]="activeCategory() !== category"
              [class.text-stone-600]="activeCategory() !== category"
              class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors shadow-sm">
              {{ category }}
            </button>
          }
        </div>
      </div>

      <!-- Inventory List -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden relative" [class.opacity-60]="inventoryService.isLoading() && filteredItems().length > 0">
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                <th class="px-6 py-4 font-semibold">Item</th>
                <th class="px-6 py-4 font-semibold">Categoria</th>
                <th class="px-6 py-4 font-semibold">Quantidade</th>
                <th class="px-6 py-4 font-semibold">Status</th>
                <th class="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              @if (inventoryService.isLoading() && filteredItems().length === 0) {
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-stone-500">
                    <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
                    <p>Carregando estoque...</p>
                  </td>
                </tr>
              } @else if (filteredItems().length === 0) {
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-stone-500">
                    <p>Nenhum item encontrado.</p>
                  </td>
                </tr>
              } @else {
                @for (item of filteredItems(); track item.id) {
                  <tr class="hover:bg-stone-50/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-medium text-stone-900">{{ item.name }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-full">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-stone-900">{{ item.quantity }}</span>
                        <span class="text-stone-500 text-sm">{{ item.unit }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      @if (item.quantity <= item.min_quantity) {
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          <mat-icon class="text-[14px] w-3.5 h-3.5">warning</mat-icon>
                          Baixo Estoque
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                          <mat-icon class="text-[14px] w-3.5 h-3.5">check_circle</mat-icon>
                          Adequado
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="updateQuantity(item, -1)" class="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Diminuir">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">remove</mat-icon>
                        </button>
                        <button (click)="updateQuantity(item, 1)" class="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Aumentar">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">add</mat-icon>
                        </button>
                        @if (canManageInventory()) {
                          <button (click)="editItem(item)" class="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors ml-2" title="Editar Item">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">edit</mat-icon>
                          </button>
                          <button (click)="removeItem(item.id)" class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover Item">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">delete_outline</mat-icon>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden divide-y divide-stone-200">
          @if (inventoryService.isLoading() && filteredItems().length === 0) {
            <div class="px-6 py-8 text-center text-stone-500">
              <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
              <p>Carregando estoque...</p>
            </div>
          } @else if (filteredItems().length === 0) {
            <div class="px-6 py-8 text-center text-stone-500">
              <p>Nenhum item encontrado.</p>
            </div>
          } @else {
            @for (item of filteredItems(); track item.id) {
              <div class="p-4 space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium text-stone-900 text-base">{{ item.name }}</div>
                    <span class="inline-block mt-1 px-2.5 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-medium rounded-full uppercase tracking-wider">
                      {{ item.category }}
                    </span>
                  </div>
                  @if (item.quantity <= item.min_quantity) {
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      <mat-icon class="text-[12px] w-3 h-3">warning</mat-icon>
                      Baixo
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      <mat-icon class="text-[12px] w-3 h-3">check_circle</mat-icon>
                      OK
                    </span>
                  }
                </div>
                
                <div class="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-stone-500 uppercase tracking-wider font-medium">Qtd:</span>
                    <span class="font-bold text-stone-900 text-lg">{{ item.quantity }}</span>
                    <span class="text-stone-500 text-sm">{{ item.unit }}</span>
                  </div>
                  
                  <div class="flex items-center gap-1">
                    <button (click)="updateQuantity(item, -1)" class="p-2 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors" title="Diminuir">
                      <mat-icon class="text-[20px] w-5 h-5">remove</mat-icon>
                    </button>
                    <button (click)="updateQuantity(item, 1)" class="p-2 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors" title="Aumentar">
                      <mat-icon class="text-[20px] w-5 h-5">add</mat-icon>
                    </button>
                    @if (canManageInventory()) {
                      <button (click)="editItem(item)" class="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors ml-1" title="Editar Item">
                        <mat-icon class="text-[20px] w-5 h-5">edit</mat-icon>
                      </button>
                      <button (click)="removeItem(item.id)" class="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover Item">
                        <mat-icon class="text-[20px] w-5 h-5">delete_outline</mat-icon>
                      </button>
                    }
                  </div>
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
export class EstoqueComponent {
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  exportService = inject(ExportService);
  teamService = inject(TeamService);
  private fb = inject(FormBuilder);

  activeTab = signal<'central' | 'praca'>('central');
  activeCategory = signal<string>('Todas');
  searchQuery = signal<string>('');
  showForm = signal(false);
  isSubmitting = signal(false);
  editingItem = signal<InventoryItem | null>(null);
  centralItems = signal<InventoryItem[]>([]);

  itemForm = this.fb.group({
    central_item_id: [''],
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

  availableCentralItems = computed(() => {
    const pracaItemNames = new Set(this.inventoryService.items().map(i => i.name.toLowerCase().trim()));
    return this.centralItems().filter(i => !pracaItemNames.has(i.name.toLowerCase().trim()));
  });

  filteredItems = computed(() => {
    let items = this.inventoryService.items();
    const category = this.activeCategory();
    const query = this.searchQuery().toLowerCase();
    
    if (category !== 'Todas') {
      items = items.filter(i => i.category === category);
    }
    if (query) {
      items = items.filter(i => i.name.toLowerCase().includes(query));
    }
    return items;
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const tab = this.activeTab();
      if (user) {
        if (tab === 'central') {
          this.inventoryService.loadItems('central');
        } else if (tab === 'praca' && user.team_id) {
          this.inventoryService.loadItems(user.team_id);
        }
      }
    });
  }

  setTab(tab: 'central' | 'praca') {
    this.activeTab.set(tab);
  }

  canManageInventory(): boolean {
    const user = this.authService.currentUser();
    if (user?.role === 'admin' || user?.role === 'estoque') return true;
    if (user?.role === 'chef') return true;
    return false;
  }

  exportarRelatorio() {
    const data = this.filteredItems().map(item => ({
      nome: item.name,
      categoria: item.category,
      quantidade: item.quantity,
      unidade: item.unit,
      estoque_minimo: item.min_quantity,
      status: item.quantity <= item.min_quantity ? 'Baixo Estoque' : 'Normal',
      criado_em: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'
    }));

    const headers = [
      { key: 'nome', label: 'Nome do Item' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'quantidade', label: 'Quantidade Atual' },
      { key: 'unidade', label: 'Unidade' },
      { key: 'estoque_minimo', label: 'Estoque Mínimo' },
      { key: 'status', label: 'Status' },
      { key: 'criado_em', label: 'Criado Em' }
    ];

    this.exportService.exportToCsv('Relatorio_Estoque', data, headers);
  }

  async toggleForm() {
    this.showForm.update(v => !v);
    if (this.showForm()) {
      if (this.activeTab() === 'praca') {
        const items = await this.inventoryService.getItems('central');
        this.centralItems.set(items);
      }
    } else {
      this.itemForm.reset({ category: 'Secos', unit: 'kg', quantity: 0, min_quantity: 0, central_item_id: '' });
      this.editingItem.set(null);
    }
  }

  onCentralItemSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    const item = this.centralItems().find(i => i.id === id);
    if (item) {
      this.itemForm.patchValue({
        name: item.name,
        category: item.category,
        unit: item.unit
      });
    } else {
      this.itemForm.patchValue({ name: '', category: 'Secos', unit: 'kg' });
    }
  }

  editItem(item: InventoryItem) {
    this.editingItem.set(item);
    this.itemForm.patchValue({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      min_quantity: item.min_quantity
    });
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async updateQuantity(item: InventoryItem, change: number) {
    const newQuantity = Math.max(0, item.quantity + change);
    if (newQuantity !== item.quantity) {
      await this.inventoryService.updateItem({
        id: item.id,
        quantity: newQuantity
      });
    }
  }

  async onSubmit() {
    if (this.activeTab() === 'praca' && !this.editingItem() && !this.itemForm.value.central_item_id) {
      alert('Por favor, selecione um item do estoque central para vincular.');
      return;
    }

    if (this.itemForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.itemForm.value;
      
      let success = false;
      const editing = this.editingItem();
      
      if (editing) {
        success = await this.inventoryService.updateItem({
          id: editing.id,
          name: formValue.name || '',
          category: formValue.category || 'Geral',
          unit: formValue.unit || 'un',
          quantity: formValue.quantity || 0,
          min_quantity: formValue.min_quantity || 0,
          team_id: this.activeTab() === 'central' ? 'central' : this.authService.currentUser()?.team_id
        });
      } else {
        success = await this.inventoryService.addItem({
          name: formValue.name || '',
          category: formValue.category || 'Geral',
          unit: formValue.unit || 'un',
          quantity: formValue.quantity || 0,
          min_quantity: formValue.min_quantity || 0,
          cost_per_unit: 0,
          team_id: this.activeTab() === 'central' ? 'central' : this.authService.currentUser()?.team_id
        });
      }
      
      this.isSubmitting.set(false);
      
      if (success) {
        this.toggleForm();
      }
    }
  }

  async removeItem(id: string) {
    if (confirm('Tem certeza que deseja remover este item do estoque?')) {
      await this.inventoryService.removeItem(id);
    }
  }
}
