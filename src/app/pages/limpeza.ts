import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-limpeza',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Higiene & Limpeza</h1>
          <p class="text-stone-500 mt-1">Checklists sanitários e termometria.</p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <mat-icon>add</mat-icon>
            Novo Registro
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="border-b border-stone-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button 
            (click)="activeTab.set('checklists')"
            [class.border-stone-900]="activeTab() === 'checklists'"
            [class.text-stone-900]="activeTab() === 'checklists'"
            [class.border-transparent]="activeTab() !== 'checklists'"
            [class.text-stone-500]="activeTab() !== 'checklists'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Checklists de Fechamento
          </button>
          <button 
            (click)="activeTab.set('termometria')"
            [class.border-stone-900]="activeTab() === 'termometria'"
            [class.text-stone-900]="activeTab() === 'termometria'"
            [class.border-transparent]="activeTab() !== 'termometria'"
            [class.text-stone-500]="activeTab() !== 'termometria'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Termometria (Equipamentos)
          </button>
          <button 
            (click)="activeTab.set('fechamento')"
            [class.border-stone-900]="activeTab() === 'fechamento'"
            [class.text-stone-900]="activeTab() === 'fechamento'"
            [class.border-transparent]="activeTab() !== 'fechamento'"
            [class.text-stone-500]="activeTab() !== 'fechamento'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Fechamento de Plantão (Chef)
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="mt-6">
        @if (activeTab() === 'checklists') {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 class="font-bold text-stone-900">Fechamento da Cozinha - 18 Mar</h2>
              <div class="text-sm font-medium text-stone-500">0/8 Concluído</div>
            </div>
            
            <div class="divide-y divide-stone-100">
              <!-- Tarefa 1 -->
              <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors">
                <button class="mt-1 w-6 h-6 rounded-full border-2 border-stone-300 shrink-0" aria-label="Marcar como concluído"></button>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold text-stone-900">Limpeza da Chapa e Grelha</h3>
                  <p class="text-sm text-stone-500 mt-1">Desengordurar, raspar e aplicar óleo protetor.</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded flex items-center gap-1">
                    <mat-icon class="text-[14px] w-3.5 h-3.5">photo_camera</mat-icon>
                    Foto Obrigatória
                  </span>
                </div>
              </div>

              <!-- Tarefa 2 -->
              <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors">
                <button class="mt-1 w-6 h-6 rounded-full border-2 border-stone-300 shrink-0" aria-label="Marcar como concluído"></button>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold text-stone-900">Higienização das Bancadas (Inox)</h3>
                  <p class="text-sm text-stone-500 mt-1">Lavar com detergente e sanitizar com álcool 70%.</p>
                </div>
              </div>

              <!-- Tarefa 3 -->
              <div class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors">
                <button class="mt-1 w-6 h-6 rounded-full border-2 border-stone-300 shrink-0" aria-label="Marcar como concluído"></button>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold text-stone-900">Limpeza do Chão (Lavagem)</h3>
                  <p class="text-sm text-stone-500 mt-1">Varrer, esfregar com desengordurante e secar.</p>
                </div>
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'termometria') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Equipamento 1 -->
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <mat-icon>ac_unit</mat-icon>
                </div>
                <span class="text-2xl font-bold text-stone-900">3°C</span>
              </div>
              <h3 class="text-lg font-bold text-stone-900">Câmara Fria Principal</h3>
              <p class="text-sm text-stone-500 mt-1">Meta: 0°C a 4°C</p>
              <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span class="text-xs text-stone-500">Última leitura: 10:00</span>
                <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded uppercase tracking-wide">Normal</span>
              </div>
            </div>

            <!-- Equipamento 2 -->
            <div class="bg-white rounded-2xl shadow-sm border border-rose-200 p-6 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
              <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <mat-icon>kitchen</mat-icon>
                </div>
                <span class="text-2xl font-bold text-rose-600">8°C</span>
              </div>
              <h3 class="text-lg font-bold text-stone-900">Geladeira de Carnes</h3>
              <p class="text-sm text-stone-500 mt-1">Meta: 0°C a 4°C</p>
              <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span class="text-xs text-stone-500">Última leitura: 10:00</span>
                <span class="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded uppercase tracking-wide flex items-center gap-1">
                  <mat-icon class="text-[14px] w-3.5 h-3.5">warning</mat-icon>
                  Alerta
                </span>
              </div>
            </div>

            <!-- Equipamento 3 -->
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <mat-icon>ac_unit</mat-icon>
                </div>
                <span class="text-2xl font-bold text-stone-900">-18°C</span>
              </div>
              <h3 class="text-lg font-bold text-stone-900">Freezer Vertical</h3>
              <p class="text-sm text-stone-500 mt-1">Meta: -18°C ou menos</p>
              <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span class="text-xs text-stone-500">Última leitura: 10:00</span>
                <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded uppercase tracking-wide">Normal</span>
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'fechamento') {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Checklist de Auditoria -->
            <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div class="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <div>
                  <h2 class="font-bold text-stone-900">Auditoria de Fechamento</h2>
                  <p class="text-sm text-stone-500">Verificação final detalhada do Chef de Turno</p>
                </div>
                <span class="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wide">Em Andamento</span>
              </div>
              
              <div class="divide-y divide-stone-100">
                @for (task of fechamentoTasks(); track task.id) {
                  <div class="p-4 hover:bg-stone-50 transition-colors">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-base font-bold text-stone-900">{{ task.title }}</h3>
                        <p class="text-sm text-stone-500 mt-1">{{ task.description }}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button 
                          (click)="setStatus(task.id, 'conforme')"
                          [class.bg-emerald-100]="task.status === 'conforme'"
                          [class.text-emerald-800]="task.status === 'conforme'"
                          [class.border-emerald-200]="task.status === 'conforme'"
                          [class.bg-white]="task.status !== 'conforme'"
                          [class.text-stone-500]="task.status !== 'conforme'"
                          [class.border-stone-200]="task.status !== 'conforme'"
                          class="px-3 py-1.5 border rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">check_circle</mat-icon>
                          Conforme
                        </button>
                        <button 
                          (click)="setStatus(task.id, 'nao_conforme')"
                          [class.bg-rose-100]="task.status === 'nao_conforme'"
                          [class.text-rose-800]="task.status === 'nao_conforme'"
                          [class.border-rose-200]="task.status === 'nao_conforme'"
                          [class.bg-white]="task.status !== 'nao_conforme'"
                          [class.text-stone-500]="task.status !== 'nao_conforme'"
                          [class.border-stone-200]="task.status !== 'nao_conforme'"
                          class="px-3 py-1.5 border rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors hover:bg-rose-50 hover:text-rose-700">
                          <mat-icon class="text-[18px] w-4.5 h-4.5">cancel</mat-icon>
                          Não Conforme
                        </button>
                      </div>
                    </div>
                    
                    @if (task.status === 'nao_conforme') {
                      <div class="mt-3 pl-0 sm:pl-4 border-l-2 border-rose-200">
                        <label [for]="'reason-' + task.id" class="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">Motivo da Não Conformidade</label>
                        <textarea 
                          [id]="'reason-' + task.id"
                          [ngModel]="task.reason"
                          (ngModelChange)="updateReason(task.id, $event)"
                          class="w-full p-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none" 
                          rows="2" 
                          placeholder="Ex: Faltou produto de limpeza, equipamento quebrado, equipe saiu mais cedo..."></textarea>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Análise e Assinatura -->
            <div class="space-y-6">
              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <h3 class="text-lg font-bold text-stone-900 mb-4">Análise Geral do Plantão</h3>
                <textarea class="w-full h-32 p-3 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" placeholder="Registre ocorrências gerais, quebras de equipamento, faltas ou observações sobre o serviço de hoje..." aria-label="Análise do plantão"></textarea>
                
                <div class="mt-6 pt-6 border-t border-stone-100">
                  <button class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <mat-icon>verified</mat-icon>
                    Assinar e Encerrar Plantão
                  </button>
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
export class LimpezaComponent {
  activeTab = signal<'checklists' | 'termometria' | 'fechamento'>('fechamento');

  fechamentoTasks = signal([
    { id: '1', title: 'Limpeza das Praças', description: 'Todas as praças higienizadas e organizadas.', status: 'pending', reason: '' },
    { id: '2', title: 'Equipamentos e Exaustão', description: 'Fornos, fritadeiras, chapas e exaustão desligados.', status: 'pending', reason: '' },
    { id: '3', title: 'Válvulas de Gás', description: 'Registros de gás principal e das praças fechados.', status: 'pending', reason: '' },
    { id: '4', title: 'Câmaras e Geladeiras', description: 'Organizadas, sem produtos abertos sem etiqueta, e trancadas.', status: 'pending', reason: '' },
    { id: '5', title: 'Gestão de Validades (PVPS)', description: 'Insumos vencidos descartados e baixados no sistema.', status: 'pending', reason: '' },
    { id: '6', title: 'Gestão de Resíduos', description: 'Lixo retirado, lixeiras lavadas e chão limpo.', status: 'pending', reason: '' },
    { id: '7', title: 'Ponto da Equipe', description: 'Todos os colaboradores registraram a saída.', status: 'pending', reason: '' },
    { id: '8', title: 'Requisições de Estoque', description: 'Pedidos para a produção de amanhã enviados ao almoxarifado.', status: 'pending', reason: '' }
  ]);

  setStatus(id: string, status: 'conforme' | 'nao_conforme') {
    this.fechamentoTasks.update(tasks => tasks.map(t => t.id === id ? { ...t, status } : t));
  }

  updateReason(id: string, reason: string) {
    this.fechamentoTasks.update(tasks => tasks.map(t => t.id === id ? { ...t, reason } : t));
  }
}
