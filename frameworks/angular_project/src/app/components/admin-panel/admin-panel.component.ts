/**
 * Admin Panel Component - Command Injection & SSRF Demo
 *
 * TAINT FLOWS:
 * 1. command input → UserService.executeAdminCommand() → os.system()
 * 2. webhookUrl → UserService.registerWebhook() → requests.get()
 * 3. templateString → UserService.renderNotification() → Template.render()
 */

import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div class="admin-panel">
      <h2>Admin Panel</h2>
      <p class="warning">⚠️ These features are for administrative use only</p>

      <!-- Command Execution Section -->
      <section class="section">
        <h3>System Command Execution</h3>
        <div class="form-group">
          <label>Command:</label>
          <!-- TAINT SOURCE: Command injection -->
          <input
            type="text"
            [(ngModel)]="command"
            placeholder="Enter system command..."
          />
          <button (click)="executeCommand()">Execute</button>
        </div>
        <div *ngIf="commandResult" class="result">
          <h4>Output:</h4>
          <pre>{{ commandResult }}</pre>
        </div>
      </section>

      <!-- Webhook Registration Section -->
      <section class="section">
        <h3>Register Webhook</h3>
        <div class="form-group">
          <label>Webhook URL:</label>
          <!-- TAINT SOURCE: SSRF -->
          <input
            type="text"
            [(ngModel)]="webhookUrl"
            placeholder="https://your-server.com/webhook"
          />
        </div>
        <div class="form-group">
          <label>Events:</label>
          <div class="checkboxes">
            <label *ngFor="let event of availableEvents">
              <input
                type="checkbox"
                [checked]="selectedEvents.includes(event)"
                (change)="toggleEvent(event)"
              />
              {{ event }}
            </label>
          </div>
        </div>
        <button (click)="registerWebhook()">Register</button>
        <div *ngIf="webhookResult" class="result">
          <pre>{{ webhookResult | json }}</pre>
        </div>
      </section>

      <!-- Template Preview Section -->
      <section class="section">
        <h3>Notification Template Preview</h3>
        <div class="form-group">
          <label>User ID:</label>
          <input type="number" [(ngModel)]="templateUserId" />
        </div>
        <div class="form-group">
          <label>Template (Django syntax):</label>
          <!-- TAINT SOURCE: SSTI -->
          <textarea
            [(ngModel)]="templateString"
            rows="5"
            placeholder="Hello {{ user.username }}! Your email is {{ user.email }}"
          ></textarea>
        </div>
        <button (click)="previewTemplate()">Preview</button>
        <div *ngIf="templateResult" class="result">
          <h4>Rendered:</h4>
          <div [innerHTML]="templateResult"></div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .admin-panel { padding: 20px; max-width: 800px; }
    .warning { color: #ff9800; background: #fff3e0; padding: 10px; border-radius: 4px; }
    .section { margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .section h3 { margin-top: 0; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
    .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .checkboxes { display: flex; flex-wrap: wrap; gap: 15px; }
    .checkboxes label { display: flex; align-items: center; gap: 5px; }
    button { background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
    .result { margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 4px; }
    .result pre { white-space: pre-wrap; word-break: break-all; }
  `]
})
export class AdminPanelComponent {
  // Command execution
  command = '';
  commandResult = '';

  // Webhook registration
  webhookUrl = '';
  availableEvents = ['user.created', 'user.updated', 'user.deleted', 'order.placed', 'payment.completed'];
  selectedEvents: string[] = [];
  webhookResult: any = null;

  // Template preview
  templateUserId = 1;
  templateString = '';
  templateResult = '';

  constructor(private userService: UserService) {}

  // TAINT FLOW: command → API → os.system()
  executeCommand(): void {
    if (!this.command.trim()) {
      alert('Please enter a command');
      return;
    }

    this.userService.executeAdminCommand(this.command).subscribe({
      next: (result) => {
        this.commandResult = result.output || result.error || JSON.stringify(result);
      },
      error: (err) => {
        this.commandResult = `Error: ${err.message}`;
      }
    });
  }

  toggleEvent(event: string): void {
    const index = this.selectedEvents.indexOf(event);
    if (index >= 0) {
      this.selectedEvents.splice(index, 1);
    } else {
      this.selectedEvents.push(event);
    }
  }

  // TAINT FLOW: webhookUrl → API → requests.get()
  registerWebhook(): void {
    if (!this.webhookUrl.trim()) {
      alert('Please enter a webhook URL');
      return;
    }

    this.userService.registerWebhook(this.webhookUrl, this.selectedEvents).subscribe({
      next: (result) => {
        this.webhookResult = result;
      },
      error: (err) => {
        this.webhookResult = { error: err.message };
      }
    });
  }

  // TAINT FLOW: templateString → API → Django Template.render()
  previewTemplate(): void {
    if (!this.templateString.trim()) {
      alert('Please enter a template');
      return;
    }

    this.userService.renderNotification(this.templateUserId, this.templateString).subscribe({
      next: (result) => {
        this.templateResult = result.rendered || result.error || '';
      },
      error: (err) => {
        this.templateResult = `Error: ${err.message}`;
      }
    });
  }
}
