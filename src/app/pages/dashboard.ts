import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="space-y-6">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Visão Geral</h1>
          <p class="text-stone-500 mt-1">Bem-vindo ao ChefFlow. Aqui está o resumo da operação de hoje.</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-stone-500 uppercase tracking-wider">Data</p>
          <p class="text-lg font-semibold text-stone-900">18 Mar 2026</p>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Equipe Presente</h3>
            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <mat-icon>group</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">12</span>
            <span class="text-sm text-stone-500">/ 15</span>
          </div>
          <p class="text-xs text-stone-500 mt-2">3 atrasos registrados</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Prep List</h3>
            <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <mat-icon>receipt_long</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">65%</span>
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 mt-3">
            <div class="bg-amber-500 h-1.5 rounded-full" style="width: 65%"></div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Limpeza (Fechamento)</h3>
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <mat-icon>cleaning_services</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">Pendente</span>
          </div>
          <p class="text-xs text-stone-500 mt-2">0/8 tarefas concluídas</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-stone-500">Custo Extras (Hoje)</h3>
            <div class="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <mat-icon>payments</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-stone-900">R$ 450</span>
          </div>
          <p class="text-xs text-stone-500 mt-2">3 freelancers ativos</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Avisos -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div class="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 class="text-lg font-bold text-stone-900">Mural do Chef</h2>
            <button class="text-sm font-medium text-emerald-600 hover:text-emerald-700">Novo Aviso</button>
          </div>
          <div class="divide-y divide-stone-100">
            <div class="p-6 flex gap-4">
              <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <mat-icon>campaign</mat-icon>
              </div>
              <div>
                <h4 class="text-sm font-bold text-stone-900">Atenção ao Ponto da Carne</h4>
                <p class="text-sm text-stone-600 mt-1">Tivemos 2 devoluções ontem por carne passada. Revisar termômetros da grelha antes do serviço.</p>
                <p class="text-xs text-stone-400 mt-2">Há 2 horas • Chef Executivo</p>
              </div>
            </div>
            <div class="p-6 flex gap-4">
              <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <mat-icon>info</mat-icon>
              </div>
              <div>
                <h4 class="text-sm font-bold text-stone-900">Prato do Dia: Risoto de Polvo</h4>
                <p class="text-sm text-stone-600 mt-1">Focar na venda do risoto hoje. Temos estoque alto de polvo que precisa girar.</p>
                <p class="text-xs text-stone-400 mt-2">Ontem • Subchefe</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Alertas de Validade -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div class="p-6 border-b border-stone-100">
            <h2 class="text-lg font-bold text-stone-900">Alertas PVPS</h2>
            <p class="text-xs text-stone-500 mt-1">Vencimentos próximos (48h)</p>
          </div>
          <div class="p-4 space-y-3">
            <div class="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
              <mat-icon class="text-rose-500 mt-0.5">warning</mat-icon>
              <div>
                <h4 class="text-sm font-bold text-rose-900">Molho Demi-Glace</h4>
                <p class="text-xs text-rose-700 mt-0.5">Vence hoje às 23:00</p>
                <p class="text-xs text-rose-600 mt-1 font-medium">Geladeira 2 • Prateleira B</p>
              </div>
            </div>
            <div class="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
              <mat-icon class="text-amber-500 mt-0.5">schedule</mat-icon>
              <div>
                <h4 class="text-sm font-bold text-amber-900">Massa Fresca</h4>
                <p class="text-xs text-amber-700 mt-0.5">Vence amanhã às 10:00</p>
                <p class="text-xs text-amber-600 mt-1 font-medium">Câmara Fria • Carrinho 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {}
