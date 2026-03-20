import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  date: string;
  users?: { name: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class TimeTrackingService {
  private http = inject(HttpClient);
  
  entries = signal<TimeEntry[]>([]);
  isLoading = signal(false);

  async loadEntries(date?: string) {
    this.isLoading.set(true);
    try {
      const url = date ? `${environment.apiUrl}/time-tracking?date=${date}` : `${environment.apiUrl}/time-tracking`;
      const data = await firstValueFrom(this.http.get<TimeEntry[]>(url));
      this.entries.set(data);
    } catch (error) {
      console.error('Erro ao carregar ponto digital:', error);
      this.entries.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async clockIn(userId: string) {
    try {
      const entry = await firstValueFrom(
        this.http.post<TimeEntry>(`${environment.apiUrl}/time-tracking`, { user_id: userId, action: 'in' })
      );
      this.entries.update(current => [entry, ...current]);
      return true;
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      return false;
    }
  }

  async clockOut(userId: string) {
    try {
      const entry = await firstValueFrom(
        this.http.post<TimeEntry>(`${environment.apiUrl}/time-tracking`, { user_id: userId, action: 'out' })
      );
      this.entries.update(current => current.map(e => e.id === entry.id ? entry : e));
      return true;
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      return false;
    }
  }
}
