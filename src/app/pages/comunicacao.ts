import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService, Announcement } from '../services/communication.service';
import { AuthService } from '../services/auth.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-comunicacao',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Comunicação</h1>
          <p class="text-stone-500 mt-1">Mural do Chef e avisos importantes.</p>
        </div>
        <div class="flex gap-3">
          @if (canManageAnnouncements()) {
            <button (click)="showNewAnnouncementForm.set(true)" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
              <mat-icon>campaign</mat-icon>
              Novo Aviso
            </button>
          }
        </div>
      </header>

      @if (communicationService.error()) {
        <div class="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3">
          <mat-icon>error_outline</mat-icon>
          <p>{{ communicationService.error() }}</p>
        </div>
      }

      <!-- Header Actions -->
      @if (authService.isAdmin()) {
        <div class="flex justify-end mb-4">
          <select [ngModel]="selectedTeamId()" (ngModelChange)="onTeamChange($event)" class="w-full sm:w-auto border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-stone-700">
            <option value="todas">Todas as Praças</option>
            @for (team of teamService.teams(); track team.id) {
              <option [value]="team.id">{{ team.name }}</option>
            }
          </select>
        </div>
      }

      <!-- New Announcement Form -->
      @if (showNewAnnouncementForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-stone-900">Novo Aviso</h2>
            <button (click)="showNewAnnouncementForm.set(false)" class="text-stone-400 hover:text-stone-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="announcement-title" class="block text-sm font-medium text-stone-700 mb-1">Título</label>
                <input id="announcement-title" type="text" [(ngModel)]="newAnnouncement.title" name="title" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
              </div>
              
              <div>
                <label for="announcement-type" class="block text-sm font-medium text-stone-700 mb-1">Tipo</label>
                <select id="announcement-type" [(ngModel)]="newAnnouncement.type" name="type" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                  <option value="info">Informação</option>
                  <option value="warning">Aviso Importante</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            @if (authService.isAdmin()) {
              <div>
                <label for="announcement-team" class="block text-sm font-medium text-stone-700 mb-1">Praça (Opcional - Deixe em branco para Todas)</label>
                <select id="announcement-team" [(ngModel)]="draftTeamId" name="team_id" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                  <option [value]="null">Todas as Praças</option>
                  @for (team of teamService.teams(); track team.id) {
                    <option [value]="team.id">{{ team.name }}</option>
                  }
                </select>
              </div>
            }
            
            <div>
              <label for="announcement-content" class="block text-sm font-medium text-stone-700 mb-1">Mensagem</label>
              <textarea id="announcement-content" [(ngModel)]="newAnnouncement.content" name="content" required rows="4" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"></textarea>
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" (click)="showNewAnnouncementForm.set(false)" class="px-4 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="communicationService.loading() || !newAnnouncement.title || !newAnnouncement.content" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2">
                @if (communicationService.loading()) {
                  <mat-icon class="animate-spin">autorenew</mat-icon>
                  Publicando...
                } @else {
                  <mat-icon>campaign</mat-icon>
                  Publicar Aviso
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Tab Content -->
      <div class="mt-6 relative" [class.opacity-60]="communicationService.loading() && communicationService.announcements().length > 0">
        @if (communicationService.loading() && !showNewAnnouncementForm() && communicationService.announcements().length === 0) {
          <div class="flex justify-center p-12">
            <mat-icon class="animate-spin text-stone-400 text-4xl">autorenew</mat-icon>
          </div>
        } @else {
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div class="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h2 class="font-bold text-stone-900">Avisos Recentes</h2>
              </div>
              
              <div class="divide-y divide-stone-100">
                @if (communicationService.announcements().length === 0) {
                  <div class="p-8 text-center text-stone-500">
                    Nenhum aviso publicado.
                  </div>
                }
                @for (announcement of communicationService.announcements(); track announcement.id) {
                  <div class="p-4 md:p-6 hover:bg-stone-50 transition-colors group">
                    <div class="flex items-start gap-3 md:gap-4">
                      <div 
                        [class.bg-rose-100]="announcement.type === 'urgent'"
                        [class.text-rose-600]="announcement.type === 'urgent'"
                        [class.bg-amber-100]="announcement.type === 'warning'"
                        [class.text-amber-600]="announcement.type === 'warning'"
                        [class.bg-blue-100]="announcement.type === 'info'"
                        [class.text-blue-600]="announcement.type === 'info'"
                        class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0">
                        <mat-icon class="text-[20px] md:text-[24px] w-5 h-5 md:w-6 md:h-6">{{ getIconForType(announcement.type) }}</mat-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                          <h3 class="text-base md:text-lg font-bold text-stone-900 truncate pr-2">{{ announcement.title }}</h3>
                          <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <span class="text-[10px] md:text-xs text-stone-400">{{ announcement.created_at | date:'dd/MM HH:mm' }}</span>
                            @if (canManageAnnouncements()) {
                              <button (click)="deleteAnnouncement(announcement.id)" class="text-stone-400 hover:text-rose-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon>
                              </button>
                            }
                          </div>
                        </div>
                        <p class="text-sm md:text-base text-stone-600 mt-2 whitespace-pre-line">{{ announcement.content }}</p>
                        <div class="mt-4 flex items-center gap-2">
                          <div class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center text-[9px] md:text-[10px] font-bold uppercase shrink-0">
                            {{ announcement.author?.name?.charAt(0) || '?' }}
                          </div>
                          <span class="text-[10px] md:text-xs font-medium text-stone-500 truncate">{{ announcement.author?.name }} ({{ announcement.author?.role }})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComunicacaoComponent implements OnInit {
  communicationService = inject(CommunicationService);
  authService = inject(AuthService);
  teamService = inject(TeamService);

  showNewAnnouncementForm = signal(false);
  draftTeamId = signal<string | null>(null);
  selectedTeamId = signal<string>('todas');

  newAnnouncement: Partial<Announcement> & { team_id?: string | null } = {
    title: '',
    content: '',
    type: 'info',
    team_id: null
  };

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.role === 'admin') {
      this.teamService.loadTeams();
      this.communicationService.loadAnnouncements(); // Admin loads all
    } else {
      this.communicationService.loadAnnouncements(user?.team_id);
    }
  }

  onTeamChange(teamId: string) {
    this.selectedTeamId.set(teamId);
    this.communicationService.loadAnnouncements(teamId === 'todas' ? undefined : teamId);
  }

  canManageAnnouncements() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'chef';
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'urgent': return 'campaign';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  async onSubmit() {
    if (!this.newAnnouncement.title || !this.newAnnouncement.content) return;
    
    try {
      const payload = { ...this.newAnnouncement };
      if (this.authService.isAdmin()) {
        payload.team_id = this.draftTeamId();
      }
      
      await this.communicationService.addAnnouncement(payload);
      this.showNewAnnouncementForm.set(false);
      this.newAnnouncement = {
        title: '',
        content: '',
        type: 'info',
        team_id: null
      };
      this.draftTeamId.set(null);
    } catch {
      // Error is handled by service
    }
  }

  async deleteAnnouncement(id: string) {
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
      await this.communicationService.removeAnnouncement(id);
    }
  }
}

