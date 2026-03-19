import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface CleaningTask {
  id: string;
  title: string;
  description?: string;
  category: 'checklist' | 'termometria' | 'fechamento';
  shift_moment?: string;
  status: 'pending' | 'completed' | 'conforme' | 'nao_conforme' | 'na';
  reason?: string;
  value?: string;
  target_value?: string;
  team_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  teams?: { name: string };
  assigned_to_user?: { name: string };
}

@Injectable({
  providedIn: 'root'
})
export class CleaningService {
  private http = inject(HttpClient);
  private apiUrl = '/api/cleaning';

  tasks = signal<CleaningTask[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadTasks(category?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const url = category ? `${this.apiUrl}?category=${category}` : this.apiUrl;
      const data = await firstValueFrom(this.http.get<CleaningTask[]>(url));
      this.tasks.set(data);
    } catch (err: any) {
      console.error('Error loading cleaning tasks:', err);
      this.error.set(err.error?.error || 'Failed to load cleaning tasks');
    } finally {
      this.loading.set(false);
    }
  }

  async addTask(task: Partial<CleaningTask>) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const newTask = await firstValueFrom(this.http.post<CleaningTask>(this.apiUrl, task));
      this.tasks.update(tasks => [newTask, ...tasks]);
      return newTask;
    } catch (err: any) {
      console.error('Error adding cleaning task:', err);
      this.error.set(err.error?.error || 'Failed to add cleaning task');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateTaskStatus(id: string, category: string, status: string, reason?: string, value?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const body: any = { id, category, status };
      if (reason !== undefined) body.reason = reason;
      if (value !== undefined) body.value = value;
      
      const updatedTask = await firstValueFrom(this.http.put<CleaningTask>(this.apiUrl, body));
      this.tasks.update(tasks => tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t));
    } catch (err: any) {
      console.error('Error updating cleaning task:', err);
      this.error.set(err.error?.error || 'Failed to update cleaning task');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async removeTask(id: string, category: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}?id=${id}&category=${category}`));
      this.tasks.update(tasks => tasks.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error removing cleaning task:', err);
      this.error.set(err.error?.error || 'Failed to remove cleaning task');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
