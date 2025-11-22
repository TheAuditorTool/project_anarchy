/**
 * User Service - Angular → Django Cross-Boundary Flow
 *
 * CROSS-BOUNDARY TAINT FLOWS:
 * 1. User search → Django /api/users/search → SQL query (SQL Injection)
 * 2. Profile update → Django /api/users/:id → ORM query
 * 3. File upload → Django /api/upload → Path Traversal
 * 4. Command exec → Django /api/admin/exec → Command Injection
 *
 * Target backend: frameworks/django_project (Django on port 8000)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  role: string;
}

export interface SearchResult {
  users: User[];
  total: number;
  query: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * TAINT FLOW #1: SQL Injection via search
   * Source: searchTerm (user input)
   * Sink: Django raw SQL query
   * Path: Angular input → HTTP GET → Django view → cursor.execute()
   */
  searchUsers(searchTerm: string, sortBy: string = 'username'): Observable<SearchResult> {
    // User input flows directly to query parameter
    const params = new HttpParams()
      .set('q', searchTerm)      // TAINT: SQL injection vector
      .set('sort', sortBy)       // TAINT: ORDER BY injection
      .set('limit', '100');

    return this.http.get<SearchResult>(`${this.apiUrl}/users/search`, { params });
  }

  /**
   * TAINT FLOW #2: Stored XSS via profile update
   * Source: bio field (user controlled HTML)
   * Sink: Django model → database → later rendered in template
   */
  updateProfile(userId: number, profile: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, {
      bio: profile.bio,           // TAINT: XSS payload stored in DB
      username: profile.username,
      email: profile.email
    });
  }

  /**
   * TAINT FLOW #3: Path Traversal via file path
   * Source: filePath (user controlled)
   * Sink: Django file operations
   */
  uploadAvatar(userId: number, filePath: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/avatar`, {
      path: filePath,     // TAINT: Path traversal (../../../etc/passwd)
      content: content
    });
  }

  /**
   * TAINT FLOW #4: IDOR (Insecure Direct Object Reference)
   * Source: userId (user controlled)
   * Sink: Django model lookup without ownership check
   */
  getUserById(userId: number): Observable<User> {
    // No authorization check - any user can access any profile
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * TAINT FLOW #5: Command Injection via admin endpoint
   * Source: command (user controlled)
   * Sink: Django os.system() or subprocess
   */
  executeAdminCommand(command: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/exec`, {
      command: command    // TAINT: Command injection
    });
  }

  /**
   * TAINT FLOW #6: SSTI via template
   * Source: templateString (user controlled)
   * Sink: Django Template().render()
   */
  renderNotification(userId: number, templateString: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/notification`, {
      template: templateString    // TAINT: Server-side template injection
    });
  }

  /**
   * TAINT FLOW #7: Mass Assignment
   * Source: entire request body
   * Sink: Django model.objects.create(**data)
   */
  createUser(userData: any): Observable<User> {
    // Attacker can include role: 'admin' in the payload
    return this.http.post<User>(`${this.apiUrl}/users`, userData);
  }

  /**
   * TAINT FLOW #8: SSRF via webhook
   * Source: webhookUrl (user controlled)
   * Sink: Django requests.get()
   */
  registerWebhook(webhookUrl: string, events: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/webhooks/register`, {
      url: webhookUrl,    // TAINT: SSRF (http://169.254.169.254/...)
      events: events
    });
  }

  /**
   * Login - stores token
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, {
      username,
      password
    });
  }

  /**
   * Get current user from stored token
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }
}
