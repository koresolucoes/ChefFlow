import { Component, inject, signal, computed, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { SupplierService, Supplier } from '../services/supplier.service';
import { PurchaseService, PurchaseOrder } from '../services/purchase.service';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Compras & Fornecedores</h1>
          <p class="text-stone-500 mt-1">Gestão de pedidos, recebimento de mercadorias e fornecedores.</p>
        </div>
        <div class="flex gap-3">
          @if (canManagePurchases()) {
            <button (click)="toggleSupplierForm()" class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
              <mat-icon>{{ showSupplierForm() ? 'close' : 'person_add' }}</mat-icon>
              {{ showSupplierForm() ? 'Cancelar' : 'Novo Fornecedor' }}
            </button>
            <button (click)="toggleOrderForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>{{ showOrderForm() ? 'close' : 'add_shopping_cart' }}</mat-icon>
              {{ showOrderForm() ? 'Cancelar' : 'Novo Pedido' }}
            </button>
          }
        </div>
      </header>

      <!-- Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar border-b border-stone-200">
        <button 
          (click)="activeTab.set('pedidos')"
          [class.border-b-2]="activeTab() === 'pedidos'"
          [class.border-emerald-600]="activeTab() === 'pedidos'"
          [class.text-emerald-700]="activeTab() === 'pedidos'"
          [class.text-stone-500]="activeTab() !== 'pedidos'"
          [class.border-transparent]="activeTab() !== 'pedidos'"
          class="px-4 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors hover:text-emerald-600">
          Pedidos de Compra
        </button>
        <button 
          (click)="activeTab.set('fornecedores')"
          [class.border-b-2]="activeTab() === 'fornecedores'"
          [class.border-emerald-600]="activeTab() === 'fornecedores'"
          [class.text-emerald-700]="activeTab() === 'fornecedores'"
          [class.text-stone-500]="activeTab() !== 'fornecedores'"
          [class.border-transparent]="activeTab() !== 'fornecedores'"
          class="px-4 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors hover:text-emerald-600">
          Fornecedores
        </button>
      </div>

      <!-- Formulário de Fornecedor -->
      @if (showSupplierForm() && activeTab() === 'fornecedores') {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mb-6">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">{{ editingSupplier() ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor' }}</h2>
          
          <form [formGroup]="supplierForm" (ngSubmit)="onSubmitSupplier()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="supplier-name" class="text-sm font-medium text-stone-700">Nome da Empresa</label>
              <input id="supplier-name" type="text" formControlName="name" placeholder="Ex: Hortifruti Silva" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            <div class="space-y-1.5">
              <label for="supplier-contact" class="text-sm font-medium text-stone-700">Nome do Contato</label>
              <input id="supplier-contact" type="text" formControlName="contact_name" placeholder="Ex: João" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            <div class="space-y-1.5">
              <label for="supplier-phone" class="text-sm font-medium text-stone-700">Telefone / WhatsApp</label>
              <input id="supplier-phone" type="text" formControlName="phone" placeholder="Ex: (11) 99999-9999" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            <div class="space-y-1.5">
              <label for="supplier-email" class="text-sm font-medium text-stone-700">E-mail</label>
              <input id="supplier-email" type="email" formControlName="email" placeholder="Ex: contato@hortifruti.com" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            <div class="md:col-span-2 flex justify-end mt-2">
              <button type="submit" [disabled]="supplierForm.invalid || isSubmitting()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">save</mat-icon>
                  Salvar Fornecedor
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Formulário de Pedido de Compra -->
      @if (showOrderForm() && activeTab() === 'pedidos') {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mb-6">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Novo Pedido de Compra</h2>
          
          <form [formGroup]="orderForm" (ngSubmit)="onSubmitOrder()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="order-supplier" class="text-sm font-medium text-stone-700">Fornecedor</label>
                <select id="order-supplier" formControlName="supplier_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="">Selecione um fornecedor...</option>
                  @for (supplier of supplierService.suppliers(); track supplier.id) {
                    <option [value]="supplier.id">{{ supplier.name }}</option>
                  }
                </select>
              </div>
              <div class="space-y-1.5">
                <label for="order-delivery-date" class="text-sm font-medium text-stone-700">Data de Entrega Esperada</label>
                <input id="order-delivery-date" type="date" formControlName="expected_delivery_date" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>
            </div>

            <div class="border-t border-stone-200 pt-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-md font-semibold text-stone-800">Itens do Pedido</h3>
                <button type="button" (click)="addOrderItem()" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <mat-icon class="text-[18px] w-4.5 h-4.5">add</mat-icon>
                  Adicionar Item
                </button>
              </div>

              <div formArrayName="items" class="space-y-3">
                @for (item of orderItems.controls; track $index) {
                  <div [formGroupName]="$index" class="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <div class="flex-1 w-full">
                      <select formControlName="inventory_id" class="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                        <option value="">Selecione um item do estoque...</option>
                        @for (invItem of centralInventoryItems(); track invItem.id) {
                          <option [value]="invItem.id">{{ invItem.name }} ({{ invItem.unit }}) - Atual: {{ invItem.quantity }}</option>
                        }
                      </select>
                    </div>
                    <div class="w-full sm:w-32">
                      <input type="number" formControlName="quantity_ordered" placeholder="Qtd" min="0.01" step="0.01" class="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                    </div>
                    <div class="w-full sm:w-32 relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">R$</span>
                      <input type="number" formControlName="unit_cost" placeholder="Custo Un." min="0" step="0.01" class="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                    </div>
                    <button type="button" (click)="removeOrderItem($index)" class="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
                @if (orderItems.length === 0) {
                  <p class="text-sm text-stone-500 text-center py-4">Nenhum item adicionado ao pedido.</p>
                }
              </div>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-stone-200">
              <div class="text-lg font-bold text-stone-900">
                Total Estimado: {{ calculateOrderTotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </div>
              <button type="submit" [disabled]="orderForm.invalid || orderItems.length === 0 || isSubmitting()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Gerando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">check</mat-icon>
                  Gerar Pedido
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Modal de Recebimento de Pedido -->
      @if (receivingOrder()) {
        <div class="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div class="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h2 class="text-xl font-bold text-stone-900">Receber Mercadoria</h2>
                <p class="text-sm text-stone-500 mt-1">Pedido #{{ receivingOrder()?.id?.substring(0, 8) }} - {{ receivingOrder()?.suppliers?.name }}</p>
              </div>
              <button (click)="cancelReceive()" class="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-1">
              <form [formGroup]="receiveForm" class="space-y-4">
                <div formArrayName="items" class="space-y-4">
                  @for (item of receiveItems.controls; track $index) {
                    <div [formGroupName]="$index" class="bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <div class="font-medium text-stone-900 mb-2">{{ getReceiveItemName($index) }}</div>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">Qtd. Pedida</span>
                          <div class="px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-700 font-medium">
                            {{ getReceiveItemOrderedQty($index) }}
                          </div>
                        </div>
                        <div>
                          <label [for]="'receive-qty-' + $index" class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">Qtd. Recebida</label>
                          <input [id]="'receive-qty-' + $index" type="number" formControlName="quantity_received" min="0" step="0.01" class="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                        </div>
                        <div>
                          <label [for]="'receive-cost-' + $index" class="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">Custo Unitário Real (R$)</label>
                          <input [id]="'receive-cost-' + $index" type="number" formControlName="unit_cost" min="0" step="0.01" class="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </form>
            </div>
            
            <div class="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
              <button (click)="cancelReceive()" class="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button (click)="confirmReceive()" [disabled]="receiveForm.invalid || isSubmitting()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Processando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">inventory_2</mat-icon>
                  Confirmar Recebimento
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Listagem de Pedidos -->
      @if (activeTab() === 'pedidos') {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                  <th class="px-6 py-4 font-semibold">ID / Data</th>
                  <th class="px-6 py-4 font-semibold">Fornecedor</th>
                  <th class="px-6 py-4 font-semibold">Previsão</th>
                  <th class="px-6 py-4 font-semibold">Total</th>
                  <th class="px-6 py-4 font-semibold">Status</th>
                  <th class="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200">
                @if (purchaseService.isLoading()) {
                  <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-stone-500">
                      <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
                      <p>Carregando pedidos...</p>
                    </td>
                  </tr>
                } @else if (purchaseService.orders().length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-stone-500">
                      <p>Nenhum pedido de compra encontrado.</p>
                    </td>
                  </tr>
                } @else {
                  @for (order of purchaseService.orders(); track order.id) {
                    <tr class="hover:bg-stone-50/50 transition-colors">
                      <td class="px-6 py-4">
                        <div class="font-medium text-stone-900">#{{ order.id.substring(0, 8) }}</div>
                        <div class="text-xs text-stone-500">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</div>
                      </td>
                      <td class="px-6 py-4 font-medium text-stone-900">
                        {{ order.suppliers?.name }}
                      </td>
                      <td class="px-6 py-4 text-stone-600">
                        {{ order.expected_delivery_date ? (order.expected_delivery_date | date:'dd/MM/yyyy') : '-' }}
                      </td>
                      <td class="px-6 py-4 font-medium text-stone-900">
                        {{ order.total_cost | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </td>
                      <td class="px-6 py-4">
                        @if (order.status === 'ordered') {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                            <mat-icon class="text-[14px] w-3.5 h-3.5">local_shipping</mat-icon>
                            Aguardando
                          </span>
                        } @else if (order.status === 'received') {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                            <mat-icon class="text-[14px] w-3.5 h-3.5">inventory_2</mat-icon>
                            Recebido
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            <mat-icon class="text-[14px] w-3.5 h-3.5">cancel</mat-icon>
                            Cancelado
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4 text-right">
                        @if (order.status === 'ordered' && canManagePurchases()) {
                          <button (click)="openReceiveModal(order)" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors mr-2">
                            Receber
                          </button>
                          <button (click)="cancelOrder(order.id)" class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar Pedido">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">block</mat-icon>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          <!-- Mobile View for Orders -->
          <div class="md:hidden divide-y divide-stone-200">
             @for (order of purchaseService.orders(); track order.id) {
                <div class="p-4 space-y-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium text-stone-900 text-base">{{ order.suppliers?.name }}</div>
                      <div class="text-xs text-stone-500">#{{ order.id.substring(0, 8) }}</div>
                    </div>
                    @if (order.status === 'ordered') {
                      <span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">Aguardando</span>
                    } @else if (order.status === 'received') {
                      <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">Recebido</span>
                    } @else {
                      <span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wider">Cancelado</span>
                    }
                  </div>
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-stone-500">Total:</span>
                    <span class="font-bold text-stone-900">{{ order.total_cost | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  </div>
                  @if (order.status === 'ordered' && canManagePurchases()) {
                    <div class="flex gap-2 pt-2 border-t border-stone-100">
                      <button (click)="openReceiveModal(order)" class="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors text-center">
                        Receber
                      </button>
                      <button (click)="cancelOrder(order.id)" class="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <mat-icon class="text-[20px] w-5 h-5">block</mat-icon>
                      </button>
                    </div>
                  }
                </div>
             }
          </div>
        </div>
      }

      <!-- Listagem de Fornecedores -->
      @if (activeTab() === 'fornecedores') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @if (supplierService.isLoading()) {
            <div class="col-span-full py-8 text-center text-stone-500">
              <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
              <p>Carregando fornecedores...</p>
            </div>
          } @else if (supplierService.suppliers().length === 0) {
            <div class="col-span-full py-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
              <p>Nenhum fornecedor cadastrado.</p>
            </div>
          } @else {
            @for (supplier of supplierService.suppliers(); track supplier.id) {
              <div class="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-bold text-stone-900 text-lg">{{ supplier.name }}</h3>
                    <p class="text-sm text-stone-500">{{ supplier.contact_name || 'Sem contato' }}</p>
                  </div>
                  @if (canManagePurchases()) {
                    <div class="flex gap-1">
                      <button (click)="editSupplier(supplier)" class="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <mat-icon class="text-[18px] w-4.5 h-4.5">edit</mat-icon>
                      </button>
                      <button (click)="removeSupplier(supplier.id)" class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <mat-icon class="text-[18px] w-4.5 h-4.5">delete_outline</mat-icon>
                      </button>
                    </div>
                  }
                </div>
                <div class="space-y-2 mt-auto pt-4 border-t border-stone-100">
                  <div class="flex items-center gap-2 text-sm text-stone-600">
                    <mat-icon class="text-[16px] w-4 h-4 text-stone-400">phone</mat-icon>
                    {{ supplier.phone || '-' }}
                  </div>
                  <div class="flex items-center gap-2 text-sm text-stone-600">
                    <mat-icon class="text-[16px] w-4 h-4 text-stone-400">email</mat-icon>
                    <span class="truncate">{{ supplier.email || '-' }}</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class ComprasComponent {
  supplierService = inject(SupplierService);
  purchaseService = inject(PurchaseService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  activeTab = signal<'pedidos' | 'fornecedores'>('pedidos');
  showSupplierForm = signal(false);
  showOrderForm = signal(false);
  isSubmitting = signal(false);
  editingSupplier = signal<Supplier | null>(null);
  receivingOrder = signal<PurchaseOrder | null>(null);

  supplierForm = this.fb.group({
    name: ['', Validators.required],
    contact_name: [''],
    phone: [''],
    email: ['', Validators.email]
  });

  orderForm = this.fb.group({
    supplier_id: ['', Validators.required],
    expected_delivery_date: [''],
    items: this.fb.array([])
  });

  receiveForm = this.fb.group({
    items: this.fb.array([])
  });

  centralInventoryItems = computed(() => {
    // Only items from central inventory
    return this.inventoryService.items().filter(i => !i.team_id);
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.supplierService.loadSuppliers();
        this.purchaseService.loadOrders();
        this.inventoryService.loadItems('central');
      }
    }, { allowSignalWrites: true });
  }

  get orderItems() {
    return this.orderForm.get('items') as FormArray;
  }

  get receiveItems() {
    return this.receiveForm.get('items') as FormArray;
  }

  canManagePurchases(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin' || user?.role === 'estoque';
  }

  // --- Supplier Logic ---

  toggleSupplierForm() {
    this.showSupplierForm.update(v => !v);
    if (!this.showSupplierForm()) {
      this.supplierForm.reset();
      this.editingSupplier.set(null);
    } else {
      this.showOrderForm.set(false);
      this.activeTab.set('fornecedores');
    }
  }

  editSupplier(supplier: Supplier) {
    this.editingSupplier.set(supplier);
    this.supplierForm.patchValue({
      name: supplier.name,
      contact_name: supplier.contact_name,
      phone: supplier.phone,
      email: supplier.email
    });
    this.showSupplierForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async onSubmitSupplier() {
    if (this.supplierForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.supplierForm.value;
      const editing = this.editingSupplier();
      
      let success = false;
      if (editing) {
        success = await this.supplierService.updateSupplier({
          id: editing.id,
          ...formValue
        });
      } else {
        success = await this.supplierService.addSupplier(formValue);
      }
      
      this.isSubmitting.set(false);
      if (success) {
        this.toggleSupplierForm();
      }
    }
  }

  async removeSupplier(id: string) {
    if (confirm('Tem certeza que deseja remover este fornecedor?')) {
      await this.supplierService.removeSupplier(id);
    }
  }

  // --- Purchase Order Logic ---

  toggleOrderForm() {
    this.showOrderForm.update(v => !v);
    if (!this.showOrderForm()) {
      this.orderForm.reset();
      this.orderItems.clear();
    } else {
      this.showSupplierForm.set(false);
      this.activeTab.set('pedidos');
      if (this.orderItems.length === 0) {
        this.addOrderItem();
      }
    }
  }

  addOrderItem() {
    const itemForm = this.fb.group({
      inventory_id: ['', Validators.required],
      quantity_ordered: [1, [Validators.required, Validators.min(0.01)]],
      unit_cost: [0, [Validators.required, Validators.min(0)]]
    });
    this.orderItems.push(itemForm);
  }

  removeOrderItem(index: number) {
    this.orderItems.removeAt(index);
  }

  calculateOrderTotal(): number {
    let total = 0;
    for (const control of this.orderItems.controls) {
      const qty = control.get('quantity_ordered')?.value || 0;
      const cost = control.get('unit_cost')?.value || 0;
      total += (qty * cost);
    }
    return total;
  }

  async onSubmitOrder() {
    if (this.orderForm.valid && this.orderItems.length > 0) {
      this.isSubmitting.set(true);
      const formValue = this.orderForm.value;
      
      const success = await this.purchaseService.createOrder({
        supplier_id: formValue.supplier_id!,
        expected_delivery_date: formValue.expected_delivery_date || undefined,
        items: formValue.items!
      });
      
      this.isSubmitting.set(false);
      if (success) {
        this.toggleOrderForm();
      }
    }
  }

  async cancelOrder(id: string) {
    if (confirm('Tem certeza que deseja cancelar este pedido?')) {
      await this.purchaseService.cancelOrder(id);
    }
  }

  // --- Receive Order Logic ---

  openReceiveModal(order: PurchaseOrder) {
    this.receivingOrder.set(order);
    this.receiveItems.clear();
    
    if (order.purchase_order_items) {
      order.purchase_order_items.forEach(item => {
        this.receiveItems.push(this.fb.group({
          id: [item.id],
          inventory_id: [item.inventory_id],
          quantity_received: [item.quantity_ordered, [Validators.required, Validators.min(0)]],
          unit_cost: [item.unit_cost, [Validators.required, Validators.min(0)]]
        }));
      });
    }
  }

  cancelReceive() {
    this.receivingOrder.set(null);
    this.receiveItems.clear();
  }

  getReceiveItemName(index: number): string {
    const order = this.receivingOrder();
    if (!order || !order.purchase_order_items) return '';
    const item = order.purchase_order_items[index];
    return item?.inventory?.name ? `${item.inventory.name} (${item.inventory.unit})` : 'Item Desconhecido';
  }

  getReceiveItemOrderedQty(index: number): number {
    const order = this.receivingOrder();
    if (!order || !order.purchase_order_items) return 0;
    return order.purchase_order_items[index]?.quantity_ordered || 0;
  }

  async confirmReceive() {
    if (this.receiveForm.valid) {
      const order = this.receivingOrder();
      if (!order) return;

      this.isSubmitting.set(true);
      const items = this.receiveForm.value.items;
      
      const success = await this.purchaseService.receiveOrder(order.id, items);
      
      this.isSubmitting.set(false);
      if (success) {
        this.cancelReceive();
        // Reload inventory to reflect new quantities and costs
        this.inventoryService.loadItems('central');
      }
    }
  }
}
