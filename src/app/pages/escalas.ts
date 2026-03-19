import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../services/team.service';
import { ScheduleService, Schedule } from '../services/schedule.service';

@Component({
  selector: 'app-escalas',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Escalas & Pessoal</h1>
          <p class="text-stone-500 mt-1">Gestão de turnos, freelancers e ponto digital.</p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center gap-2">
            <mat-icon>person_add</mat-icon>
            Novo Freelancer
          </button>
          <button (click)="gerarEscalaPadrao()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>add</mat-icon>
            Gerar Escala Padrão
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="border-b border-stone-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button 
            (click)="activeTab.set('escala')"
            [class.border-stone-900]="activeTab() === 'escala'"
            [class.text-stone-900]="activeTab() === 'escala'"
            [class.border-transparent]="activeTab() !== 'escala'"
            [class.text-stone-500]="activeTab() !== 'escala'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Escala da Semana
          </button>
          <button 
            (click)="activeTab.set('freelancers')"
            [class.border-stone-900]="activeTab() === 'freelancers'"
            [class.text-stone-900]="activeTab() === 'freelancers'"
            [class.border-transparent]="activeTab() !== 'freelancers'"
            [class.text-stone-500]="activeTab() !== 'freelancers'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Freelancers (Extras)
          </button>
          <button 
            (click)="activeTab.set('ponto')"
            [class.border-stone-900]="activeTab() === 'ponto'"
            [class.text-stone-900]="activeTab() === 'ponto'"
            [class.border-transparent]="activeTab() !== 'ponto'"
            [class.text-stone-500]="activeTab() !== 'ponto'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Ponto Digital
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="mt-6">
        @if (activeTab() === 'escala') {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div class="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <div class="flex items-center gap-4">
                <button (click)="mudarSemana(-1)" class="p-1 hover:bg-stone-200 rounded text-stone-600"><mat-icon>chevron_left</mat-icon></button>
                <span class="font-bold text-stone-900">
                  {{ weekDates()[0] | date:'dd MMM' }} - {{ weekDates()[6] | date:'dd MMM yyyy' }}
                </span>
                <button (click)="mudarSemana(1)" class="p-1 hover:bg-stone-200 rounded text-stone-600"><mat-icon>chevron_right</mat-icon></button>
              </div>
              <div class="flex gap-2 text-sm">
                <span class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">Regular</span>
                <span class="px-2 py-1 bg-stone-100 text-stone-800 rounded font-medium">Folga</span>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-stone-200">
                <thead class="bg-stone-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Colaborador</th>
                    @for (date of weekDates(); track date) {
                      <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">
                        {{ date | date:'EEE (dd)' }}
                      </th>
                    }
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-stone-200">
                  @if (teamService.isLoading() || scheduleService.isLoading()) {
                    <tr>
                      <td colspan="8" class="px-6 py-8 text-center text-stone-500">
                        <mat-icon class="animate-spin mb-2">refresh</mat-icon>
                        <p>Carregando escalas...</p>
                      </td>
                    </tr>
                  } @else if (teamService.teamMembers().length === 0) {
                    <tr>
                      <td colspan="8" class="px-6 py-8 text-center text-stone-500">
                        Nenhum membro na equipe. Cadastre na aba Equipe primeiro.
                      </td>
                    </tr>
                  } @else {
                    @for (member of teamService.teamMembers(); track member.id) {
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                              {{ member.name.charAt(0) | uppercase }}
                            </div>
                            <div class="ml-4">
                              <div class="text-sm font-medium text-stone-900">{{ member.name }}</div>
                              <div class="text-xs text-stone-500">{{ member.role | uppercase }}</div>
                            </div>
                          </div>
                        </td>
                        @for (date of weekDates(); track date) {
                          <td class="px-2 py-4 whitespace-nowrap text-center cursor-pointer hover:bg-stone-50" (click)="abrirModalEdicao(member.id, date)">
                            @if (getSchedule(member.id, date); as schedule) {
                              @if (schedule.type === 'folga') {
                                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">FOLGA</span>
                              } @else {
                                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                  {{ schedule.shift_start?.substring(0, 5) }} - {{ schedule.shift_end?.substring(0, 5) }}
                                </span>
                              }
                            } @else {
                              <span class="text-stone-300 text-xs">-</span>
                            }
                          </td>
                        }
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (activeTab() === 'freelancers') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col items-center justify-center text-center text-stone-500 min-h-[200px]">
              <mat-icon class="text-4xl mb-2 opacity-50">person_add</mat-icon>
              <p>Nenhum freelancer cadastrado.</p>
              <button class="mt-4 text-emerald-600 font-medium hover:text-emerald-700">Adicionar Freelancer</button>
            </div>
          </div>
        }

        @if (activeTab() === 'ponto') {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div class="p-6 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-stone-900">Ponto Digital (Hoje)</h2>
                <p class="text-sm text-stone-500">Registro via Geofencing ativo.</p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-mono tracking-tight text-stone-900">13:28</p>
              </div>
            </div>
            <div class="p-8 text-center text-stone-500">
              <mat-icon class="text-4xl mb-2 opacity-50">fingerprint</mat-icon>
              <p>O ponto digital será ativado em breve.</p>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Modal de Edição de Escala -->
    @if (modalAberto()) {
      <div class="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div class="p-6 border-b border-stone-100 flex justify-between items-center">
            <h3 class="text-lg font-bold text-stone-900">Editar Escala</h3>
            <button (click)="fecharModal()" class="text-stone-400 hover:text-stone-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-stone-600 mb-4">
              Defina o turno para o dia <strong>{{ modalData() | date:'dd/MM/yyyy' }}</strong>
            </p>
            
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Tipo de Turno</label>
              <select [(ngModel)]="modalType" class="w-full border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="regular">Regular (Trabalho)</option>
                <option value="folga">Folga</option>
                <option value="extra">Extra</option>
              </select>
            </div>

            @if (modalType() !== 'folga') {
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">Entrada</label>
                  <input type="time" [(ngModel)]="modalStart" class="w-full border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">Saída</label>
                  <input type="time" [(ngModel)]="modalEnd" class="w-full border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                </div>
              </div>
            }
          </div>
          <div class="p-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
            <button (click)="fecharModal()" class="px-4 py-2 text-stone-600 font-medium hover:bg-stone-200 rounded-lg transition-colors">Cancelar</button>
            <button (click)="salvarEscala()" class="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors">Salvar</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EscalasComponent implements OnInit {
  teamService = inject(TeamService);
  scheduleService = inject(ScheduleService);

  activeTab = signal<'escala' | 'freelancers' | 'ponto'>('escala');
  
  // Controle de Datas
  currentDate = signal<Date>(new Date());
  weekDates = signal<Date[]>([]);

  // Controle do Modal
  modalAberto = signal(false);
  modalUserId = signal('');
  modalData = signal<Date | null>(null);
  modalType = signal<'regular' | 'folga' | 'extra'>('regular');
  modalStart = signal('08:00');
  modalEnd = signal('16:20');

  ngOnInit() {
    this.teamService.loadTeam();
    this.setupWeek(this.currentDate());
  }

  setupWeek(date: Date) {
    const day = date.getDay();
    // Ajusta para segunda-feira (0 é domingo, então se for 0, volta 6 dias, senão volta day-1)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    this.weekDates.set(dates);
    this.carregarEscalasDaSemana();
  }

  mudarSemana(offset: number) {
    const newDate = new Date(this.weekDates()[0]);
    newDate.setDate(newDate.getDate() + (offset * 7));
    this.currentDate.set(newDate);
    this.setupWeek(newDate);
  }

  formatDate(d: Date): string {
    // Retorna YYYY-MM-DD local
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzoffset)).toISOString().split('T')[0];
  }

  carregarEscalasDaSemana() {
    const start = this.formatDate(this.weekDates()[0]);
    const end = this.formatDate(this.weekDates()[6]);
    this.scheduleService.loadSchedules(start, end);
  }

  getSchedule(userId: string, date: Date): Schedule | undefined {
    const dateStr = this.formatDate(date);
    return this.scheduleService.schedules().find(s => 
      s.user_id === userId && s.date.startsWith(dateStr)
    );
  }

  abrirModalEdicao(userId: string, date: Date) {
    this.modalUserId.set(userId);
    this.modalData.set(date);
    
    const existing = this.getSchedule(userId, date);
    if (existing) {
      this.modalType.set(existing.type);
      this.modalStart.set(existing.shift_start?.substring(0, 5) || '08:00');
      this.modalEnd.set(existing.shift_end?.substring(0, 5) || '16:20');
    } else {
      this.modalType.set('regular');
      this.modalStart.set('08:00');
      this.modalEnd.set('16:20');
    }
    
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  async salvarEscala() {
    if (!this.modalData() || !this.modalUserId()) return;

    const schedule: Schedule = {
      user_id: this.modalUserId(),
      date: this.formatDate(this.modalData()!),
      type: this.modalType(),
      shift_start: this.modalType() === 'folga' ? null : this.modalStart(),
      shift_end: this.modalType() === 'folga' ? null : this.modalEnd()
    };

    await this.scheduleService.saveSchedule(schedule);
    this.fecharModal();
  }

  async gerarEscalaPadrao() {
    // Gera uma escala padrão (seg a sab 08:00-16:20, dom folga) para todos
    const members = this.teamService.teamMembers();
    if (members.length === 0) return;

    for (const member of members) {
      for (let i = 0; i < 7; i++) {
        const date = this.weekDates()[i];
        const isSunday = date.getDay() === 0;
        
        const schedule: Schedule = {
          user_id: member.id,
          date: this.formatDate(date),
          type: isSunday ? 'folga' : 'regular',
          shift_start: isSunday ? null : '08:00',
          shift_end: isSunday ? null : '16:20'
        };
        
        await this.scheduleService.saveSchedule(schedule);
      }
    }
  }
}
