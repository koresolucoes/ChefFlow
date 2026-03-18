import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService, Announcement } from '../services/communication.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-comunicacao',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Comunicação & BI</h1>
          <p class="text-stone-500 mt-1">Mural do Chef e relatórios de performance.</p>
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

      <!-- Tabs -->
      <div class="border-b border-stone-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button 
            (click)="activeTab.set('mural')"
            [class.border-stone-900]="activeTab() === 'mural'"
            [class.text-stone-900]="activeTab() === 'mural'"
            [class.border-transparent]="activeTab() !== 'mural'"
            [class.text-stone-500]="activeTab() !== 'mural'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Mural do Chef
          </button>
          <button 
            (click)="activeTab.set('bi')"
            [class.border-stone-900]="activeTab() === 'bi'"
            [class.text-stone-900]="activeTab() === 'bi'"
            [class.border-transparent]="activeTab() !== 'bi'"
            [class.text-stone-500]="activeTab() !== 'bi'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Dashboard de Performance (BI)
          </button>
        </nav>
      </div>

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
                <label for="title" class="block text-sm font-medium text-stone-700 mb-1">Título</label>
                <input id="title" type="text" [(ngModel)]="newAnnouncement.title" name="title" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
              </div>
              
              <div>
                <label for="type" class="block text-sm font-medium text-stone-700 mb-1">Tipo</label>
                <select id="type" [(ngModel)]="newAnnouncement.type" name="type" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                  <option value="info">Informação</option>
                  <option value="warning">Aviso Importante</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            
            <div>
              <label for="content" class="block text-sm font-medium text-stone-700 mb-1">Mensagem</label>
              <textarea id="content" [(ngModel)]="newAnnouncement.content" name="content" required rows="4" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"></textarea>
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
      <div class="mt-6">
        @if (communicationService.loading() && !showNewAnnouncementForm()) {
          <div class="flex justify-center p-12">
            <mat-icon class="animate-spin text-stone-400 text-4xl">autorenew</mat-icon>
          </div>
        } @else {
          @if (activeTab() === 'mural') {
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
                  <div class="p-6 hover:bg-stone-50 transition-colors group">
                    <div class="flex items-start gap-4">
                      <div 
                        [class.bg-rose-100]="announcement.type === 'urgent'"
                        [class.text-rose-600]="announcement.type === 'urgent'"
                        [class.bg-amber-100]="announcement.type === 'warning'"
                        [class.text-amber-600]="announcement.type === 'warning'"
                        [class.bg-blue-100]="announcement.type === 'info'"
                        [class.text-blue-600]="announcement.type === 'info'"
                        class="w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                        <mat-icon>{{ getIconForType(announcement.type) }}</mat-icon>
                      </div>
                      <div class="flex-1">
                        <div class="flex justify-between items-start">
                          <h3 class="text-lg font-bold text-stone-900">{{ announcement.title }}</h3>
                          <div class="flex items-center gap-3">
                            <span class="text-xs text-stone-400">{{ announcement.created_at | date:'dd/MM HH:mm' }}</span>
                            @if (canManageAnnouncements()) {
                              <button (click)="deleteAnnouncement(announcement.id)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon>
                              </button>
                            }
                          </div>
                        </div>
                        <p class="text-stone-600 mt-2 whitespace-pre-line">{{ announcement.content }}</p>
                        <div class="mt-4 flex items-center gap-2">
                          <div class="w-6 h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center text-[10px] font-bold uppercase">
                            {{ announcement.author?.name?.charAt(0) || '?' }}
                          </div>
                          <span class="text-xs font-medium text-stone-500">{{ announcement.author?.name }} ({{ announcement.author?.role }})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (activeTab() === 'bi') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Custo Mão de Obra -->
              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <h3 class="text-lg font-bold text-stone-900 mb-4">Custo de Mão de Obra (Semana)</h3>
                <div class="space-y-4">
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-stone-500">Equipe Fixa</span>
                      <span class="font-medium text-stone-900">R$ 8.450</span>
                    </div>
                    <div class="w-full bg-stone-100 rounded-full h-2">
                      <div class="bg-blue-500 h-2 rounded-full" style="width: 75%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-stone-500">Freelancers (Extras)</span>
                      <span class="font-medium text-stone-900">R$ 2.100</span>
                    </div>
                    <div class="w-full bg-stone-100 rounded-full h-2">
                      <div class="bg-amber-500 h-2 rounded-full" style="width: 25%"></div>
                    </div>
                  </div>
                  <div class="pt-4 border-t border-stone-100 flex justify-between items-center">
                    <span class="font-bold text-stone-900">Total</span>
                    <span class="text-xl font-bold text-stone-900">R$ 10.550</span>
                  </div>
                </div>
              </div>

              <!-- Conformidade -->
              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <h3 class="text-lg font-bold text-stone-900 mb-4">Índice de Conformidade (Mês)</h3>
                <div class="flex items-center justify-center h-40">
                  <div class="relative w-32 h-32">
                    <!-- Placeholder for a donut chart -->
                    <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                      <path
                        class="text-stone-100"
                        stroke-width="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        class="text-emerald-500"
                        stroke-dasharray="92, 100"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center flex-col">
                      <span class="text-2xl font-bold text-stone-900">92%</span>
                    </div>
                  </div>
                </div>
                <div class="mt-4 flex justify-center gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span class="text-stone-600">Concluído</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-stone-200"></div>
                    <span class="text-stone-600">Pendente/Falha</span>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComunicacaoComponent implements OnInit {
  communicationService = inject(CommunicationService);
  authService = inject(AuthService);

  activeTab = signal<'mural' | 'bi'>('mural');
  showNewAnnouncementForm = signal(false);

  newAnnouncement: Partial<Announcement> = {
    title: '',
    content: '',
    type: 'info'
  };

  ngOnInit() {
    this.communicationService.loadAnnouncements();
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
      await this.communicationService.addAnnouncement(this.newAnnouncement);
      this.showNewAnnouncementForm.set(false);
      this.newAnnouncement = {
        title: '',
        content: '',
        type: 'info'
      };
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

