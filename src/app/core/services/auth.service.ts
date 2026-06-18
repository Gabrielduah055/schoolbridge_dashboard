import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'headmaster' | 'school_admin' | 'teacher';
  permissions: string[];
  schoolId: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

const tokenKey = 'schoolbridge_auth_token';
const userKey = 'schoolbridge_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.readStoredUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/api/auth/login`, { email, password }).pipe(
      tap((response) => this.storeSession(response.token, response.user))
    );
  }

  loadMe(): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>(`${this.api}/api/auth/me`).pipe(
      tap((response) => {
        if (response.user) {
          sessionStorage.setItem(userKey, JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(userKey);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  token(): string {
    return sessionStorage.getItem(tokenKey) || '';
  }

  currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return Boolean(this.token());
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }

  private storeSession(token: string, user: AuthUser): void {
    sessionStorage.setItem(tokenKey, token);
    sessionStorage.setItem(userKey, JSON.stringify(user));
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    localStorage.removeItem('schoolbridge_admin_api_key');
    this.userSubject.next(user);
  }

  private readStoredUser(): AuthUser | null {
    try {
      const value = sessionStorage.getItem(userKey);
      return value ? JSON.parse(value) as AuthUser : null;
    } catch {
      return null;
    }
  }
}
