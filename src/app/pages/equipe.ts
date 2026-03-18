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
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight">Gestão de Equipe</h1>
          <p class="text-stone-500 text-sm mt-1">Gerencie os membros da cozinha e seus acessos.</p>
        </div>
        <button (click)="toggleForm()" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <mat-icon class="text-[20px] w-5 h-5">{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'Cancelar' : 'Novo Membro' }}
        </button>
      </div>

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

      <!-- Lista de Equipe -->
      <div class="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                <th class="px-6 py-4 font-semibold">Membro</th>
                <th class="px-6 py-4 font-semibold">Contato</th>
                <th class="px-6 py-4 font-semibold">Função</th>
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
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            [ngClass]="{
                              'bg-emerald-100 text-emerald-800': member.role === 'admin',
                              'bg-amber-100 text-amber-800': member.role === 'chef',
                              'bg-stone-100 text-stone-800': member.role === 'cook'
                            }">
                        {{ getRoleLabel(member.role) }}
                      </span>
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipeComponent implements OnInit {
  teamService = inject(TeamService);
  private fb = inject(FormBuilder);

  showForm = signal(false);
  isSubmitting = signal(false);

  teamForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['cook', Validators.required]
  });

  ngOnInit() {
    this.teamService.loadTeam();
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.teamForm.reset({ role: 'cook' });
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
        role: (formValue.role || 'cook') as 'admin' | 'chef' | 'cook'
      };
      
      const success = await this.teamService.addMember(memberData);
      this.isSubmitting.set(false);
      
      if (success) {
        this.toggleForm();
      }
    }
  }

  async removeMember(id: string) {
    if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
      await this.teamService.removeMember(id);
    }
  }
}
