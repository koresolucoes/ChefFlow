import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent';
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private http = inject(HttpClient);
  private apiUrl = '/api/communication';

  announcements = signal<Announcement[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadAnnouncements(teamId?: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      let url = this.apiUrl;
      if (teamId) {
        url += `?team_id=${teamId}`;
      }
      const data = await firstValueFrom(this.http.get<Announcement[]>(url));
      this.announcements.set(data);
    } catch (err: unknown) {
      console.error('Error loading announcements:', err);
      this.error.set((err as { error?: { error?: string } })?.error?.error || 'Failed to load announcements');
    } finally {
      this.loading.set(false);
    }
  }

  async addAnnouncement(announcement: Partial<Announcement> & { team_id?: string | null }) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const newAnnouncement = await firstValueFrom(this.http.post<Announcement>(this.apiUrl, announcement));
      this.announcements.update(list => [newAnnouncement, ...list]);
      return newAnnouncement;
    } catch (err: unknown) {
      console.error('Error adding announcement:', err);
      this.error.set((err as { error?: { error?: string } })?.error?.error || 'Failed to add announcement');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async removeAnnouncement(id: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}?id=${id}`));
      this.announcements.update(list => list.filter(a => a.id !== id));
    } catch (err: unknown) {
      console.error('Error removing announcement:', err);
      this.error.set((err as { error?: { error?: string } })?.error?.error || 'Failed to remove announcement');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
