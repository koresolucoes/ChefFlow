import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { PrepTaskService } from '../services/prep-task.service';
import { InventoryService } from '../services/inventory.service';
import { AuthService } from '../services/auth.service';
import { RecipeService, Recipe, RecipeIngredient } from '../services/recipe.service';

@Component({
  selector: 'app-servico',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
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
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 w-full max-w-sm px-4">
         <button (click)="openRecipeBrowser()" class="flex-1 bg-indigo-600 w-full text-white px-6 py-4 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(79,70,229,0.4)] flex justify-center items-center gap-3 active:scale-95 transition-transform">
            <mat-icon>menu_book</mat-icon> Fichas
         </button>
         <button (click)="exitCombatMode()" class="bg-white text-stone-950 px-6 py-4 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)] flex justify-center items-center gap-3 active:scale-95 transition-transform w-[120px]">
            <mat-icon>exit_to_app</mat-icon> Sair
         </button>
      </div>

      <!-- OVERLAY CONSULTA DE FICHAS -->
      @if (showRecipeBrowser()) {
        <div class="fixed inset-0 z-[110] bg-stone-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
           <!-- HEADER BROWSER -->
           <header class="bg-stone-900 border-b border-stone-800 p-4 shrink-0 flex items-center gap-4">
              <button (click)="closeRecipeBrowser()" class="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center text-white active:scale-95">
                 <mat-icon>arrow_back</mat-icon>
              </button>
              <div class="flex-1 relative">
                 <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">search</mat-icon>
                 <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="BUSCAR FICHA TÉCNICA..." class="w-full h-12 pl-12 pr-4 bg-stone-950 border border-stone-700 rounded-xl text-white font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-colors">
              </div>
           </header>
           
           <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (recipe of filteredRecipes(); track recipe.id) {
                 <div (click)="selectRecipe(recipe)" class="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center gap-4 active:scale-95 transition-transform cursor-pointer hover:bg-stone-800">
                    @if (recipe.image_url) {
                       <img [src]="recipe.image_url" alt="" class="w-20 h-20 rounded-xl object-cover shrink-0 bg-stone-800">
                    } @else {
                       <div class="w-20 h-20 rounded-xl bg-stone-800 flex items-center justify-center shrink-0">
                          <mat-icon class="text-3xl text-stone-600">restaurant</mat-icon>
                       </div>
                    }
                    <div>
                       <h3 class="text-white font-black uppercase text-lg leading-tight">{{ recipe.name }}</h3>
                       <p class="text-stone-400 text-sm font-bold uppercase mt-1">{{ recipe.category || 'Outros' }} • Base: {{ recipe.base_portions }} porções</p>
                    </div>
                 </div>
              }
              @if (filteredRecipes().length === 0) {
                 <div class="col-span-full py-12 text-center">
                    <mat-icon class="text-5xl text-stone-600 mb-4">search_off</mat-icon>
                    <p class="text-stone-400 font-bold uppercase tracking-wider">Nenhuma ficha encontrada.</p>
                 </div>
              }
           </div>
        </div>
      }

      <!-- OVERLAY FICHA TÉCNICA DETALHE (MODO EXECUÇÃO RÁPIDO) -->
      @if (selectedRecipe()) {
        <div class="fixed inset-0 z-[120] bg-stone-900/95 backdrop-blur-md flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- COlUNA ESQUERDA -->
            <div class="w-full md:w-2/5 flex flex-col bg-stone-900 md:border-r border-stone-800 shrink-0 h-full shadow-2xl">
               <div class="h-48 md:h-64 w-full bg-stone-800 relative shrink-0">
                  @if (selectedRecipe()?.image_url) {
                    <img [src]="selectedRecipe()?.image_url" alt="Foto da Receita" class="w-full h-full object-cover opacity-80">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-stone-600">
                      <mat-icon class="text-6xl">restaurant</mat-icon>
                    </div>
                  }
                  <button (click)="selectedRecipe.set(null)" class="absolute top-4 left-4 bg-black/60 text-white p-3 rounded-xl hover:bg-black/80 transition-colors backdrop-blur flex items-center justify-center active:scale-95 shadow-lg border border-white/10">
                     <mat-icon>arrow_back</mat-icon>
                  </button>
               </div>
               
               <div class="p-6 flex-1 overflow-y-auto">
                 <h2 class="text-3xl font-black text-white mb-2 leading-tight tracking-tight uppercase">{{ selectedRecipe()?.name }}</h2>
                 <p class="text-stone-400 mb-4 font-bold uppercase">{{ selectedRecipe()?.category || 'Outros' }}</p>
                 
                  <!-- Escalonador Otimizado Execução -->
                  <div class="bg-stone-950 rounded-xl p-5 border border-stone-800 shadow-sm mb-6">
                    <h3 class="text-stone-400 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                       <mat-icon class="text-indigo-500 text-lg">calculate</mat-icon> Escalar Receita
                    </h3>
                    <div class="flex items-center gap-3">
                       <button (click)="targetPortions.set(targetPortions() > 1 ? targetPortions() - 1 : 1)" class="w-14 h-14 shrink-0 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700 transition-colors flex items-center justify-center text-3xl active:scale-95 touch-manipulation border border-stone-700">-</button>
                       <input type="number" min="1" [value]="targetPortions()" (input)="updateTargetPortions($event)" class="flex-1 w-full text-center px-3 py-2 bg-transparent border-y-2 border-transparent focus:border-indigo-500 outline-none font-black text-4xl text-white h-14 rounded-none hide-arrows">
                       <button (click)="targetPortions.set(targetPortions() + 1)" class="w-14 h-14 shrink-0 rounded-xl bg-stone-800 text-stone-300 font-bold hover:bg-stone-700 transition-colors flex items-center justify-center text-3xl active:scale-95 touch-manipulation border border-stone-700">+</button>
                    </div>
                    <div class="text-center mt-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                       Base original: {{ selectedRecipe()?.base_portions }} porções
                    </div>
                  </div>

                  <!-- Lista Dinâmica Insumos-->
                  <div>
                    <h3 class="font-black text-stone-300 mb-4 pb-2 border-b border-stone-800 uppercase tracking-wider text-xs flex items-center gap-2">
                      <mat-icon class="text-stone-500 text-lg">scale</mat-icon> Insumos Calculados
                    </h3>
                    <ul class="space-y-2">
                      @for (ing of selectedRecipe()?.recipe_ingredients; track ing.id) {
                        <li class="flex justify-between items-center py-3 border-b border-stone-800/50 last:border-0 px-3 rounded-lg bg-stone-950/50">
                          <span class="text-stone-200 font-bold text-sm uppercase">{{ ing.name }}</span>
                          <span class="text-indigo-400 font-black text-lg">
                            {{ calculateScaledQuantity(ing) | number:'1.0-2' }} {{ ing.unit }}
                          </span>
                        </li>
                      }
                    </ul>
                  </div>
               </div>
            </div>

            <!-- Coluna Direita: Preparo e Equipamentos -->
            <div class="w-full md:w-3/5 flex flex-col h-full bg-stone-950 relative">               
               <div class="p-6 md:p-10 flex-1 overflow-y-auto space-y-10">
                  <div>
                    <h3 class="text-sm font-black text-stone-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <mat-icon class="text-[18px]">restaurant</mat-icon> Utensílios & Equipamentos
                    </h3>
                    @if (selectedRecipe()?.equipment) {
                       <div class="text-stone-300 whitespace-pre-line leading-relaxed font-bold text-lg uppercase">
                         {{ selectedRecipe()?.equipment }}
                       </div>
                    } @else {
                       <p class="text-stone-600 font-bold uppercase">Não especificado.</p>
                    }
                  </div>

                  <div>
                    <h3 class="text-sm font-black text-stone-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <mat-icon class="text-[18px]">format_list_numbered</mat-icon> Método de Preparo
                    </h3>
                    @if (selectedRecipe()?.method) {
                       <div class="text-stone-200 leading-relaxed whitespace-pre-line text-xl font-medium">
                         {{ selectedRecipe()?.method }}
                       </div>
                    } @else {
                       <p class="text-stone-600 font-bold uppercase">Passo a passo não documentado.</p>
                    }
                  </div>
               </div>
               
               <div class="p-4 bg-stone-900 border-t border-stone-800 md:hidden pb-safe">
                  <button (click)="selectedRecipe.set(null)" class="w-full py-5 bg-stone-800 text-white rounded-xl font-black uppercase tracking-widest text-lg shadow-lg active:scale-95 border border-stone-700">
                    Concluir Leitura
                  </button>
               </div>
            </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicoComponent implements OnInit {
  prepTaskService = inject(PrepTaskService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  recipeService = inject(RecipeService);

  stationName = signal<string | null>(null);

  showRecipeBrowser = signal(false);
  searchQuery = signal('');
  selectedRecipe = signal<Recipe | null>(null);
  targetPortions = signal(1);

  filteredRecipes = computed(() => {
    const all = this.recipeService.recipes();
    const query = this.searchQuery().toLowerCase();
    if (!query) return all;
    return all.filter(r => r.name.toLowerCase().includes(query) || (r.category && r.category.toLowerCase().includes(query)));
  });

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
    // Load recipes for quick access
    this.recipeService.loadRecipes();
  }

  openRecipeBrowser() {
    this.searchQuery.set('');
    this.showRecipeBrowser.set(true);
  }

  closeRecipeBrowser() {
    this.showRecipeBrowser.set(false);
  }

  async selectRecipe(recipe: Recipe) {
    if (recipe.id) {
       const fullRecipe = await this.recipeService.getRecipe(recipe.id);
       if (fullRecipe) {
         this.selectedRecipe.set(fullRecipe);
         this.targetPortions.set(fullRecipe.base_portions || 1);
       }
    }
  }

  updateTargetPortions(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (!isNaN(value) && value > 0) {
      this.targetPortions.set(value);
    }
  }

  calculateScaledQuantity(ingredient: RecipeIngredient): number {
    const recipe = this.selectedRecipe();
    if (!recipe) return ingredient.quantity;
    const ratio = this.targetPortions() / (recipe.base_portions || 1);
    // Include correction factor in scaled calculation if needed:
    return ingredient.quantity * ratio;
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

