import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface WasteLog {
  id: string;
  inventory_item_id: string;
  user_id: string;
  quantity: number;
  unit: string;
  reason: string;
  notes?: string;
  cost_impact: number;
  created_at: string;
  inventory_item?: { id: string; name: string; unit: string; };
  user?: { id: string; name: string; role: string; };
}

@Injectable({ providedIn: 'root' })
export class WasteLogService {
  private http = inject(HttpClient);
  
  logs = signal<WasteLog[]>([]);
  isLoading = signal(false);

  async loadLogs() {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<WasteLog[]>(`${environment.apiUrl}/waste-logs`)
      );
      this.logs.set(response || []);
    } catch (error) {
      console.error('Erro ao carregar registros de desperdício', error);
      this.logs.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addLog(log: Partial<WasteLog>) {
    try {
      const newLog = await firstValueFrom(
        this.http.post<WasteLog>(`${environment.apiUrl}/waste-logs`, log)
      );
      if (newLog) {
        this.logs.update(logs => [newLog, ...logs]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao adicionar registro de desperdício', error);
      return false;
    }
  }

  async deleteLog(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/waste-logs?id=${id}`)
      );
      this.logs.update(logs => logs.filter(log => log.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar registro de desperdício', error);
      return false;
    }
  }
}
