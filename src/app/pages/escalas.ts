import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalas',
  standalone: true,
  imports: [MatIconModule, CommonModule],
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
          <button class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>add</mat-icon>
            Gerar Escala
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
                <button class="p-1 hover:bg-stone-200 rounded text-stone-600"><mat-icon>chevron_left</mat-icon></button>
                <span class="font-bold text-stone-900">16 Mar - 22 Mar 2026</span>
                <button class="p-1 hover:bg-stone-200 rounded text-stone-600"><mat-icon>chevron_right</mat-icon></button>
              </div>
              <div class="flex gap-2 text-sm">
                <span class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-medium">6x1</span>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">12x36</span>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-stone-200">
                <thead class="bg-stone-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Colaborador</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Seg (16)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Ter (17)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Qua (18)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Qui (19)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Sex (20)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Sáb (21)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Dom (22)</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-stone-200">
                  <!-- Row 1 -->
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">J</div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-stone-900">João Silva</div>
                          <div class="text-xs text-stone-500">Cozinheiro Líder (6x1)</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">08:00 - 16:20</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">08:00 - 16:20</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">FOLGA</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">08:00 - 16:20</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">08:00 - 16:20</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">08:00 - 16:20</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">08:00 - 16:20</span></td>
                  </tr>
                  <!-- Row 2 -->
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">M</div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-stone-900">Maria Souza</div>
                          <div class="text-xs text-stone-500">Auxiliar (12x36 - Eq. A)</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">10:00 - 22:00</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">FOLGA</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">10:00 - 22:00</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">FOLGA</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">10:00 - 22:00</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">FOLGA</span></td>
                    <td class="px-2 py-4 whitespace-nowrap text-center"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">10:00 - 22:00</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (activeTab() === 'freelancers') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Vaga Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <div class="flex justify-between items-start mb-4">
                <div class="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded uppercase tracking-wide">Vaga Aberta</div>
                <span class="text-lg font-bold text-stone-900">R$ 150</span>
              </div>
              <h3 class="text-lg font-bold text-stone-900">Pia / Lavador</h3>
              <p class="text-sm text-stone-500 mt-1">Sexta-feira, 20 Mar • 18:00 - 02:00</p>
              <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span class="text-sm text-stone-500">0 candidaturas</span>
                <button class="text-sm font-medium text-emerald-600 hover:text-emerald-700">Editar</button>
              </div>
            </div>

            <!-- Freelancer Confirmado -->
            <div class="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
              <div class="flex justify-between items-start mb-4">
                <div class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded uppercase tracking-wide">Confirmado</div>
                <span class="text-lg font-bold text-stone-900">R$ 180</span>
              </div>
              <h3 class="text-lg font-bold text-stone-900">Cozinheiro (Praça Quente)</h3>
              <p class="text-sm text-stone-500 mt-1">Sábado, 21 Mar • 16:00 - 00:00</p>
              <div class="mt-4 pt-4 border-t border-stone-100 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">P</div>
                <span class="text-sm font-medium text-stone-900">Pedro Alves</span>
              </div>
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
            <div class="divide-y divide-stone-100">
              <div class="p-4 flex items-center justify-between hover:bg-stone-50">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div>
                    <p class="font-medium text-stone-900">João Silva</p>
                    <p class="text-xs text-stone-500">Turno: 08:00 - 16:20</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-mono text-sm text-stone-900">Entrada: 07:55</p>
                  <p class="text-xs text-emerald-600 font-medium">No horário</p>
                </div>
              </div>
              
              <div class="p-4 flex items-center justify-between hover:bg-stone-50">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <mat-icon>warning</mat-icon>
                  </div>
                  <div>
                    <p class="font-medium text-stone-900">Maria Souza</p>
                    <p class="text-xs text-stone-500">Turno: 10:00 - 22:00</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-mono text-sm text-stone-900">Entrada: 10:15</p>
                  <p class="text-xs text-rose-600 font-medium">Atraso (15m)</p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EscalasComponent {
  activeTab = signal<'escala' | 'freelancers' | 'ponto'>('escala');
}
