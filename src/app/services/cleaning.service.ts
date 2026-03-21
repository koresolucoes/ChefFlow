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
  updatingTaskId = signal<string | null>(null);
  error = signal<string | null>(null);

  async loadTasks(category?: string, date?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      let url = this.apiUrl;
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (date) params.append('date', date);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const data = await firstValueFrom(this.http.get<CleaningTask[]>(url));
      this.tasks.set(data);
    } catch (err: any) {
      console.error('Error loading cleaning tasks:', err);
      this.error.set(err.error?.error || 'Failed to load cleaning tasks');
    } finally {
      this.loading.set(false);
    }
  }

  async addTask(task: Partial<CleaningTask> & { shift_moments?: string[] }) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const newTasks = await firstValueFrom(this.http.post<CleaningTask[]>(this.apiUrl, task));
      this.tasks.update(tasks => [...newTasks, ...tasks]);
      return newTasks;
    } catch (err: any) {
      console.error('Error adding cleaning task:', err);
      this.error.set(err.error?.error || 'Failed to add cleaning task');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateTaskStatus(id: string, category: string, status: string, reason?: string, value?: string) {
    this.updatingTaskId.set(id);
    this.error.set(null);
    try {
      // Optimistic update
      this.tasks.update(tasks => tasks.map(t => {
        if (t.id === id) {
          return { ...t, status: status as any, reason: reason !== undefined ? reason : t.reason, value: value !== undefined ? value : t.value };
        }
        return t;
      }));

      const body: any = { id, category, status };
      if (reason !== undefined) body.reason = reason;
      if (value !== undefined) body.value = value;
      
      const updatedTask = await firstValueFrom(this.http.put<CleaningTask>(this.apiUrl, body));
      this.tasks.update(tasks => tasks.map(t => {
        if (t.id === id) {
          return {
            ...t,
            ...updatedTask,
            reason: reason !== undefined ? updatedTask.reason : t.reason,
            value: value !== undefined ? updatedTask.value : t.value
          };
        }
        return t;
      }));
    } catch (err: any) {
      console.error('Error updating cleaning task:', err);
      this.error.set(err.error?.error || 'Failed to update cleaning task');
      // Revert optimistic update by reloading tasks
      this.loadTasks(undefined, new Date().toISOString().split('T')[0]);
      throw err;
    } finally {
      this.updatingTaskId.set(null);
    }
  }

  async removeTask(id: string, category: string) {
    this.updatingTaskId.set(id);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}?id=${id}&category=${category}`));
      this.tasks.update(tasks => tasks.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error removing cleaning task:', err);
      this.error.set(err.error?.error || 'Failed to remove cleaning task');
      throw err;
    } finally {
      this.updatingTaskId.set(null);
    }
  }
}
