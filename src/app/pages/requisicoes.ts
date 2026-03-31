import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RequisitionService, Requisition, RequisitionItem } from '../services/requisition.service';
import { InventoryService, InventoryItem } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-requisicoes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-stone-800">Requisições de Estoque</h1>
          <p class="text-stone-500">Gerencie os pedidos de insumos para a cozinha</p>
        </div>
        
        @if (canRequest()) {
          <button (click)="openNewModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
            <mat-icon>add</mat-icon>
            Nova Requisição
          </button>
        }
      </div>

      <!-- Lista de Requisições -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                <th class="p-4 font-medium">Data</th>
                <th class="p-4 font-medium">Solicitante</th>
                <th class="p-4 font-medium">Status</th>
                <th class="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @for (req of requisitions(); track req.id) {
                <tr class="hover:bg-stone-50 transition-colors">
                  <td class="p-4 text-stone-800">{{ req.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="p-4 text-stone-800">{{ req.requester?.name || 'N/A' }}</td>
                  <td class="p-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-amber-100 text-amber-800': req.status === 'pending',
                        'bg-blue-100 text-blue-800': req.status === 'partial',
                        'bg-emerald-100 text-emerald-800': req.status === 'completed',
                        'bg-rose-100 text-rose-800': req.status === 'cancelled'
                      }">
                      {{ getStatusLabel(req.status) }}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <button (click)="viewDetails(req)" class="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center justify-end gap-1 ml-auto">
                      <mat-icon class="text-[18px] w-4.5 h-4.5">visibility</mat-icon>
                      Detalhes
                    </button>
                  </td>
                </tr>
              }
              @if (requisitions().length === 0) {
                <tr><td colspan="4" class="p-8 text-center text-stone-500">Nenhuma requisição encontrada.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Nova Requisição (Para Cozinheiros/Chefs) -->
      @if (showNewModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div class="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 class="text-xl font-bold text-stone-800">Nova Requisição</h2>
              <button (click)="closeNewModal()" class="text-stone-400 hover:text-stone-600"><mat-icon>close</mat-icon></button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              <div class="mb-4">
                <label for="req-product" class="block text-sm font-medium text-stone-700 mb-1">Adicionar Item</label>
                <div class="flex gap-2">
                  <select id="req-product" [(ngModel)]="selectedProductId" class="flex-1 border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Selecione um produto...</option>
                    @for (item of inventory(); track item.id) {
                      <option [value]="item.id">{{ item.name }} ({{ item.unit }}) - Estoque: {{ item.quantity }}</option>
                    }
                  </select>
                  <input type="number" [(ngModel)]="selectedQuantity" placeholder="Qtd" class="w-24 border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <button (click)="addDraftItem()" class="bg-stone-800 text-white px-4 py-2 rounded-xl hover:bg-stone-700">Add</button>
                </div>
              </div>

              @if (draftItems().length > 0) {
                <div class="mt-6">
                  <h3 class="text-sm font-medium text-stone-700 mb-2">Itens Solicitados</h3>
                  <ul class="divide-y divide-stone-100 border border-stone-200 rounded-xl">
                    @for (item of draftItems(); track item.product_id; let i = $index) {
                      <li class="p-3 flex justify-between items-center">
                        <div>
                          <span class="font-medium text-stone-800">{{ getProductName(item.product_id) }}</span>
                          <span class="text-stone-500 text-sm ml-2">{{ item.quantity_requested }} {{ getProductUnit(item.product_id) }}</span>
                        </div>
                        <button (click)="removeDraftItem(i)" class="text-rose-500 hover:text-rose-700"><mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon></button>
                      </li>
                    }
                  </ul>
                </div>
              }

              <div class="mt-6">
                <label for="req-notes" class="block text-sm font-medium text-stone-700 mb-1">Observações</label>
                <textarea id="req-notes" [(ngModel)]="draftNotes" rows="3" class="w-full border border-stone-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Urgente para o jantar..."></textarea>
              </div>
            </div>

            <div class="p-6 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex justify-end gap-3">
              <button (click)="closeNewModal()" class="px-4 py-2 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors">Cancelar</button>
              <button (click)="submitRequisition()" [disabled]="draftItems().length === 0 || isSubmitting()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50 transition-colors">
                Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Detalhes / Atendimento (Para Estoque/Admin) -->
      @if (selectedReq()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div class="p-6 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h2 class="text-xl font-bold text-stone-800">Requisição #{{ selectedReq()!.id.substring(0, 8) }}</h2>
                <p class="text-sm text-stone-500">Solicitado por {{ selectedReq()!.requester?.name }}</p>
              </div>
              <button (click)="closeDetails()" class="text-stone-400 hover:text-stone-600"><mat-icon>close</mat-icon></button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              @if (selectedReq()!.notes) {
                <div class="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h4 class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Observações</h4>
                  <p class="text-amber-900 text-sm">{{ selectedReq()!.notes }}</p>
                </div>
              }

              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                    <th class="p-3 font-medium">Produto</th>
                    <th class="p-3 font-medium text-center">Solicitado</th>
                    <th class="p-3 font-medium text-center">Atendido</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                  @for (item of selectedReq()!.items; track item.id) {
                    <tr>
                      <td class="p-3 text-stone-800 font-medium">{{ item.inventory?.item_name }}</td>
                      <td class="p-3 text-center text-stone-600">{{ item.quantity_requested }} {{ item.inventory?.unit }}</td>
                      <td class="p-3 text-center">
                        @if (canFulfill() && selectedReq()!.status === 'pending') {
                          <div class="flex items-center justify-center gap-2">
                            <input type="number" [(ngModel)]="item.quantity_fulfilled" class="w-20 text-center border border-stone-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none">
                            <span class="text-stone-500 text-sm">{{ item.inventory?.unit }}</span>
                          </div>
                        } @else {
                          <span class="font-medium text-emerald-600">
                            {{ item.quantity_fulfilled || 0 }} {{ item.inventory?.unit }}
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="p-6 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex justify-end gap-3">
              <button (click)="closeDetails()" class="px-4 py-2 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors">Fechar</button>
              
              @if (canFulfill() && selectedReq()!.status === 'pending') {
                <button (click)="fulfillRequisition()" [disabled]="isSubmitting()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50 transition-colors">
                  Finalizar Atendimento
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RequisicoesComponent implements OnInit {
  private reqService = inject(RequisitionService);
  private invService = inject(InventoryService);
  private authService = inject(AuthService);

  requisitions = signal<Requisition[]>([]);
  inventory = signal<InventoryItem[]>([]);
  showNewModal = signal(false);
  selectedReq = signal<Requisition | null>(null);
  isSubmitting = signal(false);

  selectedProductId = signal('');
  selectedQuantity = signal<number | null>(null);
  draftItems = signal<RequisitionItem[]>([]);
  draftNotes = signal('');

  currentUser = this.authService.currentUser;

  canRequest = computed(() => ['chef', 'cook', 'admin'].includes(this.currentUser()?.role || ''));
  canFulfill = computed(() => ['estoque', 'admin'].includes(this.currentUser()?.role || ''));

  ngOnInit() { this.loadData(); }

  async loadData() {
    try {
      const [reqs, inv] = await Promise.all([this.reqService.getRequisitions(), this.invService.getItems()]);
      this.requisitions.set(reqs);
      this.inventory.set(inv);
    } catch (error) { console.error(error); }
  }

  getStatusLabel(status: string) {
    const map: Record<string, string> = { 'pending': 'Pendente', 'partial': 'Parcial', 'completed': 'Atendido', 'cancelled': 'Cancelado' };
    return map[status] || status;
  }

  openNewModal() {
    this.draftItems.set([]); this.draftNotes.set(''); this.selectedProductId.set(''); this.selectedQuantity.set(null);
    this.showNewModal.set(true);
  }
  closeNewModal() { this.showNewModal.set(false); }

  addDraftItem() {
    const pid = this.selectedProductId(); const qty = this.selectedQuantity();
    if (!pid || !qty || qty <= 0) return;
    const current = this.draftItems();
    const existing = current.find(i => i.product_id === pid);
    if (existing) { existing.quantity_requested += qty; this.draftItems.set([...current]); } 
    else { this.draftItems.set([...current, { product_id: pid, quantity_requested: qty }]); }
    this.selectedProductId.set(''); this.selectedQuantity.set(null);
  }

  removeDraftItem(index: number) {
    const current = [...this.draftItems()]; current.splice(index, 1); this.draftItems.set(current);
  }

  getProductName(id: string) { return this.inventory().find(i => i.id === id)?.name || 'Desconhecido'; }
  getProductUnit(id: string) { return this.inventory().find(i => i.id === id)?.unit || ''; }

  async submitRequisition() {
    if (this.draftItems().length === 0) return;
    this.isSubmitting.set(true);
    try {
      await this.reqService.createRequisition({ notes: this.draftNotes(), items: this.draftItems() });
      await this.loadData();
      this.closeNewModal();
    } catch { alert('Erro ao criar requisição'); } 
    finally { this.isSubmitting.set(false); }
  }

  viewDetails(req: Requisition) {
    const cloned = JSON.parse(JSON.stringify(req));
    if (cloned.status === 'pending' && this.canFulfill()) {
      cloned.items.forEach((i: { quantity_fulfilled: number; quantity_requested: number }) => { i.quantity_fulfilled = i.quantity_requested; });
    }
    this.selectedReq.set(cloned);
  }
  closeDetails() { this.selectedReq.set(null); }

  async fulfillRequisition() {
    const req = this.selectedReq();
    if (!req || !req.items) return;
    this.isSubmitting.set(true);
    try {
      await this.reqService.fulfillRequisition(req.id, req.items);
      await this.loadData();
      this.closeDetails();
    } catch { alert('Erro ao atender requisição'); } 
    finally { this.isSubmitting.set(false); }
  }
}
