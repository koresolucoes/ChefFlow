import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Produção (Mise en Place)</h1>
          <p class="text-stone-500 mt-1">Prep list inteligente e fichas técnicas.</p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>add</mat-icon>
            Nova Tarefa
          </button>
        </div>
      </header>

      <!-- Praças Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button 
          (click)="activePraca.set('todas')"
          [class.bg-stone-900]="activePraca() === 'todas'"
          [class.text-white]="activePraca() === 'todas'"
          [class.bg-white]="activePraca() !== 'todas'"
          [class.text-stone-600]="activePraca() !== 'todas'"
          class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
          Todas as Praças
        </button>
        <button 
          (click)="activePraca.set('quente')"
          [class.bg-stone-900]="activePraca() === 'quente'"
          [class.text-white]="activePraca() === 'quente'"
          [class.bg-white]="activePraca() !== 'quente'"
          [class.text-stone-600]="activePraca() !== 'quente'"
          class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
          Praça Quente
        </button>
        <button 
          (click)="activePraca.set('fria')"
          [class.bg-stone-900]="activePraca() === 'fria'"
          [class.text-white]="activePraca() === 'fria'"
          [class.bg-white]="activePraca() !== 'fria'"
          [class.text-stone-600]="activePraca() !== 'fria'"
          class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
          Praça Fria (Garde Manger)
        </button>
        <button 
          (click)="activePraca.set('confeitaria')"
          [class.bg-stone-900]="activePraca() === 'confeitaria'"
          [class.text-white]="activePraca() === 'confeitaria'"
          [class.bg-white]="activePraca() !== 'confeitaria'"
          [class.text-stone-600]="activePraca() !== 'confeitaria'"
          class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors">
          Confeitaria
        </button>
      </div>

      <!-- Prep List -->
      <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 class="font-bold text-stone-900">Prep List de Hoje</h2>
          <div class="text-sm font-medium text-stone-500">65% Concluído</div>
        </div>
        
        <div class="divide-y divide-stone-100">
          <!-- Tarefa 1 -->
          <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors">
            <button class="mt-1 w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 bg-emerald-50 shrink-0">
              <mat-icon class="text-[16px] w-4 h-4">check</mat-icon>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-stone-900 line-through opacity-50">Caldo de Legumes</h3>
                <span class="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded">Quente</span>
              </div>
              <p class="text-sm text-stone-500 mt-1">Fazer 10 litros para o serviço da noite.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button class="p-2 text-stone-400 hover:text-stone-900 rounded-lg" title="Ficha Técnica">
                <mat-icon>menu_book</mat-icon>
              </button>
              <button class="p-2 text-stone-400 hover:text-stone-900 rounded-lg" title="Imprimir Etiqueta">
                <mat-icon>label</mat-icon>
              </button>
            </div>
          </div>

          <!-- Tarefa 2 -->
          <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors bg-amber-50/30">
            <button class="mt-1 w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0">
              <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-stone-900">Porcionar Mignon</h3>
                <span class="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded">Quente</span>
                <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-wider rounded">Em Produção</span>
              </div>
              <p class="text-sm text-stone-500 mt-1">Cortar medalhões de 200g (30 porções).</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button class="p-2 text-stone-400 hover:text-stone-900 rounded-lg" title="Ficha Técnica">
                <mat-icon>menu_book</mat-icon>
              </button>
              <button class="p-2 text-stone-400 hover:text-stone-900 rounded-lg" title="Imprimir Etiqueta">
                <mat-icon>label</mat-icon>
              </button>
            </div>
          </div>

          <!-- Tarefa 3 -->
          <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors">
            <button class="mt-1 w-6 h-6 rounded-full border-2 border-stone-300 shrink-0" aria-label="Marcar como concluído"></button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-stone-900">Massa de Ravioli</h3>
                <span class="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider rounded">Fria</span>
              </div>
              <p class="text-sm text-stone-500 mt-1">Bater 2kg de massa fresca.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button class="p-2 text-stone-400 hover:text-stone-900 rounded-lg" title="Ficha Técnica">
                <mat-icon>menu_book</mat-icon>
              </button>
              <button class="p-2 text-stone-400 hover:text-stone-900 rounded-lg" title="Imprimir Etiqueta">
                <mat-icon>label</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProducaoComponent {
  activePraca = signal<'todas' | 'quente' | 'fria' | 'confeitaria'>('todas');
}
