import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-contagem',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Auditoria & Contagem</h1>
          <p class="text-stone-500 mt-1">Realize inventários ou correções rápidas de estoque.</p>
        </div>
        <div class="flex gap-2">
           @if (canManageAll()) {
             <select 
               [ngModel]="activeLocation()" 
               (ngModelChange)="changeLocation($event)"
               class="bg-white border border-stone-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
               <option value="central">Estoque Central</option>
               @for (team of teamService.teams(); track team.id) {
                 <option [value]="team.id">Praça: {{ team.name }}</option>
               }
             </select>
           }
          <div class="bg-stone-100 p-1 rounded-xl flex items-center">
             <button 
               (click)="countMode.set('quick')" 
               [class.bg-white]="countMode() === 'quick'" [class.shadow-sm]="countMode() === 'quick'" [class.text-stone-900]="countMode() === 'quick'" [class.text-stone-500]="countMode() !== 'quick'"
               class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all">
               Correção Rápida
             </button>
             <button 
               (click)="countMode.set('blind')" 
               [class.bg-white]="countMode() === 'blind'" [class.shadow-sm]="countMode() === 'blind'" [class.text-stone-900]="countMode() === 'blind'" [class.text-stone-500]="countMode() !== 'blind'"
               class="px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5">
               <mat-icon class="text-[16px] w-4 h-4">visibility_off</mat-icon> Inventário Cego
             </button>
          </div>
        </div>
      </header>

      @if (showRecommendations()) {
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
           <h2 class="text-lg font-bold text-amber-900 flex items-center gap-2 mb-2">
             <mat-icon>insights</mat-icon> Recomendações de Reposição
           </h2>
           <p class="text-amber-700 text-sm mb-4">Com base na sua contagem, os seguintes itens ficaram abaixo do mínimo e exigem requisição ou compra.</p>
           
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
             @for (rec of recommendations(); track rec.id) {
               <div class="bg-white p-3 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                 <div>
                   <div class="font-bold text-stone-900">{{ rec.name }}</div>
                   <div class="text-xs text-stone-500">Mín: {{ rec.min }} {{ rec.unit }} | Contado: <span class="text-red-600 font-bold">{{ rec.counted }}</span></div>
                 </div>
                 <div class="text-sm font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-lg">
                    Requer: +{{ rec.needed }} {{ rec.unit }}
                 </div>
               </div>
             }
           </div>

           <div class="flex justify-end gap-3">
             <button (click)="showRecommendations.set(false)" class="px-4 py-2 text-stone-500 hover:text-stone-700 font-bold">Fechar</button>
           </div>
        </div>
      }

      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div class="p-4 border-b border-stone-100 bg-stone-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div class="relative w-full sm:w-96">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</mat-icon>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)" 
              placeholder="Buscar itens para contar..." 
              class="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
          </div>
          <button 
            (click)="salvarContagem()" 
            [disabled]="isSubmitting() || !hasChanges()"
            class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2">
            @if (isSubmitting()) {
              <mat-icon class="animate-spin">autorenew</mat-icon>
              Processando...
            } @else {
              <mat-icon>check_circle</mat-icon>
              Confirmar Contagem
            }
          </button>
        </div>

        <div class="divide-y divide-stone-100">
          @for (item of filteredItems(); track item.id) {
            <div class="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors" [class.bg-emerald-50]="newQuantities()[item.id] !== undefined">
              <div>
                <div class="font-bold text-stone-800 text-lg">{{ item.name }}</div>
                <div class="text-sm text-stone-500">
                  @if (countMode() === 'quick') {
                    Estoque sistêmico: {{ item.quantity }} {{ item.unit }}
                  } @else {
                    Modo cego - Informe a quantidade física
                  }
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <div class="flex flex-col items-end">
                  <label [for]="'qty-' + item.id" class="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Qtd Encontrada</label>
                  <div class="flex items-center gap-2">
                    <input 
                      [id]="'qty-' + item.id"
                      type="number" 
                      [value]="getNewQuantity(item.id)" 
                      (input)="setNewQuantity(item.id, $event)" 
                      min="0" 
                      step="0.1" 
                      class="w-24 text-right border-2 border-stone-200 rounded-xl px-3 py-2 text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-stone-800 transition-all bg-white"
                      [placeholder]="countMode() === 'blind' ? '?' : ''">
                    <span class="text-stone-500 font-medium w-8">{{ item.unit }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
          @if (filteredItems().length === 0) {
            <div class="p-8 text-center text-stone-500">
              Nenhum item encontrado no estoque selecionado.
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
  teamService = inject(TeamService);

  searchQuery = signal('');
  isSubmitting = signal(false);
  countMode = signal<'quick'|'blind'>('quick');
  activeLocation = signal<string>('central');
  
  // Store the new quantities keyed by item ID
  newQuantities = signal<Record<string, number>>({});
  
  // Recommendations after save
  showRecommendations = signal(false);
  recommendations = signal<Array<{id: string, name: string, min: number, counted: number, needed: number, unit: string}>>([]);

  items = computed(() => this.invService.items());

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.items().filter(i => i.name.toLowerCase().includes(query));
  });

  hasChanges = computed(() => Object.keys(this.newQuantities()).length > 0);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
         if (this.canManageAll()) {
            this.teamService.loadTeams();
            const loc = this.activeLocation();
            this.invService.loadItems(loc);
         } else {
            if (user.team_id) {
               this.activeLocation.set(user.team_id);
               this.invService.loadItems(user.team_id);
            } else {
               this.activeLocation.set('central');
               this.invService.loadItems('central');
            }
         }
      }
    }, { allowSignalWrites: true });
  }

  canManageAll(): boolean {
     const user = this.authService.currentUser();
     return user?.role === 'admin' || user?.role === 'estoque';
  }

  changeLocation(locationId: string) {
     this.activeLocation.set(locationId);
     this.newQuantities.set({}); // clear un-saved changes
     this.showRecommendations.set(false);
  }

  getNewQuantity(id: string): string {
    const q = this.newQuantities()[id];
    if (q !== undefined) return q.toString();
    if (this.countMode() === 'blind') return ''; // Empty for blind mode
    const item = this.items().find(i => i.id === id);
    return item ? item.quantity.toString() : '0';
  }

  setNewQuantity(id: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      this.newQuantities.update(prev => ({ ...prev, [id]: Math.max(0, val) }));
    } else {
      // Allow clearing the input without forcing 0
       const prev = { ...this.newQuantities() };
       delete prev[id];
       this.newQuantities.set(prev);
    }
  }

  async salvarContagem() {
    this.isSubmitting.set(true);
    try {
      const currentItems = this.items();
      const recs: any[] = [];

      const updates = Object.entries(this.newQuantities()).map(([id, quantity]) => {
        const item = currentItems.find(i => i.id === id);
        if (item && quantity <= item.min_quantity) {
           recs.push({
              id: item.id,
              name: item.name,
              min: item.min_quantity,
              counted: quantity,
              needed: parseFloat((item.min_quantity - quantity + (item.min_quantity * 0.2)).toFixed(2)), // Suggest 20% buffer
              unit: item.unit
           });
        }
        return this.invService.updateItem({ id, quantity });
      });
      
      await Promise.all(updates);
      
      // Reset after save
      this.newQuantities.set({});
      
      // Reload
      await this.invService.loadItems(this.activeLocation());
      
      if (recs.length > 0) {
         this.recommendations.set(recs);
         this.showRecommendations.set(true);
         window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
         alert('Contagem salva com sucesso! O estoque está saudável.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar contagem.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

