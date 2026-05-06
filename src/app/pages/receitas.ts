import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { RecipeService, Recipe, RecipeIngredient } from '../services/recipe.service';
import { AuthService } from '../services/auth.service';
import { InventoryService } from '../services/inventory.service';

@Component({
  selector: 'app-receitas',
  standalone: true,
  imports: [MatIconModule, CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Fichas Técnicas</h1>
          <p class="text-stone-500 mt-1">Receituário, modos de preparo e escalonamento.</p>
        </div>
        <div class="flex gap-3">
          @if (canEdit()) {
            <button (click)="toggleForm()" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-sm">
              <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
              <span>{{ showForm() ? 'Cancelar' : 'Nova Receita' }}</span>
            </button>
          }
        </div>
      </header>

      <!-- Cadastro de Receita -->
      @if (showForm() && canEdit()) {
        <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 class="text-lg font-bold text-stone-900 mb-6">{{ editingRecipeId() ? 'Editar Ficha Técnica' : 'Criar Nova Ficha Técnica' }}</h2>
          
          <form [formGroup]="recipeForm" (ngSubmit)="onSubmit()" class="space-y-8">
            <!-- Dados Básicos -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="space-y-1.5 lg:col-span-2">
                <label for="recipe-name" class="text-sm font-medium text-stone-700">Nome da Receita *</label>
                <input id="recipe-name" type="text" formControlName="name" placeholder="Ex: Molho Pomodoro" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>
              
              <div class="space-y-1.5">
                <label for="recipe-category" class="text-sm font-medium text-stone-700">Categoria</label>
                <select id="recipe-category" formControlName="category" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  @for (cat of categories.slice(1); track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
              
              <div class="space-y-1.5">
                <label for="recipe-portions" class="text-sm font-medium text-stone-700">Rendimento Base (Porções) *</label>
                <input id="recipe-portions" type="number" formControlName="base_portions" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>

              <div class="space-y-1.5">
                <label for="recipe-time" class="text-sm font-medium text-stone-700">Tempo de Preparo (min)</label>
                <input id="recipe-time" type="number" formControlName="prep_time_minutes" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>

              <div class="space-y-1.5 lg:col-span-2">
                <label for="recipe-desc" class="text-sm font-medium text-stone-700">Descrição Curta</label>
                <input id="recipe-desc" type="text" formControlName="description" placeholder="Ex: Molho rústico de tomates frescos italiano." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>

              <div class="space-y-1.5 lg:col-span-2">
                <label for="recipe-produced" class="text-sm font-medium text-stone-700">Rendimento Final (Insumo Produzido)</label>
                <select id="recipe-produced" formControlName="produced_item_id" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
                  <option value="">Nenhum (Apenas Porções)</option>
                  @for (item of inventoryService.items(); track item.id) {
                    <option [value]="item.id">{{ item.name }} ({{ item.unit }})</option>
                  }
                </select>
              </div>

              <div class="space-y-1.5 lg:col-span-2">
                <label class="text-sm font-medium text-stone-700">Foto da Ficha (Opcional)</label>
                <div class="flex items-center gap-4">
                  @if (recipeForm.get('image_url')?.value) {
                    <div class="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden relative border border-stone-200">
                      <img [src]="recipeForm.get('image_url')?.value" alt="Foto da Receita" class="w-full h-full object-cover">
                      <button type="button" (click)="recipeForm.patchValue({image_url: ''})" class="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  } @else {
                     <div class="w-16 h-16 rounded-lg bg-stone-50 border border-stone-200 border-dashed flex items-center justify-center text-stone-400">
                       <mat-icon>add_photo_alternate</mat-icon>
                     </div>
                  }
                  <input type="file" accept="image/*" (change)="onFileSelected($event)" class="text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer">
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Insumos -->
              <div>
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-md font-bold text-stone-900 border-b border-stone-100 pb-2 flex-1">Insumos (Fator de Rendimento)</h3>
                  <button type="button" (click)="addIngredient()" class="text-sm text-emerald-600 font-medium hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded ml-2">
                    + Insumo
                  </button>
                </div>
                
                <div formArrayName="ingredients" class="space-y-3">
                  @for (ing of ingredientsFormArray.controls; track i; let i = $index) {
                    <div [formGroupName]="i" class="flex flex-wrap sm:flex-nowrap items-start gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200 animate-in fade-in">
                      <div class="w-full sm:w-1/3">
                        <select formControlName="inventory_item_id" class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:border-emerald-500">
                          <option value="">--- Insumo não cadastrado ---</option>
                          @for (item of inventoryService.items(); track item.id) {
                            <option [value]="item.id">{{ item.name }}</option>
                          }
                        </select>
                        <!-- Fallback se não usar o estoque central -->
                        <input type="text" formControlName="name" placeholder="Ou digite o nome..." class="w-full mt-1 px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:border-emerald-500">
                      </div>
                      <div class="w-1/3 sm:w-20">
                        <input type="number" step="0.01" formControlName="quantity" placeholder="Qtd" class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:border-emerald-500">
                      </div>
                      <div class="w-1/3 sm:w-24">
                        <select formControlName="unit" class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:border-emerald-500">
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">L</option>
                          <option value="ml">ml</option>
                          <option value="un">un</option>
                        </select>
                      </div>
                      <div class="w-1/3 sm:w-24 relative" title="Fator de Correção (Peso Bruto / Peso Líquido)">
                        <input type="number" step="0.01" formControlName="correction_factor" placeholder="FC (ex: 1.2)" class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:border-emerald-500">
                      </div>
                      <button type="button" (click)="removeIngredient(i)" class="p-1.5 text-stone-400 hover:text-rose-600 bg-white rounded shadow-sm border border-stone-200 ml-auto">
                        <mat-icon class="text-[16px] w-4 h-4">delete</mat-icon>
                      </button>
                    </div>
                  }
                  @if (ingredientsFormArray.length === 0) {
                    <p class="text-sm text-stone-500 text-center py-4 border border-dashed border-stone-200 rounded-lg bg-stone-50">Nenhum insumo adicionado.</p>
                  }
                </div>
              </div>

              <!-- Equipamentos e Método -->
              <div class="space-y-4">
                <div class="space-y-1.5">
                  <h3 class="text-md font-bold text-stone-900 border-b border-stone-100 pb-2">Equipamentos e Utensílios</h3>
                  <textarea formControlName="equipment" rows="2" placeholder="Ex: Liquidificador profissional, panela de fundo duplo..." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors mt-2"></textarea>
                </div>
                
                <div class="space-y-1.5">
                  <h3 class="text-md font-bold text-stone-900 border-b border-stone-100 pb-2">Método de Preparo</h3>
                  <textarea formControlName="method" rows="6" placeholder="1. Picar as cebolas brunoise...&#10;2. Refogar no azeite...&#10;3. Adicionar o tomate pelati..." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors mt-2"></textarea>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-stone-100">
              <button type="submit" [disabled]="recipeForm.invalid || isSubmitting()" class="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin text-[20px] w-5 h-5">refresh</mat-icon> Salvando...
                } @else {
                  <mat-icon class="text-[20px] w-5 h-5">save</mat-icon> Salvar Ficha Técnica
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Visualização Detalhada (Modo Execução) -->
      @if (viewRecipeDetails()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-stone-900/90 backdrop-blur pb-10 pt-4 px-4 overflow-y-auto animate-in fade-in duration-200">
          <div class="bg-white md:rounded-2xl shadow-2xl w-full max-w-6xl min-h-[100dvh] md:min-h-[85vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
            
            <!-- Coluna Esquerda: Imagem e Escalação -->
            <div class="w-full md:w-2/5 flex flex-col bg-stone-50 md:border-r border-stone-200 shrink-0">
               <!-- Imagem Fixo Top -->
               <div class="h-48 md:h-72 w-full bg-stone-200 relative shrink-0">
                  @if (viewRecipeDetails()?.image_url) {
                    <img [src]="viewRecipeDetails()?.image_url" alt="Foto da Receita" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-stone-400">
                      <mat-icon class="text-6xl opacity-50">restaurant</mat-icon>
                    </div>
                  }
                  <button (click)="closeDetails()" class="absolute top-4 left-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors md:hidden backdrop-blur">
                     <mat-icon>close</mat-icon>
                  </button>
               </div>
               
               <div class="p-6 pb-24 md:pb-6 flex-1 overflow-y-auto">
                 <h2 class="text-3xl font-black text-stone-900 mb-2 leading-tight tracking-tight">{{ viewRecipeDetails()?.name }}</h2>
                 @if (viewRecipeDetails()?.description) {
                   <p class="text-stone-500 text-sm mb-6">{{ viewRecipeDetails()?.description }}</p>
                 }

                  <!-- Escalonador Otimizado Execução -->
                  <div class="bg-white rounded-xl p-5 border border-stone-200 shadow-sm mb-6">
                    <h3 class="text-stone-900 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                       <mat-icon class="text-emerald-500 text-lg">calculate</mat-icon> Escalar Receita
                    </h3>
                    <div class="flex items-center gap-3">
                       <button (click)="targetPortions.set(targetPortions() > 1 ? targetPortions() - 1 : 1)" class="w-12 h-12 shrink-0 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors flex items-center justify-center text-2xl active:scale-95 touch-manipulation">-</button>
                       <input type="number" min="1" [value]="targetPortions()" (input)="updateTargetPortions($event)" class="flex-1 w-full text-center px-3 py-2 bg-stone-50 border-y-2 border-transparent focus:border-emerald-500 outline-none font-black text-3xl text-stone-900 h-12 rounded-none hide-arrows bg-transparent">
                       <button (click)="targetPortions.set(targetPortions() + 1)" class="w-12 h-12 shrink-0 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors flex items-center justify-center text-2xl active:scale-95 touch-manipulation">+</button>
                    </div>
                    <div class="text-center mt-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                       Base original: {{ viewRecipeDetails()?.base_portions }} porções
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-3 mb-6">
                    <div class="bg-white px-4 py-2.5 rounded-xl border border-stone-200 flex-1 flex items-center gap-3 shadow-sm min-w-32">
                      <div class="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0"><mat-icon class="text-[20px] w-5 h-5">timer</mat-icon></div>
                      <div>
                        <span class="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Preparo</span>
                        <span class="font-bold text-stone-800 text-sm">{{ viewRecipeDetails()?.prep_time_minutes || 0 }} min</span>
                      </div>
                    </div>
                  </div>

                  <!-- Lista Dinâmica Insumos-->
                  <div>
                    <h3 class="font-black text-stone-900 mb-4 pb-2 border-b border-stone-200 uppercase tracking-wider text-xs flex items-center gap-2">
                      <mat-icon class="text-stone-400 text-lg">scale</mat-icon> Insumos Calculados
                    </h3>
                    <ul class="space-y-1">
                      @for (ing of viewRecipeDetails()?.recipe_ingredients; track ing.id) {
                        <li class="flex justify-between items-center py-3 border-b border-stone-100 last:border-0 px-2 rounded-md transition-colors group cursor-default hover:bg-white">
                          <span class="text-stone-700 font-medium text-sm group-hover:text-stone-900">{{ ing.name }}</span>
                          <span class="text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded text-sm group-hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100">
                            {{ calculateScaledQuantity(ing) | number:'1.0-2' }} {{ ing.unit }}
                          </span>
                        </li>
                      }
                      @if (!viewRecipeDetails()?.recipe_ingredients?.length) {
                        <li class="text-stone-400 text-sm italic py-4 text-center bg-stone-100/50 rounded-lg">Nenhum insumo associado.</li>
                      }
                    </ul>
                  </div>

               </div>
            </div>

            <!-- Coluna Direita: Preparo e Equipamentos -->
            <div class="w-full md:w-3/5 flex flex-col h-full bg-white relative">
               <div class="absolute top-4 right-4 z-10 hidden md:block">
                  <button (click)="closeDetails()" class="bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors rounded-full p-2 shadow-sm border border-stone-200">
                     <mat-icon>close</mat-icon>
                  </button>
               </div>
               
               <div class="p-6 md:p-10 flex-1 overflow-y-auto space-y-10 pb-24 md:pb-10">
                  <div>
                    <h3 class="text-sm font-black text-stone-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <mat-icon class="text-[18px]">restaurant</mat-icon> Utensílios & Equipamentos
                    </h3>
                    @if (viewRecipeDetails()?.equipment) {
                       <div class="text-stone-700 whitespace-pre-line leading-relaxed font-medium text-lg">
                         {{ viewRecipeDetails()?.equipment }}
                       </div>
                    } @else {
                       <p class="text-stone-400 italic">Lista de utensílios não especificada.</p>
                    }
                  </div>

                  <div>
                    <h3 class="text-sm font-black text-stone-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <mat-icon class="text-[18px]">format_list_numbered</mat-icon> Ficha Base / Método de Preparo
                    </h3>
                    @if (viewRecipeDetails()?.method) {
                       <div class="prose prose-stone prose-lg max-w-none text-stone-800 leading-normal whitespace-pre-line">
                         {{ viewRecipeDetails()?.method }}
                       </div>
                    } @else {
                       <p class="text-stone-400 italic">Passo a passo não documentado.</p>
                    }
                  </div>
               </div>
               
               <!-- Botão flutuante mobile de fechar (opcional, já temos no topo) mas ajuda na leitura longa -->
               <div class="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent md:hidden z-20">
                  <button (click)="closeDetails()" class="w-full py-4 bg-stone-900 text-white rounded-xl font-bold shadow-lg text-lg">
                    Concluir Leitura
                  </button>
               </div>
            </div>

          </div>
        </div>
      }

      <!-- Categorias Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        @for (category of categories; track category) {
          <button 
            (click)="activeCategory.set(category)"
            [class.bg-stone-900]="activeCategory() === category"
            [class.text-white]="activeCategory() === category"
            [class.bg-white]="activeCategory() !== category"
            [class.text-stone-600]="activeCategory() !== category"
            class="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 whitespace-nowrap transition-colors shadow-sm">
            {{ category }}
          </button>
        }
      </div>

      <!-- Grid de Receitas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @if (recipeService.isLoading()) {
          <div class="col-span-full py-12 flex justify-center text-stone-400">
            <mat-icon class="animate-spin text-4xl">refresh</mat-icon>
          </div>
        } @else if (filteredRecipes().length === 0) {
          <div class="col-span-full py-16 text-center bg-white border border-stone-200 border-dashed rounded-2xl">
            <mat-icon class="text-5xl text-stone-300 mb-4">menu_book</mat-icon>
            <h3 class="text-lg font-bold text-stone-900 mb-1">Nenhuma Ficha Técnica</h3>
            <p class="text-stone-500">Nenhuma ficha técnica encontrada na categoria selecionada.</p>
          </div>
        } @else {
          @for (recipe of filteredRecipes(); track recipe.id) {
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow relative flex flex-col">
              <!-- Placeholder de imagem -->
              <div class="h-32 bg-stone-100 w-full relative">
                @if (recipe.image_url) {
                  <img [src]="recipe.image_url" [alt]="recipe.name" referrerpolicy="no-referrer" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-stone-300">
                    <mat-icon class="text-4xl">restaurant</mat-icon>
                  </div>
                }
                <div class="absolute top-2 left-2 bg-stone-900/80 backdrop-blur px-2.5 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                  {{ recipe.category || 'Outros' }}
                </div>
                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-stone-700 shadow-sm flex items-center gap-1">
                  <mat-icon class="text-[14px] w-3.5 h-3.5">tag</mat-icon> {{ recipe.base_portions }} porções
                </div>
              </div>
              
              <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-lg font-bold text-stone-900 leading-tight mb-1">{{ recipe.name }}</h3>
                <p class="text-sm text-stone-500 line-clamp-2 mb-4">{{ recipe.description }}</p>
                
                <div class="mt-auto flex items-center justify-between">
                  <span class="text-xs font-semibold text-stone-400 flex items-center gap-1">
                    <mat-icon class="text-[14px] w-3.5 h-3.5">schedule</mat-icon> {{ recipe.prep_time_minutes || 0 }} min
                  </span>
                  
                  <div class="flex gap-2">
                    @if (canEdit()) {
                      <button (click)="editRecipe(recipe)" title="Editar" class="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors">
                        <mat-icon class="text-[20px] w-5 h-5">edit</mat-icon>
                      </button>
                      <button (click)="removeRecipe(recipe.id)" title="Excluir" class="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <mat-icon class="text-[20px] w-5 h-5">delete</mat-icon>
                      </button>
                    }
                    <button (click)="openRecipeDetails(recipe)" class="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-colors">
                      Calculadora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceitasComponent implements OnInit {
  recipeService = inject(RecipeService);
  authService = inject(AuthService);
  inventoryService = inject(InventoryService);
  private fb = inject(FormBuilder);

  showForm = signal(false);
  isSubmitting = signal(false);
  
  viewRecipeDetails = signal<Recipe | null>(null);
  targetPortions = signal<number>(1);

  activeCategory = signal<string>('Todas');
  categories = ['Todas', 'Bases', 'Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas', 'Outros'];
  editingRecipeId = signal<string | null>(null);

  recipeForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    category: ['Outros'],
    prep_time_minutes: [0],
    base_portions: [1, [Validators.required, Validators.min(1)]],
    produced_item_id: [''],
    method: [''],
    equipment: [''],
    image_url: [''],
    ingredients: this.fb.array([])
  });

  get ingredientsFormArray() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  filteredRecipes() {
    const category = this.activeCategory();
    const all = this.recipeService.recipes();
    if (category === 'Todas') return all;
    return all.filter(r => (r.category || 'Outros') === category);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem não pode ter mais de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.recipeForm.patchValue({ image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnInit() {
    this.recipeService.loadRecipes();
    this.inventoryService.loadItems('central');
  }

  canEdit() {
    const userRole = this.authService.currentUser()?.role;
    return userRole === 'admin' || userRole === 'chef';
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.recipeForm.reset({ base_portions: 1, prep_time_minutes: 0, category: 'Outros' });
      this.ingredientsFormArray.clear();
      this.editingRecipeId.set(null);
    }
  }

  async editRecipe(recipe: Recipe) {
    const fullRecipe = await this.recipeService.getRecipe(recipe.id);
    if (fullRecipe) {
      this.editingRecipeId.set(recipe.id);
      
      this.recipeForm.patchValue({
        name: fullRecipe.name,
        description: fullRecipe.description || '',
        category: fullRecipe.category || 'Outros',
        prep_time_minutes: fullRecipe.prep_time_minutes || 0,
        base_portions: fullRecipe.base_portions || 1,
        produced_item_id: fullRecipe.produced_item_id || '',
        method: fullRecipe.method || '',
        equipment: fullRecipe.equipment || '',
        image_url: fullRecipe.image_url || ''
      });

      this.ingredientsFormArray.clear();
      if (fullRecipe.recipe_ingredients) {
        fullRecipe.recipe_ingredients.forEach(ing => {
          this.ingredientsFormArray.push(this.fb.group({
            inventory_item_id: [ing.inventory_item_id || ''],
            name: [ing.name || ''],
            quantity: [ing.quantity || 0, [Validators.required, Validators.min(0.01)]],
            unit: [ing.unit || 'kg', Validators.required],
            correction_factor: [ing.correction_factor || 1.0, Validators.min(0.1)]
          }));
        });
      }

      this.showForm.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  addIngredient() {
    this.ingredientsFormArray.push(this.fb.group({
      inventory_item_id: [''],
      name: [''],
      quantity: [0, [Validators.required, Validators.min(0.01)]],
      unit: ['kg', Validators.required],
      correction_factor: [1.0, Validators.min(0.1)]
    }));
  }

  removeIngredient(index: number) {
    this.ingredientsFormArray.removeAt(index);
  }

  async openRecipeDetails(recipe: Recipe) {
    // Busca detalhes completos incluindo ingredientes
    const fullRecipe = await this.recipeService.getRecipe(recipe.id);
    if (fullRecipe) {
      this.viewRecipeDetails.set(fullRecipe);
      this.targetPortions.set(fullRecipe.base_portions || 1);
    }
  }

  closeDetails() {
    this.viewRecipeDetails.set(null);
  }

  updateTargetPortions(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (!isNaN(value) && value > 0) {
      this.targetPortions.set(value);
    }
  }

  calculateScaledQuantity(ing: RecipeIngredient): number {
    const recipe = this.viewRecipeDetails();
    if (!recipe || !recipe.base_portions) return ing.quantity;

    // A fórmula é: (Quantidade Base / Porções Base) * Porções Desejadas * Fator de Correção
    const scaleRatio = this.targetPortions() / recipe.base_portions;
    const scaledQty = ing.quantity * scaleRatio;
    
    // Aplica o fator de correção na quantidade escalada
    const finalQty = scaledQty * (ing.correction_factor || 1.0);
    return finalQty;
  }

  async onSubmit() {
    if (this.recipeForm.valid) {
      this.isSubmitting.set(true);
      const val = this.recipeForm.value;
      const recipeData: Partial<Recipe> = {
        name: val.name!,
        description: val.description || '',
        prep_time_minutes: val.prep_time_minutes || 0,
        base_portions: val.base_portions || 1,
        produced_item_id: val.produced_item_id || undefined,
        category: val.category || 'Outros',
        image_url: val.image_url || undefined,
        method: val.method || '',
        equipment: val.equipment || ''
      };

      const ingredients = (val.ingredients || []).map((i: any) => ({
        ...i,
        name: i.name || (i.inventory_item_id ? this.inventoryService.items().find(x => x.id === i.inventory_item_id)?.name : 'Sem nome')
      })) as RecipeIngredient[];

      const editingId = this.editingRecipeId();
      let success = false;
      
      if (editingId) {
        success = await this.recipeService.updateRecipe(editingId, recipeData, ingredients);
      } else {
        success = await this.recipeService.addRecipe(recipeData, ingredients);
      }
      
      this.isSubmitting.set(false);
      
      if (success) {
        this.toggleForm();
      }
    }
  }

  async removeRecipe(id: string) {
    if (confirm('Atenção: Tem certeza que deseja remover esta ficha técnica? Essa ação é irreversível.')) {
      await this.recipeService.removeRecipe(id);
    }
  }
}
