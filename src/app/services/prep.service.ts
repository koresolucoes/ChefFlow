import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface PrepTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  team_id: string;
  assigned_to: string;
  due_date: string;
  created_at: string;
  teams?: { name: string };
  assigned_to_user?: { name: string };
}

@Injectable({
  providedIn: 'root'
})
export class PrepService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  tasks = signal<PrepTask[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private get headers() {
    return {
      Authorization: `Bearer ${this.auth.token()}`
    };
  }

  async loadTasks(teamId?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const url = teamId ? `/api/prep-tasks?team_id=${teamId}` : '/api/prep-tasks';
      const data = await firstValueFrom(
        this.http.get<PrepTask[]>(url, { headers: this.headers })
      );
      this.tasks.set(data);
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao carregar tarefas de preparo');
    } finally {
      this.loading.set(false);
    }
  }

  async addTask(task: Partial<PrepTask>) {
    this.loading.set(true);
    try {
      const newTask = await firstValueFrom(
        this.http.post<PrepTask>('/api/prep-tasks', task, { headers: this.headers })
      );
      this.tasks.update(prev => [newTask, ...prev]);
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao adicionar tarefa');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateTask(task: Partial<PrepTask>) {
    this.loading.set(true);
    try {
      const updated = await firstValueFrom(
        this.http.put<PrepTask>('/api/prep-tasks', task, { headers: this.headers })
      );
      this.tasks.update(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao atualizar tarefa');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async removeTask(id: string) {
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.http.delete(`/api/prep-tasks?id=${id}`, { headers: this.headers })
      );
      this.tasks.update(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const error = err as { error?: { error?: string } };
      this.error.set(error.error?.error || 'Erro ao remover tarefa');
    } finally {
      this.loading.set(false);
    }
  }
}
