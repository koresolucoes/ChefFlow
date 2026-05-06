import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PrepTaskService } from '../services/prep-task.service';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-servico',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-[100] bg-stone-950 flex flex-col overflow-hidden text-stone-100 font-sans">
      <!-- HEADER MODO COMBATE -->
      <header class="bg-stone-900 border-b border-stone-800 p-4 shrink-0 flex justify-between items-center shadow-lg">
         <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]">
              <mat-icon class="text-3xl">local_fire_department</mat-icon>
            </div>
            <div>
               <h1 class="text-2xl font-black text-white uppercase tracking-widest leading-none">Modo Serviço</h1>
               <span class="text-stone-400 font-bold text-sm uppercase tracking-wider">{{ stationName() || 'Cozinha Principal' }}</span>
            </div>
         </div>
         <div class="flex gap-3">
            <div class="bg-stone-800 px-4 py-2 rounded-lg flex flex-col items-center justify-center border border-stone-700">
               <span class="text-[10px] uppercase font-bold text-stone-400">Tarefas Pendentes</span>
               <span class="text-2xl font-black text-orange-500">{{ pendingTasksCount() }}</span>
            </div>
         </div>
      </header>

      <!-- CORPO DO PAINEL -->
      <div class="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
         
         <!-- PRODUÇÃO PENDENTE (AGORA) -->
         <div class="flex flex-col gap-4">
            <h2 class="text-xl font-black text-stone-300 uppercase tracking-widest flex items-center gap-2 border-b border-stone-800 pb-2">
              <mat-icon class="text-orange-500">priority_high</mat-icon> Produção Urgente
            </h2>
            
            <div class="space-y-3">
               @for (task of urgentTasks(); track task.id) {
                  <div class="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md touch-manipulation hover:border-orange-500/50 transition-colors">
                     <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                           <h3 class="text-xl font-black text-white leading-tight uppercase">{{ task.name }}</h3>
                           @if (task.target_portions) {
                              <div class="inline-flex mt-2 items-center px-2 py-1 rounded bg-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider">
                                Alvo: {{ task.target_portions }} porções
                              </div>
                           }
                        </div>
                        <button (click)="completeTask(task.id)" class="w-16 h-16 shrink-0 bg-stone-800 hover:bg-emerald-600 rounded-xl text-stone-400 hover:text-white transition-colors flex items-center justify-center border border-stone-700 shadow-sm active:scale-95">
                           <mat-icon class="text-4xl">check</mat-icon>
                        </button>
                     </div>
                     <div class="flex justify-end gap-2 border-t border-stone-800 pt-3">
                        <button (click)="printLabel(task)" class="bg-stone-800 text-stone-300 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 active:scale-95 hover:bg-stone-700 hover:text-white transition-colors border border-stone-700">
                           <mat-icon class="text-lg">print</mat-icon> Etiqueta Validade
                        </button>
                     </div>
                  </div>
               }
               @if (urgentTasks().length === 0) {
                  <div class="bg-stone-900/50 border border-stone-800 border-dashed rounded-2xl p-8 text-center text-stone-500 font-bold uppercase tracking-wider">
                     <mat-icon class="text-5xl opacity-50 mb-2">check_circle</mat-icon>
                     <p>Nenhuma pendência na praça.</p>
                  </div>
               }
            </div>
         </div>

         <!-- FALTAS E REQUISIÇÕES RÁPIDAS -->
         <div class="flex flex-col gap-4">
            <h2 class="text-xl font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 border-b border-stone-800 pb-2">
              <mat-icon>warning</mat-icon> Alerta de Estoque (Sua Praça)
            </h2>
            
            <div class="space-y-3">
               @for (item of lowStockItems(); track item.id) {
                  <div class="bg-red-950/20 border border-red-900/50 rounded-2xl p-4 flex justify-between items-center shadow-md touch-manipulation">
                     <div>
                        <h3 class="text-lg font-black text-white uppercase">{{ item.name }}</h3>
                        <div class="text-rose-400 font-bold text-sm mt-1 uppercase tracking-wider">
                           Atual: <span class="text-rose-500">{{ item.quantity }} {{ item.unit }}</span> 
                           (Min: {{ item.min_quantity }})
                        </div>
                     </div>
                     <button class="px-4 h-14 bg-rose-700 hover:bg-rose-600 rounded-xl font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-colors active:scale-95 text-white">
                        <mat-icon>add_shopping_cart</mat-icon> 
                        <span class="hidden sm:inline">Pedir</span>
                     </button>
                  </div>
               }
               @if (lowStockItems().length === 0) {
                  <div class="bg-stone-900/50 border border-stone-800 border-dashed rounded-2xl p-8 text-center text-stone-500 font-bold uppercase tracking-wider">
                     <mat-icon class="text-5xl opacity-50 mb-2">inventory_2</mat-icon>
                     <p>Estoque da praça abastecido.</p>
                  </div>
               }
            </div>
         </div>

      </div>
      
      <!-- MENU FLUTUANTE INFERIOR: SAÍDA -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2">
         <button (click)="exitCombatMode()" class="bg-white text-stone-950 px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-3 active:scale-95 transition-transform">
            <mat-icon>exit_to_app</mat-icon> Sair do Modo Serviço
         </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicoComponent implements OnInit {
  prepTaskService = inject(PrepTaskService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);

  stationName = signal<string | null>(null);

  get pendingTasksCount() {
    return () => this.prepTaskService.tasks().filter(t => t.status !== 'completed').length;
  }

  get urgentTasks() {
    return () => this.prepTaskService.tasks().filter(t => t.status !== 'completed').slice(0, 5);
  }

  get lowStockItems() {
    return () => this.inventoryService.items().filter(i => i.quantity <= i.min_quantity).slice(0, 5);
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    
    // Load tasks for this specific team if possible
    this.prepTaskService.loadTasks(user?.team_id, today);
    // Load local inventory (we assumed 'praça' storage mapped to team_id, but for now just load all local items)
    this.inventoryService.loadItems('local');
  }

  async completeTask(id: string) {
    if(navigator.vibrate) navigator.vibrate(50); // Feedback tátil
    await this.prepTaskService.updateTask({ id, status: 'completed' });
  }

  printLabel(task: any) {
     const user = this.authService.currentUser()?.name || 'Cozinheiro';
     const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
     
     // Formato de etiqueta térmica padrão (ex: 40x80mm)
     const printWindow = window.open('', '_blank', 'width=400,height=400');
     if (!printWindow) return;

     printWindow.document.write(`
       <!DOCTYPE html>
       <html>
         <head>
           <title>Etiqueta Validade</title>
           <style>
             body { 
               font-family: monospace; 
               margin: 0; 
               padding: 10px;
               width: 300px;
               color: black;
             }
             h1 { font-size: 20px; font-weight: bold; margin: 0 0 10px 0; border-bottom: 2px solid black; padding-bottom: 5px; text-transform: uppercase; }
             .detail { font-size: 14px; margin-bottom: 5px; }
             .bold { font-weight: bold; }
             @media print {
               @page { margin: 0; }
               body { margin: 0; padding: 10px; }
             }
           </style>
         </head>
         <body>
           <h1>${task.name}</h1>
           <div class="detail"><span class="bold">FABRICADO:</span> ${date}</div>
           <div class="detail"><span class="bold">RESPONSÁVEL:</span> ${user}</div>
           <div class="detail"><span class="bold">VALIDADE:</span> ___/___/___</div>
           <div class="detail"><span class="bold">LOTE:</span> ${task.id?.substring(0,6).toUpperCase()}</div>
           
           <script>window.print(); setTimeout(() => window.close(), 500);</script>
         </body>
       </html>
     `);
     printWindow.document.close();
  }

  exitCombatMode() {
    // We just leverage browser history to go back to the standard view
    window.history.back();
  }
}
