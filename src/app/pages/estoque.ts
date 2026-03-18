import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InventoryService, InventoryItem } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Estoque</h1>
          <p class="text-stone-500 mt-1">Controle de ingredientes e alertas de baixo estoque.</p>
        </div>
        <div class="flex gap-3">
          @if (canManageInventory()) {
            <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
              {{ showForm() ? 'Cancelar' : 'Novo Item' }}
            </button>
          }
        </div>
      </header>

      <!-- Formulário de Novo Item -->
      @if (showForm()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Adicionar Novo Item</h2>
          
          <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1.5 md:col-span-2">
              <label class="text-sm font-medium text-stone-700">Nome do Item</label>
              <input type="text" formControlName="name" placeholder="Ex: Farinha de Trigo" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Categoria</label>
              <select formControlName="category" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="Secos">Secos</option>
                <option value="Frios">Frios / Laticínios</option>
                <option value="Carnes">Carnes</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Unidade de Medida</label>
              <select formControlName="unit" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="l">Litro (L)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="un">Unidade (un)</option>
                <option value="cx">Caixa (cx)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Quantidade Atual</label>
              <input type="number" formControlName="quantity" min="0" step="0.01" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Estoque Mínimo</label>
              <input type="number" formControlName="min_quantity" min="0" step="0.01" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
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

      <!-- Filtros -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button 
          (click)="activeCategory.set('Todas')"
          [class.bg-stone-900]="activeCategory() === 'Todas'"
          [class.text-white]="activeCategory() === 'Todas'"
          [class.bg-white]="activeCategory() !== 'Todas'"
          [class.text-stone-600]="activeCategory() !== 'Todas'"
          class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
          Todas as Categorias
        </button>
        @for (category of categories(); track category) {
          <button 
            (click)="activeCategory.set(category)"
            [class.bg-stone-900]="activeCategory() === category"
            [class.text-white]="activeCategory() === category"
            [class.bg-white]="activeCategory() !== category"
            [class.text-stone-600]="activeCategory() !== category"
            class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
            {{ category }}
          </button>
        }
      </div>

      <!-- Inventory List -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div class="overflow-x-auto">
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
              @if (inventoryService.isLoading()) {
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
                          <button (click)="removeItem(item.id)" class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2" title="Remover Item">
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
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstoqueComponent implements OnInit {
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  activeCategory = signal<string>('Todas');
  showForm = signal(false);
  isSubmitting = signal(false);

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
    this.inventoryService.loadItems();
  }

  canManageInventory(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin' || user?.role === 'chef';
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.itemForm.reset({ category: 'Secos', unit: 'kg', quantity: 0, min_quantity: 0 });
    }
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
    if (this.itemForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.itemForm.value;
      
      const success = await this.inventoryService.addItem({
        name: formValue.name || '',
        category: formValue.category || 'Geral',
        unit: formValue.unit || 'un',
        quantity: formValue.quantity || 0,
        min_quantity: formValue.min_quantity || 0,
        cost_per_unit: 0
      });
      
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
