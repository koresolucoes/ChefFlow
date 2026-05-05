import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <header class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-stone-900">Compras & Recebimento</h1>
        <p class="text-stone-500 mt-1">Gerencie a entrada de mercadorias no estoque central e atualize custos.</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Lista de Sugestões de Compra (Estoque Baixo) -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-[600px]">
            <div class="p-4 border-b border-stone-100 bg-stone-50">
              <h2 class="font-bold text-stone-800 flex items-center gap-2">
                <mat-icon class="text-amber-500">warning</mat-icon> Sugestões de Compra
              </h2>
              <p class="text-xs text-stone-500 mt-1">Itens abaixo do estoque mínimo</p>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
              @if (lowStockItems().length === 0) {
                <div class="p-8 text-center text-stone-500">
                  <mat-icon class="text-4xl text-stone-300 mb-2">check_circle</mat-icon>
                  <p class="font-medium text-stone-900">Estoque Saudável</p>
                  <p class="text-sm mt-1">Nenhum item abaixo do mínimo.</p>
                </div>
              }
              @for (item of lowStockItems(); track item.id) {
                <button (click)="selectItem(item)" class="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-100 flex justify-between items-center group">
                  <div>
                    <div class="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">{{ item.name }}</div>
                    <div class="text-xs font-medium text-amber-600">Atual: {{ item.quantity }} {{ item.unit }} | Mín: {{ item.min_quantity }}</div>
                  </div>
                  <mat-icon class="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">add_shopping_cart</mat-icon>
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Formulário de Entrada de Nota / Compra -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 class="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <mat-icon class="text-emerald-600">publish</mat-icon> Registrar Entrada de Mercadoria
            </h2>

            <div class="space-y-6">
              <div>
                <label for="itemId" class="block text-sm font-bold text-stone-700 mb-1">Item do Estoque *</label>
                <select 
                  id="itemId"
                  [(ngModel)]="selectedItemId" 
                  (ngModelChange)="onItemSelect()"
                  class="w-full px-4 py-4 sm:py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg sm:text-base font-medium transition-colors">
                  <option value="">Selecione um insumo...</option>
                  @for (item of allItems(); track item.id) {
                    <option [value]="item.id">{{ item.name }} ({{ item.unit }})</option>
                  }
                </select>
              </div>

              @if (selectedItemDetails()) {
                <div class="p-4 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div class="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Estoque Atual</div>
                    <div class="font-medium text-stone-900">{{ selectedItemDetails()?.quantity }} {{ selectedItemDetails()?.unit }}</div>
                  </div>
                  <div>
                    <div class="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Custo Unit. Atual</div>
                    <div class="font-medium text-stone-900">{{ selectedItemDetails()?.cost_per_unit | currency:'BRL' }}</div>
                  </div>
                  <div class="md:col-span-2">
                    <div class="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Categoria</div>
                    <div class="font-medium text-stone-900">{{ selectedItemDetails()?.category }}</div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                  <div>
                    <label for="qtdRcv" class="block text-sm font-bold text-stone-700 mb-1">Quantidade Recebida (+)</label>
                    <div class="relative">
                      <input 
                        id="qtdRcv"
                        type="number" 
                        inputmode="decimal"
                        [(ngModel)]="entryQuantity"
                        min="0.01" 
                        step="0.01" 
                        (input)="calculateTotals()"
                        class="w-full px-4 py-4 sm:py-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-black text-xl sm:text-lg transition-colors">
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">{{ selectedItemDetails()?.unit }}</div>
                    </div>
                  </div>
                  <div>
                    <label for="costTotal" class="block text-sm font-bold text-stone-700 mb-1">Custo Total da NF (R$)</label>
                    <input 
                      id="costTotal"
                      type="number" 
                      inputmode="decimal"
                      [(ngModel)]="entryTotalCost" 
                      min="0.01" 
                      step="0.01"
                      (input)="calculateTotals()"
                      class="w-full px-4 py-4 sm:py-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-black text-xl sm:text-lg transition-colors">
                  </div>
                </div>

                <!-- Resumo Simulado -->
                <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                  <div>
                    <div class="text-sm text-emerald-800 font-medium">Novo Custo Unitário:</div>
                    <div class="text-2xl font-black text-emerald-900 tracking-tight">{{ newUnitCost() | currency:'BRL' }} <span class="text-sm font-medium text-emerald-700">/ {{ selectedItemDetails()?.unit }}</span></div>
                    @if (costDifferencePerc() !== 0) {
                     <div class="text-xs mt-1 font-bold" [ngClass]="costDifferencePerc() > 0 ? 'text-rose-600' : 'text-emerald-600'">
                       {{ costDifferencePerc() > 0 ? '+' : '' }}{{ costDifferencePerc() | number:'1.0-1' }}% em relação ao custo anterior
                     </div>
                    }
                  </div>
                  <div class="flex-shrink-0">
                    <button 
                      (click)="confirmEntry()" 
                      [disabled]="!isValidEntry() || isSubmitting()"
                      class="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                      @if (isSubmitting()) {
                        <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon> Salvando...
                      } @else {
                        <mat-icon class="text-[20px] w-5 h-5">check_circle</mat-icon> Confirmar Entrada
                      }
                    </button>
                  </div>
                </div>
              } @else {
                <div class="p-8 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <mat-icon class="text-stone-300 text-5xl mb-2">inventory_2</mat-icon>
                  <p class="text-stone-500 font-medium">Selecione um insumo para registrar a entrada.</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ComprasComponent implements OnInit {
  private invService = inject(InventoryService);
  private authService = inject(AuthService);

  allItems = computed(() => this.invService.items());
  lowStockItems = computed(() => this.allItems().filter(i => (i.quantity || 0) <= (i.min_quantity || 0)));

  selectedItemId = signal<string>('');
  selectedItemDetails = computed(() => this.allItems().find(i => i.id === this.selectedItemId()));

  entryQuantity = signal<number | null>(null);
  entryTotalCost = signal<number | null>(null);
  newUnitCost = signal<number>(0);
  costDifferencePerc = signal<number>(0);

  isSubmitting = signal(false);

  ngOnInit() {
    // Força carregar estoque central
    this.invService.loadItems('central');
  }

  selectItem(item: { id: string; name: string; quantity: number; unit: string; min_quantity: number }) {
    this.selectedItemId.set(item.id);
    this.onItemSelect();
  }

  onItemSelect() {
    this.entryQuantity.set(null);
    this.entryTotalCost.set(null);
    this.newUnitCost.set(0);
    this.costDifferencePerc.set(0);
  }

  calculateTotals() {
    const qtd = this.entryQuantity();
    const total = this.entryTotalCost();
    const item = this.selectedItemDetails();

    if (qtd && total && qtd > 0) {
      const unitCost = total / qtd;
      this.newUnitCost.set(unitCost);

      if (item && item.cost_per_unit) {
        const diff = ((unitCost - item.cost_per_unit) / item.cost_per_unit) * 100;
        this.costDifferencePerc.set(diff);
      } else {
        this.costDifferencePerc.set(0);
      }
    } else {
      this.newUnitCost.set(0);
      this.costDifferencePerc.set(0);
    }
  }

  isValidEntry(): boolean {
    const qtd = this.entryQuantity();
    const total = this.entryTotalCost();
    return !!(qtd && qtd > 0 && total && total > 0 && this.selectedItemId());
  }

  async confirmEntry() {
    if (!this.isValidEntry()) return;

    const item = this.selectedItemDetails();
    if (!item) return;

    this.isSubmitting.set(true);

    try {
      // Cálculo do Preço Médio Ponderado ou Substituição Total (Vamos usar FIFO/Substituição Ponderada Clássica RM)
      const currentQtd = item.quantity || 0;
      const currentCost = item.cost_per_unit || 0;
      
      const newQtd = this.entryQuantity()!;
      const newTotal = this.entryTotalCost()!;

      const totalQtd = currentQtd + newQtd;
      const totalInventoryValue = (currentQtd * currentCost) + newTotal;
      const newAverageCost = totalQtd > 0 ? (totalInventoryValue / totalQtd) : 0;

      await this.invService.updateItem({
        id: item.id,
        quantity: totalQtd,
        cost_per_unit: parseFloat(newAverageCost.toFixed(2))
      });

      alert('Entrada no estoque registrada com sucesso!');
      
      // Reload
      await this.invService.loadItems('central');
      this.selectedItemId.set('');
      this.onItemSelect();
      
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar entrada.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
