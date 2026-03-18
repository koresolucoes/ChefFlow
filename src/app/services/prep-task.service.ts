import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface PrepTask {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  team_id?: string;
  assigned_to?: string;
  due_date?: string;
  created_at?: string;
  teams?: { id: string; name: string };
  assigned_to_user?: { id: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class PrepTaskService {
  private http = inject(HttpClient);
  
  tasks = signal<PrepTask[]>([]);
  isLoading = signal(false);

  async loadTasks(teamId?: string) {
    this.isLoading.set(true);
    try {
      let url = `${environment.apiUrl}/prep-tasks`;
      if (teamId && teamId !== 'todas') {
        url += `?team_id=${teamId}`;
      }
      const tasks = await firstValueFrom(
        this.http.get<PrepTask[]>(url)
      );
      this.tasks.set(tasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      this.tasks.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addTask(task: Partial<PrepTask>) {
    try {
      const newTask = await firstValueFrom(
        this.http.post<PrepTask>(`${environment.apiUrl}/prep-tasks`, task)
      );
      this.tasks.update(tasks => [newTask, ...tasks]);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      return false;
    }
  }

  async updateTask(task: Partial<PrepTask>) {
    try {
      const updatedTask = await firstValueFrom(
        this.http.put<PrepTask>(`${environment.apiUrl}/prep-tasks`, task)
      );
      this.tasks.update(tasks => tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return false;
    }
  }

  async removeTask(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/prep-tasks?id=${id}`)
      );
      this.tasks.update(tasks => tasks.filter(t => t.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
      return false;
    }
  }
}
