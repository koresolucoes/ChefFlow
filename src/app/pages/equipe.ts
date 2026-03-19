import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-equipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight">Gestão de Equipe e Praças</h1>
          <p class="text-stone-500 text-sm mt-1">Gerencie os membros da cozinha, seus acessos e as praças de trabalho.</p>
        </div>
        <div class="flex gap-2">
          <button (click)="toggleTeamForm()" class="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm border border-stone-200">
            <mat-icon class="text-[20px] w-5 h-5">{{ showTeamForm() ? 'close' : 'add' }}</mat-icon>
            {{ showTeamForm() ? 'Cancelar' : 'Nova Praça' }}
          </button>
          <button (click)="toggleForm()" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <mat-icon class="text-[20px] w-5 h-5">{{ showForm() ? 'close' : 'add' }}</mat-icon>
            {{ showForm() ? 'Cancelar' : 'Novo Membro' }}
          </button>
        </div>
      </div>

      <!-- Formulário de Praça -->
      @if (showTeamForm()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Adicionar Nova Praça</h2>
          
          <form [formGroup]="pracaForm" (ngSubmit)="onSubmitTeam()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Nome da Praça</label>
              <input type="text" formControlName="name" placeholder="Ex: Cozinha Quente" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Descrição (Opcional)</label>
              <input type="text" formControlName="description" placeholder="Responsável por grelhados..." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>

            <div class="md:col-span-2 flex justify-end mt-2">
              <button type="submit" [disabled]="pracaForm.invalid || isSubmittingTeam()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmittingTeam()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">save</mat-icon>
                  Salvar Praça
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Formulário de Membro -->
      @if (showForm()) {
        <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-semibold text-stone-900 mb-4">Adicionar Novo Membro</h2>
          
          <form [formGroup]="teamForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Nome Completo</label>
              <input type="text" formControlName="name" placeholder="Ex: João Silva" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">E-mail</label>
              <input type="email" formControlName="email" placeholder="joao@restaurante.com" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Senha Temporária</label>
              <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-stone-700">Cargo / Função</label>
              <select formControlName="role" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="cook">Cozinheiro / Auxiliar</option>
                <option value="chef">Chef de Praça</option>
                <option value="admin">Chef Executivo / Admin</option>
              </select>
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label class="text-sm font-medium text-stone-700">Praça (Equipe)</label>
              <select formControlName="team_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                <option value="">Nenhuma praça (Geral)</option>
                @for (team of teamService.teams(); track team.id) {
                  <option [value]="team.id">{{ team.name }}</option>
                }
              </select>
            </div>

            <div class="md:col-span-2 flex justify-end mt-2">
              <button type="submit" [disabled]="teamForm.invalid || isSubmitting()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">save</mat-icon>
                  Salvar Membro
                }
              </button>
            </div>
          </form>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Lista de Praças -->
        <div class="lg:col-span-1 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-stone-200 bg-stone-50">
            <h3 class="font-semibold text-stone-800">Praças da Cozinha</h3>
          </div>
          <div class="divide-y divide-stone-200">
            @if (teamService.isLoadingTeams()) {
              <div class="p-6 text-center text-stone-500">
                <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
                <p>Carregando praças...</p>
              </div>
            } @else if (teamService.teams().length === 0) {
              <div class="p-6 text-center text-stone-500">
                <p>Nenhuma praça cadastrada.</p>
              </div>
            } @else {
              @for (team of teamService.teams(); track team.id) {
                <div class="p-4 hover:bg-stone-50/50 transition-colors flex justify-between items-start group">
                  <div>
                    <h4 class="font-medium text-stone-900">{{ team.name }}</h4>
                    @if (team.description) {
                      <p class="text-xs text-stone-500 mt-1 line-clamp-2">{{ team.description }}</p>
                    }
                  </div>
                  <button (click)="removeTeam(team.id)" class="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remover Praça">
                    <mat-icon class="text-[18px] w-4.5 h-4.5">delete_outline</mat-icon>
                  </button>
                </div>
              }
            }
          </div>
        </div>

        <!-- Lista de Equipe -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                  <th class="px-6 py-4 font-semibold">Membro</th>
                  <th class="px-6 py-4 font-semibold">Contato</th>
                  <th class="px-6 py-4 font-semibold">Função / Praça</th>
                  <th class="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200">
                @if (teamService.isLoading()) {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-stone-500">
                      <mat-icon class="animate-spin text-emerald-600 mb-2">refresh</mat-icon>
                      <p>Carregando equipe...</p>
                    </td>
                  </tr>
                } @else if (teamService.teamMembers().length === 0) {
                  <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-stone-500">
                      <p>Nenhum membro cadastrado.</p>
                    </td>
                  </tr>
                } @else {
                  @for (member of teamService.teamMembers(); track member.id) {
                    <tr class="hover:bg-stone-50/50 transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 font-bold text-sm shrink-0">
                            {{ member.name.charAt(0) }}
                          </div>
                          <div class="font-medium text-stone-900">{{ member.name }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-stone-600 text-sm">{{ member.email }}</td>
                      <td class="px-6 py-4">
                        <div class="flex flex-col gap-1 items-start">
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                                [ngClass]="{
                                  'bg-emerald-100 text-emerald-800': member.role === 'admin',
                                  'bg-amber-100 text-amber-800': member.role === 'chef',
                                  'bg-stone-100 text-stone-800': member.role === 'cook'
                                }">
                            {{ getRoleLabel(member.role) }}
                          </span>
                          @if (member.teams?.name) {
                            <span class="text-xs text-stone-500 font-medium">
                              {{ member.teams?.name }}
                            </span>
                          }
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <button (click)="removeMember(member.id)" class="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                          <mat-icon class="text-[20px] w-5 h-5">delete_outline</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipeComponent implements OnInit {
  teamService = inject(TeamService);
  private fb = inject(FormBuilder);

  showForm = signal(false);
  showTeamForm = signal(false);
  isSubmitting = signal(false);
  isSubmittingTeam = signal(false);

  teamForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['cook', Validators.required],
    team_id: ['']
  });

  pracaForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.teamService.loadTeams();
    this.teamService.loadTeam();
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (this.showForm()) {
      this.showTeamForm.set(false);
    } else {
      this.teamForm.reset({ role: 'cook', team_id: '' });
    }
  }

  toggleTeamForm() {
    this.showTeamForm.update(v => !v);
    if (this.showTeamForm()) {
      this.showForm.set(false);
    } else {
      this.pracaForm.reset();
    }
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'Admin / Executivo',
      'chef': 'Chef de Praça',
      'cook': 'Cozinheiro'
    };
    return roles[role] || role;
  }

  async onSubmit() {
    if (this.teamForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.teamForm.value;
      const memberData = {
        name: formValue.name || '',
        email: formValue.email || '',
        password: formValue.password || '',
        role: (formValue.role || 'cook') as 'admin' | 'chef' | 'cook',
        team_id: formValue.team_id || undefined
      };
      
      const success = await this.teamService.addMember(memberData);
      this.isSubmitting.set(false);
      
      if (success) {
        this.toggleForm();
      }
    }
  }

  async onSubmitTeam() {
    if (this.pracaForm.valid) {
      this.isSubmittingTeam.set(true);
      const formValue = this.pracaForm.value;
      
      const success = await this.teamService.addTeam({
        name: formValue.name || '',
        description: formValue.description || ''
      });
      
      this.isSubmittingTeam.set(false);
      
      if (success) {
        this.toggleTeamForm();
      }
    }
  }

  async removeMember(id: string) {
    if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
      await this.teamService.removeMember(id);
    }
  }

  async removeTeam(id: string) {
    if (confirm('Tem certeza que deseja remover esta praça? Os membros vinculados ficarão sem praça.')) {
      await this.teamService.removeTeam(id);
    }
  }
}
