import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WasteLogService, WasteLog } from '../services/waste-log.service';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-desperdicio',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Waste Log (Desperdício)</h1>
          <p class="text-stone-500 mt-1">Registro rápido de perdas e quebras para controle de CMV.</p>
        </div>
        <button (click)="toggleForm()" class="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          <span>{{ showForm() ? 'Cancelar' : 'Registrar Perda' }}</span>
        </button>
      </header>

      @if (showForm()) {
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
            <mat-icon class="text-rose-600">warning</mat-icon> Registrar Nova Perda
          </h2>
          
          <form [formGroup]="logForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5 md:col-span-2">
                <label for="inventoryItem" class="text-sm font-medium text-stone-700">Item do Estoque *</label>
                <select id="inventoryItem" formControlName="inventory_item_id" (change)="onItemChange()" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors">
                  <option value="">Selecione o insumo perdido...</option>
                  @for (item of inventoryService.items(); track item.id) {
                    <option [value]="item.id">{{ item.name }} ({{ item.unit }})</option>
                  }
                </select>
              </div>

              <div class="space-y-1.5">
                <label for="quantity" class="text-sm font-medium text-stone-700">Quantidade Perdida *</label>
                <div class="flex gap-2">
                  <input id="quantity" type="number" step="0.01" min="0.01" formControlName="quantity" (input)="calculaImpacto()" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors">
                  <input type="text" formControlName="unit" readonly class="w-20 px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed">
                </div>
              </div>

              <div class="space-y-1.5">
                <label for="reason" class="text-sm font-medium text-stone-700">Motivo *</label>
                <select id="reason" formControlName="reason" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors">
                  <option value="Vencido">Data de Validade (Vencido)</option>
                  <option value="Quebra">Quebra Acidental</option>
                  <option value="Queimado">Erro de Preparo (Queimado/Passou do ponto)</option>
                  <option value="Estragado">Estragou antes da validade</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              <div class="space-y-1.5">
                <label for="costImpact" class="text-sm font-medium text-stone-700">Impacto no Custo (R$)</label>
                <input id="costImpact" type="number" step="0.01" formControlName="cost_impact" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors">
              </div>

              <div class="space-y-1.5 md:col-span-2">
                <label for="notes" class="text-sm font-medium text-stone-700">Observações adicionais</label>
                <input id="notes" type="text" formControlName="notes" placeholder="Detalhe o ocorrido..." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors">
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-stone-100">
              <button type="submit" [disabled]="logForm.invalid || isSubmitting()" class="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon> Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">delete_sweep</mat-icon> Registrar Perca
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Resumo KPI -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <mat-icon class="text-3xl w-8 h-8">trending_down</mat-icon>
          </div>
          <div>
            <p class="text-sm text-stone-500 font-medium">Impacto Total R$</p>
            <p class="text-2xl font-bold text-stone-900">{{ totalImpact() | currency:'BRL' }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <mat-icon class="text-3xl w-8 h-8">warning</mat-icon>
          </div>
          <div>
            <p class="text-sm text-stone-500 font-medium">Total de Registros</p>
            <p class="text-2xl font-bold text-stone-900">{{ logService.logs().length }}</p>
          </div>
        </div>
      </div>

      <!-- Tabela de Registros -->
      <div class="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-stone-50 text-stone-600 font-medium border-b border-stone-200">
              <tr>
                <th class="px-4 py-3">Insumo</th>
                <th class="px-4 py-3">Qtd Perdida</th>
                <th class="px-4 py-3">Motivo</th>
                <th class="px-4 py-3">Impacto R$</th>
                <th class="px-4 py-3">Registrado por</th>
                <th class="px-4 py-3">Data/Hora</th>
                <th class="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @if (logService.isLoading()) {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-stone-400">
                    <mat-icon class="animate-spin text-3xl">refresh</mat-icon>
                    <p class="mt-2 font-medium">Carregando registros...</p>
                  </td>
                </tr>
              } @else if (logService.logs().length === 0) {
                <tr>
                  <td colspan="7" class="px-4 py-12 text-center text-stone-500">
                    <mat-icon class="text-4xl text-stone-300 mb-2">check_circle</mat-icon>
                    <p class="font-medium text-stone-900">Nenhum desperdício registrado.</p>
                    <p class="text-sm mt-1">Ótimo trabalho! Mantenha a equipe eficiente.</p>
                  </td>
                </tr>
              } @else {
                @for (log of logService.logs(); track log.id) {
                  <tr class="hover:bg-stone-50/50 transition-colors">
                    <td class="px-4 py-3 font-medium text-stone-900">{{ log.inventory_item?.name || 'Insumo Apagado' }}</td>
                    <td class="px-4 py-3 text-stone-700 font-bold bg-rose-50/30 rounded">{{ log.quantity }} {{ log.unit }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-100 text-stone-700 text-xs font-semibold">
                        {{ log.reason }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-rose-600 font-medium">{{ log.cost_impact | currency:'BRL' }}</td>
                    <td class="px-4 py-3 text-stone-600">{{ log.user?.name || '-' }}</td>
                    <td class="px-4 py-3 text-stone-500">{{ log.created_at | date:'short' }}</td>
                    <td class="px-4 py-3 text-right">
                      @if (canDelete()) {
                        <button (click)="deleteLog(log.id)" class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Remover registro">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon>
                        </button>
                      }
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
export class DesperdicioComponent implements OnInit {
  logService = inject(WasteLogService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  showForm = signal(false);
  isSubmitting = signal(false);

  logForm = this.fb.group({
    inventory_item_id: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0.01)]],
    unit: [''],
    reason: ['Quebra', Validators.required],
    notes: [''],
    cost_impact: [0]
  });

  totalImpact = computed(() => {
    return this.logService.logs().reduce((acc, curr) => acc + (Number(curr.cost_impact) || 0), 0);
  });

  ngOnInit() {
    this.logService.loadLogs();
    
    // Carega estoque se tiver vazio
    if (this.inventoryService.items().length === 0) {
      this.inventoryService.loadItems();
    }
  }

  canDelete(): boolean {
    const userRole = this.authService.currentUser()?.role;
    return userRole === 'admin' || userRole === 'chef';
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.logForm.reset({ reason: 'Quebra' });
    }
  }

  onItemChange() {
    const itemId = this.logForm.get('inventory_item_id')?.value;
    if (itemId) {
      const item = this.inventoryService.items().find(i => i.id === itemId);
      if (item) {
        this.logForm.patchValue({ unit: item.unit });
        this.calculaImpacto();
      }
    } else {
      this.logForm.patchValue({ unit: '' });
    }
  }

  calculaImpacto() {
    const itemId = this.logForm.get('inventory_item_id')?.value;
    const qtd = this.logForm.get('quantity')?.value || 0;
    
    if (itemId && qtd > 0) {
      const item = this.inventoryService.items().find(i => i.id === itemId);
      if (item && item.cost_per_unit) {
        const cost = qtd * item.cost_per_unit;
        this.logForm.patchValue({ cost_impact: parseFloat(cost.toFixed(2)) });
      }
    }
  }

  async onSubmit() {
    if (this.logForm.valid) {
      this.isSubmitting.set(true);
      const val = this.logForm.value;
      const logData: Partial<WasteLog> = {
        inventory_item_id: val.inventory_item_id || '',
        quantity: val.quantity || 0,
        unit: val.unit || '',
        reason: val.reason || '',
        notes: val.notes || '',
        cost_impact: val.cost_impact || 0
      };
      const success = await this.logService.addLog(logData);
      this.isSubmitting.set(false);
      
      if (success) {
        this.toggleForm();
      }
    }
  }

  async deleteLog(id: string) {
    if (confirm('Atenção: Tem certeza que deseja excluir este registro de perda?')) {
      await this.logService.deleteLog(id);
    }
  }
}
