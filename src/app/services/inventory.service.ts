import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  
  items = signal<InventoryItem[]>([]);
  isLoading = signal(false);

  async loadItems() {
    this.isLoading.set(true);
    try {
      const items = await firstValueFrom(
        this.http.get<InventoryItem[]>(`${environment.apiUrl}/inventory`)
      );
      this.items.set(items);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      this.items.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addItem(item: Partial<InventoryItem>) {
    try {
      const newItem = await firstValueFrom(
        this.http.post<InventoryItem>(`${environment.apiUrl}/inventory`, item)
      );
      this.items.update(items => [...items, newItem].sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return false;
    }
  }

  async updateItem(item: Partial<InventoryItem>) {
    try {
      const updatedItem = await firstValueFrom(
        this.http.put<InventoryItem>(`${environment.apiUrl}/inventory`, item)
      );
      this.items.update(items => items.map(i => i.id === updatedItem.id ? updatedItem : i));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      return false;
    }
  }

  async removeItem(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/inventory?id=${id}`)
      );
      this.items.update(items => items.filter(i => i.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return false;
    }
  }
}
