import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Knowledge Base
  uploadKnowledge(formData: FormData) {
    return this.http.post(`${this.api}/knowledge/upload`, formData);
  }

  getKnowledge() {
    return this.http.get(`${this.api}/knowledge`);
  }

  // Students
  getStudents() {
    return this.http.get(`${this.api}/students`);
  }

  addStudent(student: any) {
    return this.http.post(`${this.api}/students`, student);
  }

  importStudents(formData: FormData) {
    return this.http.post(`${this.api}/students/import`, formData);
  }

  // Chat
  sendMessage(sessionId: string, message: string, userRole: string, userName: string) {
    return this.http.post(`${this.api}/chat/message`, {
      sessionId, message, userRole, userName
    });
  }

  resetChat(sessionId: string) {
    return this.http.post(`${this.api}/chat/reset`, { sessionId });
  }
}
