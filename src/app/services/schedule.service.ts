import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Schedule {
  id?: string;
  user_id: string;
  date: string; // Formato YYYY-MM-DD
  shift_start: string | null; // HH:mm
  shift_end: string | null; // HH:mm
  type: 'regular' | 'folga' | 'extra';
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private http = inject(HttpClient);
  
  schedules = signal<Schedule[]>([]);
  isLoading = signal(false);

  async loadSchedules(startDate: string, endDate: string) {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Schedule[]>(`${environment.apiUrl}/schedules?start_date=${startDate}&end_date=${endDate}`)
      );
      this.schedules.set(data);
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
      this.schedules.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveSchedule(schedule: Schedule) {
    try {
      const saved = await firstValueFrom(
        this.http.post<Schedule>(`${environment.apiUrl}/schedules`, schedule)
      );
      
      // Atualiza o estado local
      this.schedules.update(current => {
        // Remove a escala antiga se existir para o mesmo dia e usuário
        const filtered = current.filter(s => !(s.user_id === saved.user_id && s.date.startsWith(saved.date.split('T')[0])));
        return [...filtered, saved];
      });
      return true;
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      return false;
    }
  }
}
