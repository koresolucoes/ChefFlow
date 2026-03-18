import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: 'limpeza' | 'fechamento' | 'abertura' | 'producao' | 'estoque';
  team_id?: string;
  created_at: string;
}

export interface ChecklistRecord {
  id: string;
  item_id: string;
  status: 'conforme' | 'nao_conforme' | 'completed';
  reason?: string;
  user_id: string;
  created_at: string;
  item?: { title: string; category: string };
  user?: { name: string };
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private http = inject(HttpClient);
  private apiUrl = '/api/checklist_items';
  private recordsUrl = '/api/checklist_records';

  items = signal<ChecklistItem[]>([]);
  records = signal<ChecklistRecord[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadItems(category?: string, team_id?: string) {
    this.loading.set(true);
    try {
      let url = this.apiUrl;
      const params = [];
      if (category) params.push(`category=${category}`);
      if (team_id) params.push(`team_id=${team_id}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const data = await firstValueFrom(this.http.get<ChecklistItem[]>(url));
      this.items.set(data);
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao carregar itens de checklist');
    } finally {
      this.loading.set(false);
    }
  }

  async addItem(item: Partial<ChecklistItem>) {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.post<ChecklistItem>(this.apiUrl, item));
      this.items.update(list => [...list, data]);
      return data;
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao adicionar item de checklist');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async removeItem(id: string) {
    this.loading.set(true);
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}?id=${id}`));
      this.items.update(list => list.filter(i => i.id !== id));
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao remover item de checklist');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async loadRecords(item_id?: string) {
    this.loading.set(true);
    try {
      let url = this.recordsUrl;
      if (item_id) url += `?item_id=${item_id}`;
      const data = await firstValueFrom(this.http.get<ChecklistRecord[]>(url));
      this.records.set(data);
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao carregar histórico de checklist');
    } finally {
      this.loading.set(false);
    }
  }

  async addRecord(record: Partial<ChecklistRecord>) {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.post<ChecklistRecord>(this.recordsUrl, record));
      this.records.update(list => [data, ...list]);
      return data;
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao registrar checklist');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
