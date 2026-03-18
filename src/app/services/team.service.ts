import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { User } from './auth.service';

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface UserWithTeam extends User {
  team_id?: string;
  teams?: { id: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  
  teamMembers = signal<UserWithTeam[]>([]);
  teams = signal<Team[]>([]);
  isLoading = signal(false);
  isLoadingTeams = signal(false);

  async loadTeam() {
    this.isLoading.set(true);
    try {
      const members = await firstValueFrom(
        this.http.get<UserWithTeam[]>(`${environment.apiUrl}/team`)
      );
      this.teamMembers.set(members);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      this.teamMembers.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadTeams() {
    this.isLoadingTeams.set(true);
    try {
      const teams = await firstValueFrom(
        this.http.get<Team[]>(`${environment.apiUrl}/teams`)
      );
      this.teams.set(teams);
    } catch (error) {
      console.error('Erro ao carregar praças:', error);
      this.teams.set([]);
    } finally {
      this.isLoadingTeams.set(false);
    }
  }

  async addMember(member: Partial<UserWithTeam> & { password?: string }) {
    try {
      const newMember = await firstValueFrom(
        this.http.post<UserWithTeam>(`${environment.apiUrl}/team`, member)
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

  async addTeam(team: Partial<Team>) {
    try {
      const newTeam = await firstValueFrom(
        this.http.post<Team>(`${environment.apiUrl}/teams`, team)
      );
      this.teams.update(teams => [...teams, newTeam]);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar praça:', error);
      return false;
    }
  }

  async removeTeam(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/teams?id=${id}`)
      );
      this.teams.update(teams => teams.filter(t => t.id !== id));
      // Reload members as their team_id might have been set to null
      await this.loadTeam();
      return true;
    } catch (error) {
      console.error('Erro ao remover praça:', error);
      return false;
    }
  }
}
