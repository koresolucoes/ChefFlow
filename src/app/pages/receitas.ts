import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { RecipeService, Recipe, RecipeIngredient } from '../services/recipe.service';
import { AuthService } from '../services/auth.service';

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
          <h2 class="text-lg font-bold text-stone-900 mb-6">Criar Nova Ficha Técnica</h2>
          
          <form [formGroup]="recipeForm" (ngSubmit)="onSubmit()" class="space-y-8">
            <!-- Dados Básicos -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="space-y-1.5 lg:col-span-2">
                <label for="recipe-name" class="text-sm font-medium text-stone-700">Nome da Receita *</label>
                <input id="recipe-name" type="text" formControlName="name" placeholder="Ex: Molho Pomodoro" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>
              
              <div class="space-y-1.5">
                <label for="recipe-portions" class="text-sm font-medium text-stone-700">Rendimento Base (Porções) *</label>
                <input id="recipe-portions" type="number" formControlName="base_portions" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>

              <div class="space-y-1.5">
                <label for="recipe-time" class="text-sm font-medium text-stone-700">Tempo de Preparo (min)</label>
                <input id="recipe-time" type="number" formControlName="prep_time_minutes" class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
              </div>

              <div class="space-y-1.5 lg:col-span-4">
                <label for="recipe-desc" class="text-sm font-medium text-stone-700">Descrição Curta</label>
                <input id="recipe-desc" type="text" formControlName="description" placeholder="Ex: Molho rústico de tomates frescos italiano." class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors">
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
                        <input type="text" formControlName="name" placeholder="Nome do Insumo" class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded focus:outline-none focus:border-emerald-500">
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

      <!-- Visualização Detalhada (Calculadora) -->
      @if (viewRecipeDetails()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="p-6 border-b border-stone-100 flex justify-between items-start bg-stone-50">
              <div>
                <h2 class="text-2xl font-bold text-stone-900">{{ viewRecipeDetails()?.name }}</h2>
                <p class="text-stone-500 mt-1">{{ viewRecipeDetails()?.description }}</p>
              </div>
              <button (click)="closeDetails()" class="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <!-- Coluna Esquerda: Escalonador e Insumos -->
                <div class="lg:col-span-1 space-y-6">
                  <!-- Escalonador -->
                  <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-100 shadow-inner">
                    <h3 class="text-emerald-900 font-bold mb-3 flex items-center gap-2">
                      <mat-icon class="text-emerald-600">calculate</mat-icon>
                      Calculadora de Escalonamento
                    </h3>
                    <div class="flex items-center gap-3">
                      <div class="flex-1">
                        <label for="calc-portions" class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Porções Desejadas</label>
                        <input id="calc-portions" type="number" min="1" [value]="targetPortions()" (input)="updateTargetPortions($event)" class="w-full mt-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-emerald-900 text-center">
                      </div>
                      <div class="flex-none text-center">
                        <span class="block text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Base</span>
                        <span class="inline-block px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-lg">{{ viewRecipeDetails()?.base_portions }}</span>
                      </div>
                    </div>
                    <p class="text-xs text-emerald-700/80 mt-3 text-center">As quantidades abaixo serão ajustadas automaticamente utilizando o fator de correção.</p>
                  </div>

                  <!-- Lista Dinâmica -->
                  <div>
                    <h3 class="font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                      <mat-icon class="text-stone-400 text-xl">scale</mat-icon> Insumos Necessários
                    </h3>
                    <ul class="space-y-3">
                      @for (ing of viewRecipeDetails()?.recipe_ingredients; track ing.id) {
                        <li class="flex justify-between items-center py-2 border-b border-stone-50 last:border-0 hover:bg-stone-50 px-2 rounded-md transition-colors">
                          <span class="text-stone-700 font-medium">{{ ing.name }}</span>
                          <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100 shadow-sm">
                            {{ calculateScaledQuantity(ing) | number:'1.0-2' }} {{ ing.unit }}
                          </span>
                        </li>
                      }
                      @if (!viewRecipeDetails()?.recipe_ingredients?.length) {
                        <li class="text-stone-500 text-sm italic">Nenhum insumo cadastrado na base.</li>
                      }
                    </ul>
                  </div>
                </div>

                <!-- Coluna Direita: Preparo e Equipamentos -->
                <div class="lg:col-span-2 space-y-8 pl-0 lg:pl-6 lg:border-l border-stone-100">
                  <div class="flex flex-wrap gap-4 mb-2">
                    <div class="bg-stone-50 px-4 py-2 rounded-lg border border-stone-200 flex items-center gap-2">
                      <mat-icon class="text-stone-500">timer</mat-icon>
                      <span class="text-stone-700 text-sm font-medium">{{ viewRecipeDetails()?.prep_time_minutes || 0 }} minutos</span>
                    </div>
                  </div>

                  <div>
                    <h3 class="font-bold text-stone-900 mb-3 flex items-center gap-2">
                      <mat-icon class="text-stone-400 text-xl">restaurant</mat-icon> Utensílios & Equipamentos
                    </h3>
                    <div class="bg-stone-50 p-4 rounded-xl border border-stone-200 text-stone-700 whitespace-pre-line text-sm">
                      {{ viewRecipeDetails()?.equipment || 'Nenhum equipamento listado.' }}
                    </div>
                  </div>

                  <div>
                    <h3 class="font-bold text-stone-900 mb-3 flex items-center gap-2">
                      <mat-icon class="text-stone-400 text-xl">menu_book</mat-icon> Método de Preparo
                    </h3>
                    <div class="bg-stone-50 p-5 rounded-xl border border-stone-200 text-stone-800 whitespace-pre-line leading-relaxed shadow-inner">
                      {{ viewRecipeDetails()?.method || 'Nenhum método detalhado.' }}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div class="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button (click)="closeDetails()" class="px-6 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Grid de Receitas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @if (recipeService.isLoading()) {
          <div class="col-span-full py-12 flex justify-center text-stone-400">
            <mat-icon class="animate-spin text-4xl">refresh</mat-icon>
          </div>
        } @else if (recipeService.recipes().length === 0) {
          <div class="col-span-full py-16 text-center bg-white border border-stone-200 border-dashed rounded-2xl">
            <mat-icon class="text-5xl text-stone-300 mb-4">menu_book</mat-icon>
            <h3 class="text-lg font-bold text-stone-900 mb-1">Nenhuma Ficha Técnica</h3>
            <p class="text-stone-500">Comece cadastrando sua primeira receia padronizada.</p>
          </div>
        } @else {
          @for (recipe of recipeService.recipes(); track recipe.id) {
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
                      <button (click)="removeRecipe(recipe.id)" class="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
  private fb = inject(FormBuilder);

  showForm = signal(false);
  isSubmitting = signal(false);
  
  viewRecipeDetails = signal<Recipe | null>(null);
  targetPortions = signal<number>(1);

  recipeForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    prep_time_minutes: [0],
    base_portions: [1, [Validators.required, Validators.min(1)]],
    method: [''],
    equipment: [''],
    ingredients: this.fb.array([])
  });

  get ingredientsFormArray() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  ngOnInit() {
    this.recipeService.loadRecipes();
  }

  canEdit() {
    const userRole = this.authService.currentUser()?.role;
    return userRole === 'admin' || userRole === 'chef';
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.recipeForm.reset({ base_portions: 1, prep_time_minutes: 0 });
      this.ingredientsFormArray.clear();
    }
  }

  addIngredient() {
    this.ingredientsFormArray.push(this.fb.group({
      name: ['', Validators.required],
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
        method: val.method || '',
        equipment: val.equipment || ''
      };

      const ingredients = (val.ingredients || []) as RecipeIngredient[];

      const success = await this.recipeService.addRecipe(recipeData, ingredients);
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
