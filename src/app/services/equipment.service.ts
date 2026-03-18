import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Equipment {
  id: string;
  name: string;
  target_min: number;
  target_max: number;
  team_id?: string;
  category?: string;
  created_at: string;
}

export interface TemperatureReading {
  id: string;
  equipment_id: string;
  value: number;
  status: 'conforme' | 'nao_conforme';
  reason?: string;
  user_id: string;
  created_at: string;
  equipment?: { name: string };
  user?: { name: string };
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/equipment';
  private readingsUrl = '/api/temperature_readings';

  equipment = signal<Equipment[]>([]);
  readings = signal<TemperatureReading[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadEquipment(team_id?: string, category?: string) {
    this.loading.set(true);
    try {
      let url = this.apiUrl;
      const params = new URLSearchParams();
      if (team_id) params.append('team_id', team_id);
      if (category) params.append('category', category);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await firstValueFrom(this.http.get<Equipment[]>(url));
      this.equipment.set(data);
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao carregar equipamentos');
    } finally {
      this.loading.set(false);
    }
  }

  async addEquipment(eq: Partial<Equipment>) {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.post<Equipment>(this.apiUrl, eq));
      this.equipment.update(list => [...list, data]);
      return data;
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao adicionar equipamento');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async removeEquipment(id: string) {
    this.loading.set(true);
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}?id=${id}`));
      this.equipment.update(list => list.filter(e => e.id !== id));
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao remover equipamento');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async loadReadings(equipment_id?: string) {
    this.loading.set(true);
    try {
      let url = this.readingsUrl;
      if (equipment_id) url += `?equipment_id=${equipment_id}`;
      const data = await firstValueFrom(this.http.get<TemperatureReading[]>(url));
      this.readings.set(data);
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao carregar histórico');
    } finally {
      this.loading.set(false);
    }
  }

  async addReading(reading: Partial<TemperatureReading>) {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.http.post<TemperatureReading>(this.readingsUrl, reading));
      this.readings.update(list => [data, ...list]);
      return data;
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao registrar leitura');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
