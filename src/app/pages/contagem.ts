import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-contagem',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Contagem de Estoque</h1>
          <p class="text-stone-500 mt-1">Atualize rapidamente as quantidades atuais da sua praça.</p>
        </div>
        <button 
          (click)="salvarContagem()" 
          [disabled]="isSubmitting() || !hasChanges()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
          @if (isSubmitting()) {
            <mat-icon class="animate-spin">autorenew</mat-icon>
            Salvando...
          } @else {
            <mat-icon>save</mat-icon>
            Salvar Contagem
          }
        </button>
      </header>

      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div class="p-4 border-b border-stone-100 bg-stone-50">
          <div class="relative">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</mat-icon>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)" 
              placeholder="Buscar itens na praça..." 
              class="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
          </div>
        </div>

        <div class="divide-y divide-stone-100">
          @for (item of filteredItems(); track item.id) {
            <div class="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div>
                <div class="font-bold text-stone-800 text-lg">{{ item.name }}</div>
                <div class="text-sm text-stone-500">Estoque anterior: {{ item.quantity }} {{ item.unit }}</div>
              </div>
              
              <div class="flex items-center gap-3">
                <div class="flex flex-col items-end">
                  <label [for]="'qty-' + item.id" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Quantidade Atual</label>
                  <div class="flex items-center gap-2">
                    <input 
                      [id]="'qty-' + item.id"
                      type="number" 
                      [value]="getNewQuantity(item.id)" 
                      (input)="setNewQuantity(item.id, $event)" 
                      min="0" 
                      step="0.1" 
                      class="w-24 text-right border-2 border-stone-200 rounded-xl px-3 py-2 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-stone-800 transition-all">
                    <span class="text-stone-500 font-medium w-8">{{ item.unit }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
          @if (filteredItems().length === 0) {
            <div class="p-8 text-center text-stone-500">
              Nenhum item encontrado no estoque da sua praça.
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ContagemComponent {
  private invService = inject(InventoryService);
  private authService = inject(AuthService);

  searchQuery = signal('');
  isSubmitting = signal(false);
  
  // Store the new quantities keyed by item ID
  newQuantities = signal<Record<string, number>>({});

  items = computed(() => this.invService.items());

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.items().filter(i => i.name.toLowerCase().includes(query));
  });

  hasChanges = computed(() => Object.keys(this.newQuantities()).length > 0);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.team_id) {
        this.invService.loadItems(user.team_id);
      }
    });
  }

  getNewQuantity(id: string): number {
    const q = this.newQuantities()[id];
    if (q !== undefined) return q;
    const item = this.items().find(i => i.id === id);
    return item ? item.quantity : 0;
  }

  setNewQuantity(id: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      this.newQuantities.update(prev => ({ ...prev, [id]: Math.max(0, val) }));
    }
  }

  async salvarContagem() {
    this.isSubmitting.set(true);
    try {
      const updates = Object.entries(this.newQuantities()).map(([id, quantity]) => {
        return this.invService.updateItem({ id, quantity });
      });
      
      await Promise.all(updates);
      
      // Reset after save
      this.newQuantities.set({});
      
      // Reload
      const user = this.authService.currentUser();
      if (user?.team_id) {
        await this.invService.loadItems(user.team_id);
      }
      
      alert('Contagem salva com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar contagem.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
