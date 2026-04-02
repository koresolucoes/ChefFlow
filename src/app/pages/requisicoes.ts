import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RequisitionService, Requisition, RequisitionItem } from '../services/requisition.service';
import { InventoryService, InventoryItem } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';
import { ExportService } from '../services/export.service';
import { TeamService } from '../services/team.service';

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
        
        <div class="flex gap-3">
          <button (click)="exportarRelatorio()" class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
            <mat-icon>download</mat-icon>
            <span class="hidden sm:inline">Exportar CSV</span>
          </button>
          @if (canRequest()) {
            <button (click)="openNewModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
              <mat-icon>add</mat-icon>
              <span class="hidden sm:inline">Nova Requisição</span>
              <span class="sm:hidden">Nova</span>
            </button>
          }
        </div>
      </div>

      <!-- Abas de Praças (Apenas para Admin/Estoque) -->
      @if (canViewAllTeams()) {
        <div class="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar border-b border-stone-200">
          <button 
            (click)="setActiveTeam('all')"
            [class.border-b-2]="activeTeamId() === 'all'"
            [class.border-emerald-600]="activeTeamId() === 'all'"
            [class.text-emerald-700]="activeTeamId() === 'all'"
            [class.text-stone-500]="activeTeamId() !== 'all'"
            [class.border-transparent]="activeTeamId() !== 'all'"
            class="px-4 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors hover:text-emerald-600">
            Todas as Praças
          </button>
          @for (team of teamService.teams(); track team.id) {
            <button 
              (click)="setActiveTeam(team.id)"
              [class.border-b-2]="activeTeamId() === team.id"
              [class.border-emerald-600]="activeTeamId() === team.id"
              [class.text-emerald-700]="activeTeamId() === team.id"
              [class.text-stone-500]="activeTeamId() !== team.id"
              [class.border-transparent]="activeTeamId() !== team.id"
              class="px-4 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors hover:text-emerald-600">
              {{ team.name }}
            </button>
          }
        </div>
      } @else {
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 mb-6">
          <mat-icon class="text-emerald-600">kitchen</mat-icon>
          <div>
            <h3 class="font-bold text-emerald-800">Requisições da Praça</h3>
            <p class="text-sm text-emerald-600">Você está visualizando as requisições da sua estação.</p>
          </div>
        </div>
      }

      <!-- Lista de Requisições -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <!-- Desktop View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 border-b border-stone-200 text-sm text-stone-500">
                <th class="p-4 font-medium">Data</th>
                <th class="p-4 font-medium">Solicitante</th>
                <th class="p-4 font-medium">Praça</th>
                <th class="p-4 font-medium">Status</th>
                <th class="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @for (req of requisitions(); track req.id) {
                <tr class="hover:bg-stone-50 transition-colors">
                  <td class="p-4 text-stone-800">{{ req.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="p-4 text-stone-800">{{ req.requester?.name || 'N/A' }}</td>
                  <td class="p-4 text-stone-800">{{ req.team?.name || 'Central' }}</td>
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
                <tr><td colspan="5" class="p-8 text-center text-stone-500">Nenhuma requisição encontrada.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile View -->
        <div class="md:hidden divide-y divide-stone-100">
          @for (req of requisitions(); track req.id) {
            <div class="p-4 bg-white hover:bg-stone-50 transition-colors cursor-pointer" (click)="viewDetails(req)" (keydown.enter)="viewDetails(req)" tabindex="0" role="button">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="text-sm font-bold text-stone-900">Req #{{ req.id.substring(0, 8) }}</div>
                  <div class="text-xs text-stone-500 mt-0.5">{{ req.created_at | date:'dd/MM HH:mm' }}</div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  [ngClass]="{
                    'bg-amber-100 text-amber-800': req.status === 'pending',
                    'bg-blue-100 text-blue-800': req.status === 'partial',
                    'bg-emerald-100 text-emerald-800': req.status === 'completed',
                    'bg-rose-100 text-rose-800': req.status === 'cancelled'
                  }">
                  {{ getStatusLabel(req.status) }}
                </span>
              </div>
              <div class="flex justify-between items-center mt-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                    {{ req.requester?.name?.charAt(0) || 'U' }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm text-stone-700 leading-tight">{{ req.requester?.name || 'N/A' }}</span>
                    <span class="text-[10px] text-stone-500 font-medium uppercase tracking-wider">{{ req.team?.name || 'Central' }}</span>
                  </div>
                </div>
                <mat-icon class="text-stone-400 text-[20px] w-5 h-5">chevron_right</mat-icon>
              </div>
            </div>
          }
          @if (requisitions().length === 0) {
            <div class="p-8 text-center text-stone-500">Nenhuma requisição encontrada.</div>
          }
        </div>
      </div>

      <!-- Modal Nova Requisição (Para Cozinheiros/Chefs) -->
      @if (showNewModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div class="p-4 md:p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-2xl">
              <h2 class="text-lg md:text-xl font-bold text-stone-800 flex items-center gap-2">
                <mat-icon class="text-emerald-600">add_shopping_cart</mat-icon>
                Nova Requisição
              </h2>
              <button (click)="closeNewModal()" class="text-stone-400 hover:text-stone-600 p-2 rounded-full hover:bg-stone-200 transition-colors"><mat-icon>close</mat-icon></button>
            </div>
            
            <div class="p-4 md:p-6 overflow-y-auto flex-1">
              <div class="mb-6 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <label for="req-product" class="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wider">Adicionar Item</label>
                <div class="flex flex-col sm:flex-row gap-3">
                  <select id="req-product" [(ngModel)]="selectedProductId" class="flex-1 border-2 border-stone-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-stone-800 font-medium bg-stone-50">
                    <option value="">Selecione um produto...</option>
                    @for (item of inventory(); track item.id) {
                      <option [value]="item.id">{{ item.name }} ({{ item.unit }}) - Estoque: {{ item.quantity }}</option>
                    }
                  </select>
                  <div class="flex gap-2">
                    <input type="number" [(ngModel)]="selectedQuantity" placeholder="Qtd" min="0.1" step="0.1" class="w-full sm:w-24 border-2 border-stone-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-center font-bold text-stone-800 bg-stone-50">
                    <button (click)="addDraftItem()" class="bg-stone-900 text-white px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors shadow-sm flex items-center justify-center shrink-0 active:scale-95">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              @if (draftItems().length > 0) {
                <div class="mt-6">
                  <h3 class="text-sm font-bold text-stone-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <mat-icon class="text-[18px] w-4.5 h-4.5 text-emerald-600">list_alt</mat-icon>
                    Itens Solicitados ({{ draftItems().length }})
                  </h3>
                  <ul class="divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    @for (item of draftItems(); track item.product_id; let i = $index) {
                      <li class="p-4 flex justify-between items-center hover:bg-stone-50 transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {{ item.quantity_requested }}
                          </div>
                          <div>
                            <span class="font-bold text-stone-800 block">{{ getProductName(item.product_id) }}</span>
                            <span class="text-stone-500 text-xs font-medium uppercase tracking-wider">{{ getProductUnit(item.product_id) }}</span>
                          </div>
                        </div>
                        <button (click)="removeDraftItem(i)" class="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }

              <div class="mt-6">
                <label for="req-notes" class="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wider">Observações (Opcional)</label>
                <textarea id="req-notes" [(ngModel)]="draftNotes" rows="3" class="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none bg-stone-50" placeholder="Ex: Urgente para o jantar, precisamos para a praça de grelhados..."></textarea>
              </div>
            </div>

            <div class="p-4 md:p-6 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button (click)="closeNewModal()" class="w-full sm:w-auto px-6 py-3 text-stone-600 font-bold hover:bg-stone-200 rounded-xl transition-colors text-center">Cancelar</button>
              <button (click)="submitRequisition()" [disabled]="draftItems().length === 0 || isSubmitting()" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin">autorenew</mat-icon>
                  Enviando...
                } @else {
                  <mat-icon>send</mat-icon>
                  Enviar Pedido
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Detalhes / Atendimento (Para Estoque/Admin) -->
      @if (selectedReq()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div class="p-4 md:p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 rounded-t-2xl">
              <div>
                <h2 class="text-lg md:text-xl font-bold text-stone-800 flex items-center gap-2">
                  <mat-icon class="text-emerald-600">receipt_long</mat-icon>
                  Requisição #{{ selectedReq()!.id.substring(0, 8) }}
                </h2>
                <p class="text-sm text-stone-500 mt-1 flex items-center gap-1">
                  <mat-icon class="text-[16px] w-4 h-4">person</mat-icon>
                  Solicitado por <span class="font-bold">{{ selectedReq()!.requester?.name }}</span>
                </p>
              </div>
              <button (click)="closeDetails()" class="text-stone-400 hover:text-stone-600 p-2 rounded-full hover:bg-stone-200 transition-colors"><mat-icon>close</mat-icon></button>
            </div>
            
            <div class="p-4 md:p-6 overflow-y-auto flex-1">
              @if (selectedReq()!.notes) {
                <div class="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                  <h4 class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <mat-icon class="text-[16px] w-4 h-4">speaker_notes</mat-icon>
                    Observações do Solicitante
                  </h4>
                  <p class="text-amber-900 text-sm font-medium">{{ selectedReq()!.notes }}</p>
                </div>
              }

              <div class="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                <!-- Desktop Table -->
                <div class="hidden md:block">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                        <th class="p-4">Produto</th>
                        <th class="p-4 text-center">Solicitado</th>
                        <th class="p-4 text-center">Atendido</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                      @for (item of selectedReq()!.items; track item.id) {
                        <tr class="hover:bg-stone-50 transition-colors">
                          <td class="p-4 text-stone-800 font-bold">{{ item.inventory?.item_name }}</td>
                          <td class="p-4 text-center">
                            <span class="inline-flex items-center justify-center px-3 py-1 bg-stone-100 text-stone-700 rounded-full font-bold text-sm">
                              {{ item.quantity_requested }} <span class="text-xs ml-1 font-medium">{{ item.inventory?.unit }}</span>
                            </span>
                          </td>
                          <td class="p-4 text-center">
                            @if (canFulfill() && selectedReq()!.status === 'pending') {
                              <div class="flex items-center justify-center gap-2">
                                <input type="number" [(ngModel)]="item.quantity_fulfilled" min="0" step="0.1" class="w-24 text-center border-2 border-stone-200 rounded-xl px-3 py-2 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-stone-800 transition-all">
                                <span class="text-stone-500 text-sm font-medium">{{ item.inventory?.unit }}</span>
                              </div>
                            } @else {
                              <span class="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm">
                                {{ item.quantity_fulfilled || 0 }} <span class="text-xs ml-1 font-medium">{{ item.inventory?.unit }}</span>
                              </span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Mobile List -->
                <div class="md:hidden divide-y divide-stone-100">
                  @for (item of selectedReq()!.items; track item.id) {
                    <div class="p-4">
                      <div class="font-bold text-stone-800 mb-3">{{ item.inventory?.item_name }}</div>
                      <div class="flex items-center justify-between gap-4">
                        <div class="flex-1">
                          <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Solicitado</div>
                          <div class="inline-flex items-center justify-center px-3 py-1 bg-stone-100 text-stone-700 rounded-full font-bold text-sm">
                            {{ item.quantity_requested }} <span class="text-xs ml-1 font-medium">{{ item.inventory?.unit }}</span>
                          </div>
                        </div>
                        <div class="flex-1 text-right">
                          <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Atendido</div>
                          @if (canFulfill() && selectedReq()!.status === 'pending') {
                            <div class="flex items-center justify-end gap-1">
                              <input type="number" [(ngModel)]="item.quantity_fulfilled" min="0" step="0.1" class="w-20 text-center border-2 border-stone-200 rounded-xl px-2 py-1.5 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-stone-800 transition-all">
                              <span class="text-stone-500 text-xs font-medium">{{ item.inventory?.unit }}</span>
                            </div>
                          } @else {
                            <span class="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm">
                              {{ item.quantity_fulfilled || 0 }} <span class="text-xs ml-1 font-medium">{{ item.inventory?.unit }}</span>
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="p-4 md:p-6 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button (click)="closeDetails()" class="w-full sm:w-auto px-6 py-3 text-stone-600 font-bold hover:bg-stone-200 rounded-xl transition-colors text-center">Fechar</button>
              
              @if (canFulfill() && selectedReq()!.status === 'pending') {
                <button (click)="fulfillRequisition()" [disabled]="isSubmitting()" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95">
                  @if (isSubmitting()) {
                    <mat-icon class="animate-spin">autorenew</mat-icon>
                    Processando...
                  } @else {
                    <mat-icon>check_circle</mat-icon>
                    Finalizar Atendimento
                  }
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
  private exportService = inject(ExportService);
  teamService = inject(TeamService);

  requisitions = signal<Requisition[]>([]);
  inventory = signal<InventoryItem[]>([]);
  showNewModal = signal(false);
  selectedReq = signal<Requisition | null>(null);
  isSubmitting = signal(false);
  activeTeamId = signal<string>('all');

  selectedProductId = signal('');
  selectedQuantity = signal<number | null>(null);
  draftItems = signal<RequisitionItem[]>([]);
  draftNotes = signal('');

  currentUser = this.authService.currentUser;

  canRequest = computed(() => ['chef', 'cook', 'admin'].includes(this.currentUser()?.role || ''));
  canFulfill = computed(() => ['estoque', 'admin'].includes(this.currentUser()?.role || ''));

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        if (this.canViewAllTeams()) {
          this.teamService.loadTeams();
          this.loadData(this.activeTeamId() === 'all' ? undefined : this.activeTeamId());
        } else {
          this.activeTeamId.set(user.team_id || 'all');
          this.loadData(user.team_id || undefined);
        }
      }
    });
  }

  ngOnInit() { 
    // Handled by effect
  }

  canViewAllTeams(): boolean {
    const user = this.currentUser();
    return user?.role === 'admin' || user?.role === 'estoque';
  }

  setActiveTeam(teamId: string) {
    this.activeTeamId.set(teamId);
    this.loadData(teamId === 'all' ? undefined : teamId);
  }

  async loadData(teamId?: string) {
    try {
      const [reqs, inv] = await Promise.all([this.reqService.getRequisitions(teamId), this.invService.getItems('central')]);
      this.requisitions.set(reqs);
      this.inventory.set(inv);
    } catch (error) { console.error(error); }
  }

  getStatusLabel(status: string) {
    const map: Record<string, string> = { 'pending': 'Pendente', 'partial': 'Parcial', 'completed': 'Atendido', 'cancelled': 'Cancelado' };
    return map[status] || status;
  }

  exportarRelatorio() {
    const data = this.requisitions().map(req => ({
      id: req.id.substring(0, 8),
      data: new Date(req.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(req.created_at).toLocaleTimeString('pt-BR'),
      solicitante: req.requester?.name || 'N/A',
      status: this.getStatusLabel(req.status),
      itens_solicitados: req.items?.length || 0,
      observacoes: req.notes || ''
    }));

    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'data', label: 'Data da Solicitação' },
      { key: 'solicitante', label: 'Solicitante' },
      { key: 'status', label: 'Status' },
      { key: 'itens_solicitados', label: 'Qtd. Itens' },
      { key: 'observacoes', label: 'Observações' }
    ];

    this.exportService.exportToCsv('Relatorio_Requisicoes', data, headers);
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
      await this.loadData(this.activeTeamId() === 'all' ? undefined : this.activeTeamId());
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
      await this.loadData(this.activeTeamId() === 'all' ? undefined : this.activeTeamId());
      this.closeDetails();
    } catch { alert('Erro ao atender requisição'); } 
    finally { this.isSubmitting.set(false); }
  }
}
