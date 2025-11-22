/**
 * User Search Component - Angular Cross-Boundary Taint Demo
 *
 * TAINT FLOWS:
 * 1. searchTerm → UserService.searchUsers() → Django SQL query
 * 2. API Response → innerHTML binding → XSS
 */

import { Component, OnInit } from '@angular/core';
import { UserService, User, SearchResult } from '../../services/user.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-user-search',
  template: `
    <div class="user-search">
      <h2>User Search</h2>

      <!-- TAINT SOURCE: User input for SQL injection -->
      <div class="search-form">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Search users..."
          (keyup.enter)="onSearch()"
        />
        <select [(ngModel)]="sortBy">
          <option value="username">Username</option>
          <option value="email">Email</option>
          <option value="created_at">Date Joined</option>
        </select>
        <button (click)="onSearch()">Search</button>
      </div>

      <!-- Loading indicator -->
      <div *ngIf="loading" class="loading">Searching...</div>

      <!-- Results -->
      <div class="results" *ngIf="!loading">
        <div *ngFor="let user of users" class="user-card" (click)="selectUser(user)">
          <h3>{{ user.username }}</h3>
          <p>{{ user.email }}</p>

          <!-- TAINT SINK: XSS - rendering user bio as HTML -->
          <!-- Angular sanitizes by default, but we bypass it -->
          <div class="bio" [innerHTML]="sanitizeBio(user.bio)"></div>
        </div>
      </div>

      <!-- Edit panel -->
      <div *ngIf="selectedUser" class="edit-panel">
        <h3>Edit {{ selectedUser.username }}'s Profile</h3>

        <!-- TAINT SOURCE: Bio input that will be stored -->
        <textarea
          [(ngModel)]="editBio"
          placeholder="Enter bio (HTML allowed)..."
          rows="5"
        ></textarea>
        <button (click)="saveBio()">Save Bio</button>
        <button (click)="selectedUser = null">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .user-search { padding: 20px; }
    .search-form { display: flex; gap: 10px; margin-bottom: 20px; }
    .search-form input { flex: 1; padding: 8px; }
    .results { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .user-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; cursor: pointer; }
    .user-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .edit-panel { margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .edit-panel textarea { width: 100%; margin-bottom: 10px; }
    .loading { text-align: center; padding: 20px; }
  `]
})
export class UserSearchComponent implements OnInit {
  searchTerm = '';
  sortBy = 'username';
  users: User[] = [];
  loading = false;
  selectedUser: User | null = null;
  editBio = '';

  constructor(
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Load initial users
    this.onSearch();
  }

  // TAINT FLOW: searchTerm → API → SQL query
  onSearch(): void {
    this.loading = true;
    this.userService.searchUsers(this.searchTerm, this.sortBy).subscribe({
      next: (result: SearchResult) => {
        this.users = result.users || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.loading = false;
      }
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.editBio = user.bio || '';
  }

  // TAINT FLOW: editBio → API → stored in database
  saveBio(): void {
    if (!this.selectedUser) return;

    this.userService.updateProfile(this.selectedUser.id, {
      bio: this.editBio  // TAINT: Stored XSS payload
    }).subscribe({
      next: (updated) => {
        // Update local data
        const index = this.users.findIndex(u => u.id === updated.id);
        if (index >= 0) {
          this.users[index] = updated;
        }
        this.selectedUser = null;
        alert('Profile updated!');
      },
      error: (err) => {
        console.error('Update failed:', err);
        alert('Failed to update profile');
      }
    });
  }

  // TAINT SINK: Bypassing Angular's sanitization
  sanitizeBio(bio: string | undefined): SafeHtml {
    if (!bio) return '';
    // DANGEROUS: bypassSecurityTrustHtml allows XSS
    return this.sanitizer.bypassSecurityTrustHtml(bio);
  }
}
