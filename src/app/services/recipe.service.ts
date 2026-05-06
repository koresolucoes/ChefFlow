import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  inventory_item_id?: string;
  name: string;
  quantity: number;
  unit: string;
  correction_factor: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  prep_time_minutes?: number;
  base_portions: number;
  image_url?: string;
  method?: string;
  category?: string;
  equipment?: string;
  produced_item_id?: string;
  recipe_ingredients?: RecipeIngredient[];
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  
  recipes = signal<Recipe[]>([]);
  isLoading = signal(false);

  async loadRecipes() {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<Recipe[]>(`${environment.apiUrl}/recipes`)
      );
      this.recipes.set(response || []);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      this.recipes.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    try {
      return await firstValueFrom(
        this.http.get<Recipe>(`${environment.apiUrl}/recipes?id=${id}`)
      );
    } catch (error) {
      console.error('Erro ao buscar receita', error);
      return null;
    }
  }

  async addRecipe(recipe: Partial<Recipe>, ingredients: RecipeIngredient[]) {
    try {
      const newRecipe = await firstValueFrom(
        this.http.post<Recipe>(`${environment.apiUrl}/recipes`, {
          ...recipe,
          ingredients
        })
      );
      this.recipes.update(r => [...r, newRecipe]);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar receita', error);
      return false;
    }
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>, ingredients: RecipeIngredient[]) {
    try {
      const updatedRecipe = await firstValueFrom(
        this.http.put<Recipe>(`${environment.apiUrl}/recipes`, {
          id,
          ...recipe,
          ingredients
        })
      );
      this.recipes.update(r => r.map(x => x.id === id ? updatedRecipe : x));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar receita', error);
      return false;
    }
  }

  async removeRecipe(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/recipes?id=${id}`)
      );
      this.recipes.update(r => r.filter(x => x.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao remover receita', error);
      return false;
    }
  }
}
