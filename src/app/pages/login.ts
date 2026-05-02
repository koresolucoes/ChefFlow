import { ChangeDetectionStrategy, Component, inject, signal, effect, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Windows 2000 Desktop -->
    <div class="win2k-desktop min-h-screen flex flex-col" style="cursor: default;">

      <!-- Desktop Icons -->
      <div class="flex-1 relative p-4" style="padding-bottom: 34px;">
        <!-- Desktop Icon: My Computer -->
        <div class="win2k-desktop-icon absolute" style="top: 16px; left: 16px;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="28" height="20" rx="0" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <rect x="4" y="6" width="24" height="16" fill="#000080"/>
            <rect x="10" y="24" width="12" height="3" fill="#a0a0a0"/>
            <rect x="7" y="27" width="18" height="2" fill="#808080"/>
          </svg>
          <span class="icon-label">Meu Computador</span>
        </div>

        <!-- Desktop Icon: Recycle Bin -->
        <div class="win2k-desktop-icon absolute" style="top: 100px; left: 16px;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10 L10 28 L22 28 L24 10 Z" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <rect x="6" y="8" width="20" height="3" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <rect x="12" y="4" width="8" height="4" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <line x1="14" y1="13" x2="13" y2="25" stroke="#808080" stroke-width="1"/>
            <line x1="16" y1="13" x2="16" y2="25" stroke="#808080" stroke-width="1"/>
            <line x1="18" y1="13" x2="19" y2="25" stroke="#808080" stroke-width="1"/>
          </svg>
          <span class="icon-label">Lixeira</span>
        </div>

        <!-- Desktop Icon: Network -->
        <div class="win2k-desktop-icon absolute" style="top: 196px; left: 16px;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="12" height="10" rx="0" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <rect x="18" y="4" width="12" height="10" rx="0" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <rect x="10" y="18" width="12" height="10" rx="0" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
            <line x1="8" y1="14" x2="16" y2="18" stroke="#ffffff" stroke-width="1"/>
            <line x1="24" y1="14" x2="16" y2="18" stroke="#ffffff" stroke-width="1"/>
          </svg>
          <span class="icon-label">Vizinhança de Rede</span>
        </div>

        <!-- Centered Login Dialog -->
        <div class="absolute inset-0 flex items-center justify-center" style="padding-bottom: 34px;">
          <div class="win2k-window" style="width: 340px;">

            <!-- Title Bar -->
            <div class="win2k-titlebar">
              <div class="win2k-title-text">
                <!-- Windows logo icon -->
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="6" height="6" fill="#f25022"/>
                  <rect x="8" y="0" width="6" height="6" fill="#7fba00"/>
                  <rect x="0" y="8" width="6" height="6" fill="#00a4ef"/>
                  <rect x="8" y="8" width="6" height="6" fill="#ffb900"/>
                </svg>
                ChefFlow — Entrar no Sistema
              </div>
              <div style="display: flex; gap: 2px;">
                <div class="win2k-close-btn" title="Minimizar" style="font-size: 8px;">_</div>
                <div class="win2k-close-btn" title="Maximizar" style="font-size: 8px;">□</div>
                <div class="win2k-close-btn" title="Fechar" style="font-weight:bold;">✕</div>
              </div>
            </div>

            <!-- Window Body -->
            <div style="padding: 16px; background: #d4d0c8;">

              <!-- Logo + Header area -->
              <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px;">
                <!-- Chef hat icon -->
                <div style="width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="24" cy="20" rx="16" ry="14" fill="#ffffff" stroke="#808080" stroke-width="1"/>
                    <ellipse cx="14" cy="16" rx="8" ry="7" fill="#ffffff" stroke="#808080" stroke-width="1"/>
                    <ellipse cx="34" cy="16" rx="8" ry="7" fill="#ffffff" stroke="#808080" stroke-width="1"/>
                    <ellipse cx="24" cy="13" rx="9" ry="8" fill="#ffffff" stroke="#808080" stroke-width="1"/>
                    <rect x="10" y="28" width="28" height="12" rx="0" fill="#ffffff" stroke="#808080" stroke-width="1"/>
                    <line x1="16" y1="28" x2="16" y2="40" stroke="#808080" stroke-width="1"/>
                    <line x1="24" y1="28" x2="24" y2="40" stroke="#808080" stroke-width="1"/>
                    <line x1="32" y1="28" x2="32" y2="40" stroke="#808080" stroke-width="1"/>
                  </svg>
                </div>

                <div>
                  <div style="font-family: 'Tahoma', 'MS Sans Serif', sans-serif; font-size: 14px; font-weight: bold; color: #000080; margin-bottom: 2px;">
                    Bem-vindo ao ChefFlow
                  </div>
                  <div style="font-family: 'Tahoma', 'MS Sans Serif', sans-serif; font-size: 11px; color: #444444; line-height: 1.4;">
                    Faça login para acessar o sistema de gestão de cozinha profissional.
                  </div>
                </div>
              </div>

              <div class="win2k-separator"></div>

              <!-- Login form -->
              <form (ngSubmit)="onSubmit()" autocomplete="on">

                <!-- E-mail field -->
                <div style="margin-bottom: 10px;">
                  <label for="email" class="win2k-label" style="display: block; margin-bottom: 3px;">
                    Nome do usuário (E-mail):
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    [(ngModel)]="email"
                    (ngModelChange)="email.set($event)"
                    required
                    class="win2k-input"
                    placeholder="chef@restaurante.com"
                    [value]="email()"
                    (input)="email.set($any($event.target).value)"
                    style="display: block; width: 100%;"
                  />
                </div>

                <!-- Password field -->
                <div style="margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                    <label for="password" class="win2k-label">Senha:</label>
                    <a href="#" style="font-family: 'Tahoma', sans-serif; font-size: 11px; color: #000080; text-decoration: underline;">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    [(ngModel)]="password"
                    required
                    class="win2k-input"
                    placeholder="••••••••"
                    [value]="password()"
                    (input)="password.set($any($event.target).value)"
                    style="display: block; width: 100%;"
                  />
                </div>

                <!-- Error message -->
                @if (error()) {
                  <div class="win2k-error-box" style="margin-bottom: 12px;">
                    <!-- Error icon (red X) -->
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0; margin-top: 1px;">
                      <circle cx="8" cy="8" r="7" fill="#cc0000"/>
                      <line x1="5" y1="5" x2="11" y2="11" stroke="white" stroke-width="2"/>
                      <line x1="11" y1="5" x2="5" y2="11" stroke="white" stroke-width="2"/>
                    </svg>
                    <span>{{ error() }}</span>
                  </div>
                }

                <!-- Loading indicator -->
                @if (isLoading()) {
                  <div style="margin-bottom: 10px;">
                    <div class="win2k-label" style="margin-bottom: 4px;">Verificando credenciais...</div>
                    <div class="win2k-progress">
                      <div class="win2k-progress-bar" [style.width.%]="progressValue()"></div>
                    </div>
                  </div>
                }

                <!-- Buttons row -->
                <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;">
                  <button
                    type="submit"
                    class="win2k-button win2k-button-primary"
                    [disabled]="isLoading() || !email() || !password()"
                  >
                    @if (isLoading()) {
                      Entrando...
                    } @else {
                      OK
                    }
                  </button>
                  <button type="button" class="win2k-button" (click)="clearForm()">
                    Cancelar
                  </button>
                  <button type="button" class="win2k-button" style="min-width: 26px; padding: 4px 8px;">?</button>
                </div>
              </form>

              <div class="win2k-separator" style="margin-top: 12px;"></div>

              <!-- Register link area -->
              <div style="display: flex; align-items: center; gap: 6px; padding-top: 4px;">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="7" r="6" fill="#d4d0c8" stroke="#808080" stroke-width="1"/>
                  <text x="5" y="11" font-family="Tahoma" font-size="10" font-weight="bold" fill="#000080">i</text>
                </svg>
                <span style="font-family: 'Tahoma', sans-serif; font-size: 11px; color: #444444;">
                  Novo aqui?
                  <a [routerLink]="['/register']" style="color: #000080; text-decoration: underline; cursor: pointer;">
                    Cadastre seu restaurante
                  </a>
                  — ou fale com o Administrador.
                </span>
              </div>

            </div><!-- /window body -->
          </div><!-- /win2k-window -->
        </div><!-- /centered -->
      </div><!-- /desktop area -->

      <!-- Taskbar -->
      <div class="win2k-taskbar" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;">
        <!-- Start Button -->
        <div class="win2k-start-btn" style="margin-right: 4px;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="6" height="6" fill="#f25022"/>
            <rect x="8" y="0" width="6" height="6" fill="#7fba00"/>
            <rect x="0" y="8" width="6" height="6" fill="#00a4ef"/>
            <rect x="8" y="8" width="6" height="6" fill="#ffb900"/>
          </svg>
          Iniciar
        </div>

        <!-- Separator -->
        <div style="width: 1px; height: 20px; background: rgba(0,0,0,0.3); margin: 0 6px; border-right: 1px solid rgba(255,255,255,0.2);"></div>

        <!-- Active window button -->
        <div style="
          background: rgba(0,0,0,0.25);
          border-top: 1px solid rgba(0,0,0,0.4);
          border-left: 1px solid rgba(0,0,0,0.4);
          border-right: 1px solid rgba(255,255,255,0.15);
          border-bottom: 1px solid rgba(255,255,255,0.15);
          padding: 2px 8px;
          font-family: Tahoma, sans-serif;
          font-size: 11px;
          color: white;
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 120px;
        ">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="6" height="6" fill="#f25022" opacity="0.8"/>
            <rect x="8" y="0" width="6" height="6" fill="#7fba00" opacity="0.8"/>
            <rect x="0" y="8" width="6" height="6" fill="#00a4ef" opacity="0.8"/>
            <rect x="8" y="8" width="6" height="6" fill="#ffb900" opacity="0.8"/>
          </svg>
          ChefFlow — Entrar
        </div>

        <!-- System tray (right side) -->
        <div style="margin-left: auto; display: flex; align-items: center; gap: 4px;">
          <!-- volume icon -->
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="2,5 5,5 8,2 8,12 5,9 2,9" fill="white" opacity="0.8"/>
            <line x1="10" y1="4" x2="12" y2="7" stroke="white" stroke-width="1" opacity="0.8"/>
            <line x1="10" y1="10" x2="12" y2="7" stroke="white" stroke-width="1" opacity="0.8"/>
          </svg>
          <div class="win2k-clock">{{ currentTime() }}</div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  email = signal('');
  password = signal('');
  isLoading = signal(false);
  error = signal('');
  currentTime = signal('');
  progressValue = signal(0);

  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId) && this.authService.currentUser()) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.updateClock();
      this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.progressInterval) clearInterval(this.progressInterval);
  }

  private updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    this.currentTime.set(`${h}:${m}`);
  }

  clearForm() {
    this.email.set('');
    this.password.set('');
    this.error.set('');
  }

  async onSubmit() {
    if (!this.email() || !this.password()) return;

    this.isLoading.set(true);
    this.error.set('');
    this.progressValue.set(0);

    // Animate progress bar
    if (isPlatformBrowser(this.platformId)) {
      this.progressInterval = setInterval(() => {
        const v = this.progressValue();
        if (v < 85) this.progressValue.set(v + 5);
      }, 80);
    }

    try {
      const success = await this.authService.login(this.email(), this.password());
      if (!success) {
        this.error.set('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
      } else {
        this.progressValue.set(100);
      }
    } catch {
      this.error.set('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      this.isLoading.set(false);
    }
  }
}
