import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { User } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  
  teamMembers = signal<User[]>([]);
  isLoading = signal(false);

  async loadTeam() {
    this.isLoading.set(true);
    try {
      const members = await firstValueFrom(
        this.http.get<User[]>(`${environment.apiUrl}/team`)
      );
      this.teamMembers.set(members);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      this.teamMembers.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addMember(member: Partial<User> & { password?: string }) {
    try {
      const newMember = await firstValueFrom(
        this.http.post<User>(`${environment.apiUrl}/team`, member)
      );
      this.teamMembers.update(members => [newMember, ...members]);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      return false;
    }
  }

  async removeMember(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/team?id=${id}`)
      );
      this.teamMembers.update(members => members.filter(m => m.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      return false;
    }
  }
}
