import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comunicacao',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Comunicação & BI</h1>
          <p class="text-stone-500 mt-1">Mural do Chef e relatórios de performance.</p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>campaign</mat-icon>
            Novo Aviso
          </button>
        </div>
      </header>

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

      <!-- Tab Content -->
      <div class="mt-6">
        @if (activeTab() === 'mural') {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div class="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 class="font-bold text-stone-900">Avisos Recentes</h2>
            </div>
            
            <div class="divide-y divide-stone-100">
              <!-- Aviso 1 -->
              <div class="p-6 hover:bg-stone-50 transition-colors">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <mat-icon>campaign</mat-icon>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <h3 class="text-lg font-bold text-stone-900">Atenção ao Ponto da Carne</h3>
                      <span class="text-xs text-stone-400">Há 2 horas</span>
                    </div>
                    <p class="text-stone-600 mt-2">Tivemos 2 devoluções ontem por carne passada. Revisar termômetros da grelha antes do serviço. O padrão da casa para "ao ponto" é 55°C internos.</p>
                    <div class="mt-4 flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">C</div>
                      <span class="text-xs font-medium text-stone-500">Chef Executivo</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Aviso 2 -->
              <div class="p-6 hover:bg-stone-50 transition-colors">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <mat-icon>info</mat-icon>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <h3 class="text-lg font-bold text-stone-900">Prato do Dia: Risoto de Polvo</h3>
                      <span class="text-xs text-stone-400">Ontem, 18:30</span>
                    </div>
                    <p class="text-stone-600 mt-2">Focar na venda do risoto hoje. Temos estoque alto de polvo que precisa girar. Sugerir harmonização com o vinho branco da casa.</p>
                    <div class="mt-4 flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center text-[10px] font-bold">S</div>
                      <span class="text-xs font-medium text-stone-500">Subchefe</span>
                    </div>
                  </div>
                </div>
              </div>
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
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComunicacaoComponent {
  activeTab = signal<'mural' | 'bi'>('mural');
}
