import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Supplier } from './supplier.service';
import { InventoryItem } from './inventory.service';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  inventory?: Partial<InventoryItem>;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  status: 'ordered' | 'received' | 'cancelled';
  expected_delivery_date?: string;
  total_cost: number;
  tenant_id?: string;
  created_at?: string;
  suppliers?: Partial<Supplier>;
  purchase_order_items?: PurchaseOrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/purchases`;

  orders = signal<PurchaseOrder[]>([]);
  isLoading = signal(false);

  async loadOrders() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.http.get<PurchaseOrder[]>(this.apiUrl));
      this.orders.set(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createOrder(orderData: { supplier_id: string, expected_delivery_date?: string, items: Record<string, unknown>[] }): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<PurchaseOrder>(this.apiUrl, orderData));
      await this.loadOrders(); // Reload to get the joined data (supplier, items)
      return true;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      return false;
    }
  }

  async receiveOrder(id: string, items: Record<string, unknown>[]): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(this.apiUrl, { action: 'receive', id, items }));
      await this.loadOrders();
      return true;
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      return false;
    }
  }

  async cancelOrder(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(this.apiUrl, { action: 'cancel', id }));
      this.orders.update(orders => orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
      return true;
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      return false;
    }
  }
}
