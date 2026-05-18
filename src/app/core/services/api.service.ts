import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiStudent {
  [key: string]: unknown;
}

export interface ApiKnowledgeItem {
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Knowledge Base
  uploadKnowledge(formData: FormData) {
    return this.http.post(`${this.api}/api/knowledge/upload`, formData);
  }

  getKnowledge(): Observable<ApiKnowledgeItem[]> {
    return this.http
      .get<unknown>(`${this.api}/api/knowledge`)
      .pipe(map((response) => this.extractArray<ApiKnowledgeItem>(response, ['knowledge', 'documents', 'data', 'items', 'results'])));
  }

  // Students
  getStudents(): Observable<ApiStudent[]> {
    return this.http
      .get<unknown>(`${this.api}/api/students`)
      .pipe(map((response) => this.extractArray<ApiStudent>(response, ['students', 'data', 'items', 'results'])));
  }

  addStudent(student: any) {
    return this.http.post(`${this.api}/api/students`, student);
  }

  importStudents(formData: FormData) {
    return this.http.post(`${this.api}/api/students/import`, formData);
  }

  // Chat
  sendMessage(sessionId: string, message: string, userRole: string, userName: string) {
    return this.http.post(`${this.api}/api/chat/message`, {
      sessionId, message, userRole, userName
    });
  }

  resetChat(sessionId: string) {
    return this.http.post(`${this.api}/api/chat/reset`, { sessionId });
  }

  // Conversations (for Messages Today count)
  getConversations(): Observable<unknown[]> {
    return this.http
      .get<unknown>(`${this.api}/api/conversations`)
      .pipe(map((response) => this.extractArray<unknown>(response, ['conversations', 'messages', 'data', 'items', 'results'])));
  }

  private extractArray<T>(response: unknown, keys: string[]): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const record = response as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    return [];
  }
}
