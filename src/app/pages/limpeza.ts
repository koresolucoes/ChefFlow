import { ChangeDetectionStrategy, Component, signal, inject, OnInit, computed, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CleaningService, CleaningTask } from '../services/cleaning.service';
import { AuthService } from '../services/auth.service';
import { TeamService } from '../services/team.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-limpeza',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-stone-900">Checklist</h1>
          <p class="text-stone-500 mt-1">Checklists sanitários e termometria.</p>
        </div>
        <div class="flex flex-col gap-2 md:gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div class="flex flex-col sm:flex-row gap-2 w-full">
            <div class="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 rounded-lg px-3 py-2 font-medium w-full sm:w-auto">
              <mat-icon class="text-stone-500">calendar_today</mat-icon>
              <input type="date" [ngModel]="selectedDate()" (ngModelChange)="onDateChange($event)" class="w-full border-none focus:ring-0 text-stone-700 font-medium bg-transparent p-0 outline-none">
            </div>
            @if (authService.isAdmin()) {
              <select [ngModel]="selectedTeamId()" (ngModelChange)="onTeamChange($event)" class="w-full sm:w-auto border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-stone-700">
                <option value="todas">Todas as Praças</option>
                @for (team of teamService.teams(); track team.id) {
                  <option [value]="team.id">{{ team.name }}</option>
                }
              </select>
            }
          </div>
          <div class="grid grid-cols-3 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
            <button type="button" (click)="generateReport()" class="col-span-1 sm:flex-none justify-center px-2 sm:px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-base text-center">
              <mat-icon class="text-[20px] w-5 h-5 sm:text-[24px] sm:w-6 sm:h-6">picture_as_pdf</mat-icon>
              <span class="hidden sm:inline">Gerar Relatório</span>
              <span class="sm:hidden">Relatório</span>
            </button>
            @if (canManageTasks()) {
              <button type="button" (click)="openNewChecklistForm()" class="col-span-1 sm:flex-none justify-center px-2 sm:px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-base text-center">
                <mat-icon class="text-[20px] w-5 h-5 sm:text-[24px] sm:w-6 sm:h-6">add_task</mat-icon>
                <span class="hidden sm:inline">Novo Item Checklist</span>
                <span class="sm:hidden">Checklist</span>
              </button>
              <button type="button" (click)="openNewEquipmentForm()" class="col-span-1 sm:flex-none justify-center px-2 sm:px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-base text-center">
                <mat-icon class="text-[20px] w-5 h-5 sm:text-[24px] sm:w-6 sm:h-6">kitchen</mat-icon>
                <span class="hidden sm:inline">Novo Equipamento</span>
                <span class="sm:hidden">Equip.</span>
              </button>
            }
          </div>
        </div>
      </header>

      @if (cleaningService.error()) {
        <div class="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3">
          <mat-icon>error_outline</mat-icon>
          <p>{{ cleaningService.error() }}</p>
        </div>
      }

      <!-- Tabs -->
      <div class="border-b border-stone-200 overflow-x-auto" style="scrollbar-width: none; -ms-overflow-style: none;">
        <nav class="-mb-px flex space-x-4 md:space-x-8 min-w-max px-2 md:px-0" aria-label="Tabs">
          <button 
            (click)="activeTab.set('abertura')"
            [class.border-stone-900]="activeTab() === 'abertura'"
            [class.text-stone-900]="activeTab() === 'abertura'"
            [class.border-transparent]="activeTab() !== 'abertura'"
            [class.text-stone-500]="activeTab() !== 'abertura'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Abertura
          </button>
          <button 
            (click)="activeTab.set('operacao')"
            [class.border-stone-900]="activeTab() === 'operacao'"
            [class.text-stone-900]="activeTab() === 'operacao'"
            [class.border-transparent]="activeTab() !== 'operacao'"
            [class.text-stone-500]="activeTab() !== 'operacao'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Operação
          </button>
          <button 
            (click)="activeTab.set('fechamento')"
            [class.border-stone-900]="activeTab() === 'fechamento'"
            [class.text-stone-900]="activeTab() === 'fechamento'"
            [class.border-transparent]="activeTab() !== 'fechamento'"
            [class.text-stone-500]="activeTab() !== 'fechamento'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-stone-700 hover:border-stone-300 transition-colors">
            Fechamento
          </button>
        </nav>
      </div>

      <!-- View Mode Toggle -->
      <div class="flex p-1 bg-stone-100 rounded-xl mb-4 max-w-[400px]">
        <button 
          (click)="viewMode.set('checklist')"
          [class.bg-white]="viewMode() === 'checklist'"
          [class.shadow-sm]="viewMode() === 'checklist'"
          [class.text-stone-900]="viewMode() === 'checklist'"
          [class.text-stone-500]="viewMode() !== 'checklist'"
          class="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all focus:outline-none">
          <mat-icon class="text-[18px] w-4.5 h-4.5">checklist</mat-icon>
          Checklists
        </button>
        <button 
          (click)="viewMode.set('termometria')"
          [class.bg-white]="viewMode() === 'termometria'"
          [class.shadow-sm]="viewMode() === 'termometria'"
          [class.text-stone-900]="viewMode() === 'termometria'"
          [class.text-stone-500]="viewMode() !== 'termometria'"
          class="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all focus:outline-none">
          <mat-icon class="text-[18px] w-4.5 h-4.5">thermostat</mat-icon>
          Termometria
        </button>
      </div>

      <!-- New Task Form -->
      @if (showNewTaskForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-stone-900">
              {{ newTask.category === 'checklist' ? 'Novo Item de Checklist' : 'Novo Equipamento (Termometria)' }}
            </h2>
            <button type="button" (click)="showNewTaskForm.set(false)" class="text-stone-400 hover:text-stone-600">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label for="task-title" class="block text-sm font-medium text-stone-700 mb-1">
                  {{ newTask.category === 'checklist' ? 'Título da Tarefa' : 'Nome do Equipamento' }}
                </label>
                <input id="task-title" type="text" [(ngModel)]="newTask.title" name="title" required class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
              </div>

              <div class="md:col-span-2">
                <span id="task-moments-label" class="block text-sm font-medium text-stone-700 mb-1">Momentos do Plantão</span>
                <div class="flex flex-wrap gap-3 mt-2" aria-labelledby="task-moments-label">
                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" [checked]="newTaskShiftMoments.includes('abertura')" (change)="toggleShiftMoment('abertura')" class="rounded border-stone-300 text-stone-900 focus:ring-stone-900">
                    Abertura
                  </label>
                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" [checked]="newTaskShiftMoments.includes('operacao')" (change)="toggleShiftMoment('operacao')" class="rounded border-stone-300 text-stone-900 focus:ring-stone-900">
                    Operação
                  </label>
                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" [checked]="newTaskShiftMoments.includes('fechamento')" (change)="toggleShiftMoment('fechamento')" class="rounded border-stone-300 text-stone-900 focus:ring-stone-900">
                    Fechamento
                  </label>
                </div>
              </div>

              @if (newTask.category === 'termometria') {
                <div>
                  <label for="task-min-temp" class="block text-sm font-medium text-stone-700 mb-1">Temp. Mínima (°C)</label>
                  <input id="task-min-temp" type="number" [(ngModel)]="newTaskMinTemp" name="min_temp" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                </div>
                <div>
                  <label for="task-max-temp" class="block text-sm font-medium text-stone-700 mb-1">Temp. Máxima (°C)</label>
                  <input id="task-max-temp" type="number" [(ngModel)]="newTaskMaxTemp" name="max_temp" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                </div>
              }

              @if (authService.isAdmin()) {
                <div class="md:col-span-2">
                  <label for="task-team" class="block text-sm font-medium text-stone-700 mb-1">Praça (Opcional - Deixe em branco para Todas)</label>
                  <select id="task-team" [(ngModel)]="draftTeamId" name="team_id" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900">
                    <option [value]="null">Todas as Praças</option>
                    @for (team of teamService.teams(); track team.id) {
                      <option [value]="team.id">{{ team.name }}</option>
                    }
                  </select>
                </div>
              }
            </div>
            
            <div>
              <label for="task-description" class="block text-sm font-medium text-stone-700 mb-1">Descrição (Opcional)</label>
              <textarea id="task-description" [(ngModel)]="newTask.description" name="description" rows="2" class="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"></textarea>
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" (click)="showNewTaskForm.set(false)" class="px-4 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="cleaningService.loading() || !newTask.title" class="px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2">
                @if (cleaningService.loading()) {
                  <mat-icon class="animate-spin">autorenew</mat-icon>
                  Salvando...
                } @else {
                  <mat-icon>save</mat-icon>
                  Salvar Registro
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Tab Content -->
      <div class="mt-6 space-y-8 relative">
        @if (cleaningService.loading() && !showNewTaskForm() && currentTasks().length === 0) {
          <div class="flex justify-center p-12">
            <mat-icon class="animate-spin text-stone-400 text-4xl">autorenew</mat-icon>
          </div>
        } @else {
          <!-- Checklist Section -->
          @if (viewMode() === 'checklist') {
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div class="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h2 class="font-bold text-stone-900">Checklists de {{ activeTab() | titlecase }}</h2>
                <div class="text-sm font-medium text-stone-500 bg-white px-3 py-1 rounded-full border border-stone-200 shadow-sm">
                  {{ completedChecklists() }}/{{ checklists().length }} Concluído
                </div>
              </div>
              
              <div class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                @if (checklists().length === 0) {
                  <div class="col-span-full p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200 border-dashed">
                    Nenhum checklist cadastrado para este momento.
                  </div>
                }
                @for (task of checklists(); track task.id) {
                    <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 relative overflow-hidden group transition-all hover:shadow-md"
                         [class.border-emerald-200]="task.status === 'conforme' || task.status === 'completed'"
                         [class.bg-emerald-50]="task.status === 'conforme' || task.status === 'completed'"
                         [class.border-rose-200]="task.status === 'nao_conforme'"
                         [class.bg-rose-50]="task.status === 'nao_conforme'">
                      
                      @if (task.status === 'nao_conforme') {
                        <div class="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
                      } @else if (task.status === 'conforme' || task.status === 'completed') {
                        <div class="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                      }
  
                      <div class="flex flex-col h-full">
                        <div class="flex-1 mb-4">
                          <div class="flex items-start justify-between gap-2">
                            <h3 class="text-lg font-bold text-stone-900 leading-tight" [class.text-emerald-900]="task.status === 'conforme'" [class.text-rose-900]="task.status === 'nao_conforme'">{{ task.title }}</h3>
                            @if (canManageTasks()) {
                              <button type="button" (click)="deleteTask(task)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow-sm">
                                <mat-icon class="text-[18px] w-4.5 h-4.5">delete</mat-icon>
                              </button>
                            }
                          </div>
                          @if (task.description) {
                            <p class="text-sm text-stone-500 mt-2 line-clamp-2">{{ task.description }}</p>
                          }
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2 mt-auto">
                          <button type="button"
                            [disabled]="!canEditTasks()"
                            (click)="setStatus(task, 'conforme')"
                            [class.bg-emerald-500]="task.status === 'conforme' || task.status === 'completed'"
                            [class.text-white]="task.status === 'conforme' || task.status === 'completed'"
                            [class.border-emerald-600]="task.status === 'conforme' || task.status === 'completed'"
                            [class.bg-white]="task.status !== 'conforme' && task.status !== 'completed'"
                            [class.text-stone-600]="task.status !== 'conforme' && task.status !== 'completed'"
                            [class.border-stone-200]="task.status !== 'conforme' && task.status !== 'completed'"
                            class="col-span-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 border rounded-xl font-bold transition-all active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">check_circle</mat-icon>
                            <span>Conforme</span>
                          </button>
                          
                          <button type="button"
                            [disabled]="!canEditTasks()"
                            (click)="setStatus(task, 'nao_conforme')"
                            [class.bg-rose-500]="task.status === 'nao_conforme'"
                            [class.text-white]="task.status === 'nao_conforme'"
                            [class.border-rose-600]="task.status === 'nao_conforme'"
                            [class.bg-white]="task.status !== 'nao_conforme'"
                            [class.text-stone-600]="task.status !== 'nao_conforme'"
                            [class.border-stone-200]="task.status !== 'nao_conforme'"
                            class="col-span-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 border rounded-xl font-bold transition-all active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base">
                            <mat-icon class="text-[18px] w-4.5 h-4.5">cancel</mat-icon>
                            <span>Problema</span>
                          </button>
                        </div>
                      </div>
                      
                      @if (task.status === 'nao_conforme') {
                        <div class="mt-4 pt-4 border-t border-rose-200/50">
                          <label [for]="'reason-chk-' + task.id" class="block text-xs font-bold text-rose-800 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <mat-icon class="text-[14px] w-3.5 h-3.5">photo_camera</mat-icon>
                            Ação Corretiva / Evidência
                          </label>
                          <textarea 
                            [id]="'reason-chk-' + task.id"
                            [(ngModel)]="task.reason"
                            [disabled]="!canEditTasks()"
                            (blur)="updateReason(task, $any($event.target).value)"
                            class="w-full p-3 bg-white border border-rose-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none shadow-inner disabled:opacity-70 disabled:bg-stone-50" 
                            rows="2" 
                            placeholder="Descreva o problema ou ação tomada..."></textarea>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
          }

          <!-- Termometria Section -->
          @if (viewMode() === 'termometria') {
            <div>
              <h2 class="text-xl font-bold text-stone-900 mb-4">Termometria de {{ activeTab() | titlecase }}</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                @if (termometria().length === 0) {
                  <div class="col-span-full p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 border-dashed">
                    Nenhum equipamento cadastrado para este momento.
                  </div>
                }
                @for (task of termometria(); track task.id) {
                  <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 relative overflow-hidden group transition-all"
                       [class.border-rose-300]="task.status === 'nao_conforme'"
                       [class.bg-rose-50]="task.status === 'nao_conforme'"
                       [class.border-emerald-200]="task.status === 'conforme'"
                       [class.bg-emerald-50]="task.status === 'conforme'">
                    
                    @if (task.status === 'nao_conforme') {
                      <div class="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
                    } @else if (task.status === 'conforme') {
                      <div class="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                    }
  
                    <div class="flex justify-between items-start mb-4 mt-1">
                      <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                        <mat-icon class="text-[24px] w-6 h-6">ac_unit</mat-icon>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (canManageTasks()) {
                          <button type="button" (click)="deleteTask(task)" class="text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full shadow-sm">
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                    
                    <h3 class="text-lg font-bold text-stone-900 leading-tight">{{ task.title }}</h3>
                    @if (task.target_value) {
                      <div class="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-md mt-2">
                        <mat-icon class="text-[14px] w-3.5 h-3.5 text-stone-500">thermostat</mat-icon>
                        <p class="text-xs font-bold text-stone-600">Meta: {{ task.target_value }}</p>
                      </div>
                    }
                    
                    <div class="mt-5">
                      @if (editingTaskId() === task.id || (!task.value && canEditTasks())) {
                        <div class="flex items-center gap-2">
                          <div class="flex-1 flex items-center bg-white border-2 border-stone-300 rounded-xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all shadow-inner">
                            <input 
                              #tempInput
                              type="number" 
                              step="0.1"
                              inputmode="decimal"
                              [value]="task.value || ''" 
                              (keyup.enter)="saveTemperature(task, tempInput.value)"
                              class="w-full px-2 sm:px-4 py-2.5 sm:py-3 text-center font-black text-xl sm:text-2xl text-stone-900 focus:outline-none bg-transparent min-w-0" 
                              placeholder="0.0">
                            <span class="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-100 text-stone-500 font-bold border-l border-stone-200 text-base sm:text-lg">°C</span>
                          </div>
                          <button type="button" (click)="saveTemperature(task, tempInput.value)" class="h-[48px] sm:h-[56px] w-[48px] sm:w-[56px] flex items-center justify-center bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md active:scale-95 shrink-0" title="Salvar">
                            <mat-icon class="text-[24px] sm:text-[28px] w-6 sm:w-7 h-6 sm:h-7">check</mat-icon>
                          </button>
                        </div>
                      } @else {
                        <div class="flex items-center justify-between bg-white border border-stone-200 rounded-xl p-3 shadow-sm transition-colors" [class.cursor-pointer]="canEditTasks()" [class.hover:border-stone-300]="canEditTasks()" (click)="canEditTasks() ? editTemperature(task.id) : null" (keydown.enter)="canEditTasks() ? editTemperature(task.id) : null" [attr.tabindex]="canEditTasks() ? 0 : -1" [attr.role]="canEditTasks() ? 'button' : null">
                          <div class="flex items-center gap-2">
                            <span class="font-black text-3xl" [class.text-rose-600]="task.status === 'nao_conforme'" [class.text-emerald-600]="task.status === 'conforme'">{{ task.value || '--' }}</span>
                            <span class="text-stone-500 font-bold text-lg">°C</span>
                          </div>
                          @if (canEditTasks()) {
                            <div class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                              <mat-icon>edit</mat-icon>
                            </div>
                          }
                        </div>
                      }
                    </div>
  
                    <div class="mt-4 pt-4 border-t border-stone-200/50 flex justify-between items-center">
                      <span class="text-xs font-medium text-stone-500 flex items-center gap-1">
                        <mat-icon class="text-[14px] w-3.5 h-3.5">schedule</mat-icon>
                        {{ task.updated_at ? (task.updated_at | date:'HH:mm') : 'Sem leitura' }}
                      </span>
                      @if (task.value) {
                        <div 
                          [class.bg-emerald-100]="task.status !== 'nao_conforme'"
                          [class.text-emerald-800]="task.status !== 'nao_conforme'"
                          [class.bg-rose-100]="task.status === 'nao_conforme'"
                          [class.text-rose-800]="task.status === 'nao_conforme'"
                          class="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                          @if (task.status === 'nao_conforme') {
                            <mat-icon class="text-[14px] w-3.5 h-3.5">warning</mat-icon>
                            Perigo
                          } @else {
                            <mat-icon class="text-[14px] w-3.5 h-3.5">verified</mat-icon>
                            Seguro
                          }
                        </div>
                      }
                    </div>
                    
                    @if (task.status === 'nao_conforme') {
                      <div class="mt-4 pt-4 border-t border-rose-200">
                        <label [for]="'reason-term-' + task.id" class="block text-xs font-bold text-rose-800 mb-2 uppercase tracking-wider flex items-center gap-1">
                          <mat-icon class="text-[14px] w-3.5 h-3.5">build</mat-icon>
                          Plano de Ação Imediato
                        </label>
                        <textarea 
                          [id]="'reason-term-' + task.id"
                          [(ngModel)]="task.reason"
                          [disabled]="!canEditTasks()"
                          (blur)="updateReason(task, $any($event.target).value)"
                          class="w-full p-3 bg-white border-2 border-rose-300 rounded-xl text-sm focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none shadow-inner disabled:opacity-70 disabled:bg-stone-50" 
                          rows="2" 
                          placeholder="O que foi feito para corrigir? (Ex: Ajustado termostato)"></textarea>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @if (activeTab() === 'fechamento') {
            <div class="mt-8">
              <!-- Análise e Assinatura -->
              <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <h3 class="text-lg font-bold text-stone-900 mb-4">Análise Geral do Plantão</h3>
                <textarea [(ngModel)]="shiftAnalysis" [disabled]="!canEditTasks()" class="w-full h-32 p-3 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none disabled:opacity-70 disabled:bg-stone-50" placeholder="Registre ocorrências gerais, quebras de equipamento, faltas ou observações sobre o serviço de hoje..." aria-label="Análise do plantão"></textarea>
                
                @if (canEditTasks()) {
                  <div class="mt-6 pt-6 border-t border-stone-100">
                    <button type="button" (click)="encerrarPlantao()" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                      <mat-icon>verified</mat-icon>
                      Assinar e Encerrar Plantão
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LimpezaComponent implements OnInit {
  cleaningService = inject(CleaningService);
  authService = inject(AuthService);
  teamService = inject(TeamService);

  activeTab = signal<'abertura' | 'operacao' | 'fechamento'>('abertura');
  viewMode = signal<'checklist' | 'termometria'>('checklist');
  showNewTaskForm = signal(false);
  shiftAnalysis = signal('');
  selectedDate = signal(new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  draftTeamId = signal<string | null>(null);
  selectedTeamId = signal<string>('todas');

  editingTaskId = signal<string | null>(null);

  newTaskMinTemp: number | null = null;
  newTaskMaxTemp: number | null = null;
  newTaskShiftMoments: string[] = ['abertura'];

  newTask: Partial<CleaningTask> = {
    title: '',
    category: 'checklist',
    description: '',
    target_value: ''
  };

  currentTasks = computed(() => this.cleaningService.tasks().filter(t => t.shift_moment === this.activeTab()));
  checklists = computed(() => this.currentTasks().filter(t => t.category === 'checklist'));
  termometria = computed(() => this.currentTasks().filter(t => t.category === 'termometria'));
  shiftAnalysisTask = computed(() => this.cleaningService.tasks().find(t => t.title === 'Análise Geral do Plantão' && t.category === 'fechamento'));

  completedChecklists = computed(() => this.checklists().filter(t => t.status !== 'pending').length);

  constructor() {
    effect(() => {
      const task = this.shiftAnalysisTask();
      if (task && task.reason) {
        this.shiftAnalysis.set(task.reason);
      } else {
        this.shiftAnalysis.set('');
      }
    }, { allowSignalWrites: true });
  }

  openNewChecklistForm() {
    this.newTask = {
      title: '',
      category: 'checklist',
      description: '',
      target_value: ''
    };
    this.newTaskMinTemp = null;
    this.newTaskMaxTemp = null;
    this.newTaskShiftMoments = [this.activeTab()];
    this.showNewTaskForm.set(true);
  }

  openNewEquipmentForm() {
    this.newTask = {
      title: '',
      category: 'termometria',
      description: '',
      target_value: ''
    };
    this.newTaskMinTemp = null;
    this.newTaskMaxTemp = null;
    this.newTaskShiftMoments = [this.activeTab()];
    this.showNewTaskForm.set(true);
  }

  ngOnInit() {
    this.cleaningService.loadTasks(undefined, this.selectedDate(), this.selectedTeamId() === 'todas' ? undefined : this.selectedTeamId());
    if (this.authService.isAdmin()) {
      this.teamService.loadTeams();
    }
  }

  onDateChange(newDate: string) {
    this.selectedDate.set(newDate);
    this.cleaningService.loadTasks(undefined, newDate, this.selectedTeamId() === 'todas' ? undefined : this.selectedTeamId());
  }

  onTeamChange(teamId: string) {
    this.selectedTeamId.set(teamId);
    this.cleaningService.loadTasks(undefined, this.selectedDate(), teamId === 'todas' ? undefined : teamId);
  }

  toggleShiftMoment(moment: string) {
    const idx = this.newTaskShiftMoments.indexOf(moment);
    if (idx > -1) {
      this.newTaskShiftMoments.splice(idx, 1);
    } else {
      this.newTaskShiftMoments.push(moment);
    }
  }

  canManageTasks() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'chef' || role === 'auditor';
  }

  canEditTasks() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'chef' || role === 'auditor' || role === 'cook';
  }

  async onSubmit() {
    if (!this.newTask.title || !this.newTask.category || this.newTaskShiftMoments.length === 0) return;
    
    if (this.newTask.category === 'termometria') {
      if (this.newTaskMinTemp !== null && this.newTaskMaxTemp !== null) {
        this.newTask.target_value = `${this.newTaskMinTemp}°C a ${this.newTaskMaxTemp}°C`;
      } else if (this.newTaskMinTemp !== null) {
        this.newTask.target_value = `> ${this.newTaskMinTemp}°C`;
      } else if (this.newTaskMaxTemp !== null) {
        this.newTask.target_value = `< ${this.newTaskMaxTemp}°C`;
      }
    }

    try {
      const payload: Record<string, unknown> = {
        ...this.newTask,
        shift_moments: this.newTaskShiftMoments
      };

      if (this.authService.isAdmin()) {
        payload['team_id'] = this.draftTeamId();
      }

      await this.cleaningService.addTask(payload);
      this.showNewTaskForm.set(false);
      this.newTaskMinTemp = null;
      this.newTaskMaxTemp = null;
      this.newTaskShiftMoments = [this.activeTab()];
      this.draftTeamId.set(null);
      this.newTask = {
        title: '',
        category: 'checklist',
        description: '',
        target_value: ''
      };
    } catch {
      // Error is handled by service
    }
  }

  async encerrarPlantao() {
    if (confirm('Tem certeza que deseja encerrar o plantão? Isso registrará a análise geral.')) {
      try {
        let task = this.shiftAnalysisTask();
        if (!task) {
          const newTasks = await this.cleaningService.addTask({
            title: 'Análise Geral do Plantão',
            category: 'fechamento',
            description: 'Registro geral do plantão',
            shift_moments: ['fechamento']
          });
          task = newTasks[0];
        }
        
        if (task) {
          await this.cleaningService.updateTaskStatus(task.id, 'fechamento', 'conforme', this.shiftAnalysis(), this.shiftAnalysis(), 'fechamento');
          this.generateReport();
          alert('Plantão encerrado e relatório gerado com sucesso!');
        }
      } catch {
        alert('Erro ao encerrar plantão. Tente novamente.');
      }
    }
  }

  async setStatus(task: CleaningTask, status: 'conforme' | 'nao_conforme' | 'na') {
    await this.cleaningService.updateTaskStatus(task.id, task.category, status, undefined, undefined, task.shift_moment);
  }

  async updateReason(task: CleaningTask, reason: string) {
    await this.cleaningService.updateTaskStatus(task.id, task.category, 'nao_conforme', reason, undefined, task.shift_moment);
  }

  validateTemperature(value: string, target?: string): boolean {
    if (!target || !value) return true;
    
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return true;

    const targetStr = target.toLowerCase().replace('°c', '').trim();
    
    const rangeMatch = targetStr.match(/(-?\d+(?:\.\d+)?)\s*(?:a|até|-)\s*(-?\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return numValue >= min && numValue <= max;
    }

    const maxMatch = targetStr.match(/(?:<|máx|max|abaixo de)\s*(-?\d+(?:\.\d+)?)/);
    if (maxMatch) {
      const max = parseFloat(maxMatch[1]);
      return numValue <= max;
    }

    const minMatch = targetStr.match(/(?:>|mín|min|acima de)\s*(-?\d+(?:\.\d+)?)/);
    if (minMatch) {
      const min = parseFloat(minMatch[1]);
      return numValue >= min;
    }

    const exactMatch = targetStr.match(/^(-?\d+(?:\.\d+)?)$/);
    if (exactMatch) {
      const exact = parseFloat(exactMatch[1]);
      return numValue === exact;
    }

    return true;
  }

  async updateValue(task: CleaningTask, value: string) {
    if (task.value === value) return;
    
    let newStatus = task.status;
    if (task.target_value) {
      const isValid = this.validateTemperature(value, task.target_value);
      newStatus = isValid ? 'conforme' : 'nao_conforme';
    } else {
      newStatus = 'conforme';
    }

    await this.cleaningService.updateTaskStatus(task.id, task.category, newStatus, task.reason, value, task.shift_moment);
  }

  editTemperature(id: string) {
    this.editingTaskId.set(id);
  }

  async saveTemperature(task: CleaningTask, value: string) {
    await this.updateValue(task, value);
    this.editingTaskId.set(null);
  }

  async toggleConformity(task: CleaningTask) {
    const newStatus = task.status === 'nao_conforme' ? 'conforme' : 'nao_conforme';
    await this.cleaningService.updateTaskStatus(task.id, task.category, newStatus, undefined, undefined, task.shift_moment);
  }

  async deleteTask(task: CleaningTask) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await this.cleaningService.removeTask(task.id, task.category);
    }
  }

  generateReport() {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(18);
    doc.text(`Relatório de Checklist - ${date}`, 14, 22);
    
    doc.setFontSize(14);
    doc.text('Checklist Diário', 14, 35);
    
    const checklistData = this.checklists().map(t => [
      t.title,
      t.status === 'conforme' ? 'Conforme' : (t.status === 'nao_conforme' ? 'Não Conforme' : (t.status === 'na' ? 'N/A' : 'Pendente')),
      t.updated_at ? new Date(t.updated_at).toLocaleTimeString('pt-BR') : '-'
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Tarefa', 'Status', 'Horário']],
      body: checklistData,
    });
    
    const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 40;
    
    doc.text('Termometria (Equipamentos)', 14, finalY1 + 15);
    
    const termometriaData = this.termometria().map(t => [
      t.title,
      t.target_value || '-',
      t.value ? `${t.value}°C` : '-',
      t.status === 'nao_conforme' ? 'Não Conforme' : 'Normal',
      t.updated_at ? new Date(t.updated_at).toLocaleTimeString('pt-BR') : '-'
    ]);
    
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Equipamento', 'Meta', 'Leitura', 'Status', 'Horário']],
      body: termometriaData,
    });
    
    const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || finalY1 + 20;
    
    if (this.shiftAnalysis()) {
      doc.text('Análise Geral do Plantão', 14, finalY2 + 15);
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(this.shiftAnalysis(), 180);
      doc.text(splitText, 14, finalY2 + 25);
    }
    
    doc.save(`relatorio-checklist-${date.replace(/\//g, '-')}.pdf`);
  }
}

