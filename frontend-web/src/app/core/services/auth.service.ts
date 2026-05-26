import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private keycloakInstance?: Keycloak;

  // Angular signals to make authentication state reactively accessible in the app
  readonly isAuthenticated = signal(false);
  readonly username = signal<string | null>(null);

  /**
   * Initializes Keycloak. This method will be run during Angular startup via APP_INITIALIZER.
   */
  async initialize(): Promise<void> {
    try {
      this.keycloakInstance = new Keycloak({
        url: 'http://localhost:8080',
        realm: 'scribeai',
        clientId: 'scribeai-frontend'
      });

      const authenticated = await this.keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256'
      });

      this.isAuthenticated.set(authenticated);
      if (authenticated) {
        // Access index signature property with bracket notation for strict compiler checks
        const tokenParsed = this.keycloakInstance.tokenParsed as Record<string, any> | undefined;
        this.username.set(tokenParsed?.['preferred_username'] || null);

        // Handle automatic token refresh when it expires in the background
        this.keycloakInstance.onTokenExpired = () => {
          this.keycloakInstance?.updateToken(30).then((refreshed) => {
            if (refreshed) {
              console.log('Keycloak token refreshed successfully');
            }
          }).catch((err) => {
            console.error('Failed to refresh Keycloak token', err);
            this.logout();
          });
        };
      }
    } catch (error) {
      console.error('Failed to initialize Keycloak client:', error);
    }
  }

  /**
   * Redirects the browser to the Keycloak login screen.
   */
  async login(): Promise<void> {
    if (this.keycloakInstance) {
      await this.keycloakInstance.login();
    }
  }

  /**
   * Logs out from Keycloak and redirects back to the home page.
   */
  async logout(): Promise<void> {
    if (this.keycloakInstance) {
      await this.keycloakInstance.logout({
        redirectUri: window.location.origin
      });
      this.isAuthenticated.set(false);
      this.username.set(null);
    }
  }

  /**
   * Synchronously returns the current access token.
   */
  getToken(): string | undefined {
    return this.keycloakInstance?.token;
  }

  /**
   * Force refreshes the token if its validity is below minValiditySeconds.
   */
  async refreshToken(minValiditySeconds: number = 30): Promise<boolean> {
    if (!this.keycloakInstance) {
      return false;
    }
    try {
      return await this.keycloakInstance.updateToken(minValiditySeconds);
    } catch (error) {
      console.error('Failed to refresh token manually:', error);
      return false;
    }
  }

  /**
   * Returns roles assigned to the user (both Realm-level and Client-level).
   */
  getUserRoles(): string[] {
    if (!this.keycloakInstance) {
      return [];
    }
    const realmRoles = this.keycloakInstance.realmAccess?.roles || [];
    const clientId = this.keycloakInstance.clientId;
    const clientRoles = clientId
      ? (this.keycloakInstance.resourceAccess?.[clientId]?.roles || [])
      : [];
    return [...realmRoles, ...clientRoles];
  }
}
