import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  public readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  // States for API call verification
  protected readonly apiResult = signal<string | null>(null);
  protected readonly apiError = signal<string | null>(null);
  protected readonly isCallingApi = signal(false);

  /**
   * Triggers a login redirect.
   */
  protected login(): void {
    this.authService.login();
  }

  /**
   * Triggers a logout redirect.
   */
  protected logout(): void {
    this.authService.logout();
  }

  /**
   * Performs a dummy API call to demonstrate the HTTP Interceptor attaching the Bearer token.
   */
  protected testApiCall(): void {
    this.isCallingApi.set(true);
    this.apiResult.set(null);
    this.apiError.set(null);

    // Call a local relative endpoint. It will fail with 404 (no backend is running yet),
    // but in browser DevTools Network tab, you will see it sent the Authorization header.
    this.http.get('/api/secure-data', { responseType: 'text' }).subscribe({
      next: (res) => {
        this.apiResult.set(res);
        this.isCallingApi.set(false);
      },
      error: (err) => {
        // Since there is no backend running, a 404 is expected, but we show that the request was intercepted.
        this.apiError.set(`Request sent! (Server returned: ${err.status} ${err.statusText}). Check Network tab in DevTools to see the Bearer token header!`);
        this.isCallingApi.set(false);
      }
    });
  }
}
