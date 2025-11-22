/**
 * Vite Main Entry Point
 * Cross-boundary taint flow demo connecting to Rust and Python backends
 */

import { searchUsersRust, readFileRust, executeCommandRust } from './api/rustApi';
import { deserializePickle, parseYaml, evaluateExpression, runShellCommand } from './api/pythonApi';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="container">
      <h1>Project Anarchy - Vite Frontend</h1>
      <p>Cross-boundary taint flows to Rust and Python backends</p>

      <section id="rust-section">
        <h2>Rust Backend (port 8080)</h2>

        <div class="form-group">
          <label>Search Users (SQL Injection):</label>
          <input type="text" id="rust-search" placeholder="Enter search query..." />
          <button id="rust-search-btn">Search</button>
        </div>

        <div class="form-group">
          <label>Read File (Path Traversal):</label>
          <input type="text" id="rust-file" placeholder="/etc/passwd" />
          <button id="rust-file-btn">Read</button>
        </div>

        <div class="form-group">
          <label>Execute Command (Command Injection):</label>
          <input type="text" id="rust-cmd" placeholder="ls -la" />
          <button id="rust-cmd-btn">Execute</button>
        </div>

        <pre id="rust-result"></pre>
      </section>

      <section id="python-section">
        <h2>Python Backend (port 8001)</h2>

        <div class="form-group">
          <label>Evaluate Expression (Code Injection):</label>
          <input type="text" id="py-eval" placeholder="__import__('os').getcwd()" />
          <button id="py-eval-btn">Eval</button>
        </div>

        <div class="form-group">
          <label>Parse YAML (Deserialization):</label>
          <textarea id="py-yaml" placeholder="!!python/object/apply:os.system ['id']"></textarea>
          <button id="py-yaml-btn">Parse</button>
        </div>

        <div class="form-group">
          <label>Shell Command (Command Injection):</label>
          <input type="text" id="py-shell" placeholder="cat /etc/passwd" />
          <button id="py-shell-btn">Run</button>
        </div>

        <pre id="python-result"></pre>
      </section>
    </div>
  `;

  // Wire up event handlers
  setupRustHandlers();
  setupPythonHandlers();
});

function setupRustHandlers() {
  document.getElementById('rust-search-btn')?.addEventListener('click', async () => {
    const query = (document.getElementById('rust-search') as HTMLInputElement).value;
    try {
      const result = await searchUsersRust(query);
      displayResult('rust-result', result);
    } catch (e) {
      displayResult('rust-result', { error: String(e) });
    }
  });

  document.getElementById('rust-file-btn')?.addEventListener('click', async () => {
    const path = (document.getElementById('rust-file') as HTMLInputElement).value;
    try {
      const result = await readFileRust(path);
      displayResult('rust-result', result);
    } catch (e) {
      displayResult('rust-result', { error: String(e) });
    }
  });

  document.getElementById('rust-cmd-btn')?.addEventListener('click', async () => {
    const cmd = (document.getElementById('rust-cmd') as HTMLInputElement).value;
    const [command, ...args] = cmd.split(' ');
    try {
      const result = await executeCommandRust(command, args);
      displayResult('rust-result', result);
    } catch (e) {
      displayResult('rust-result', { error: String(e) });
    }
  });
}

function setupPythonHandlers() {
  document.getElementById('py-eval-btn')?.addEventListener('click', async () => {
    const expr = (document.getElementById('py-eval') as HTMLInputElement).value;
    try {
      const result = await evaluateExpression(expr);
      displayResult('python-result', result);
    } catch (e) {
      displayResult('python-result', { error: String(e) });
    }
  });

  document.getElementById('py-yaml-btn')?.addEventListener('click', async () => {
    const yaml = (document.getElementById('py-yaml') as HTMLTextAreaElement).value;
    try {
      const result = await parseYaml(yaml);
      displayResult('python-result', result);
    } catch (e) {
      displayResult('python-result', { error: String(e) });
    }
  });

  document.getElementById('py-shell-btn')?.addEventListener('click', async () => {
    const cmd = (document.getElementById('py-shell') as HTMLInputElement).value;
    try {
      const result = await runShellCommand(cmd);
      displayResult('python-result', result);
    } catch (e) {
      displayResult('python-result', { error: String(e) });
    }
  });
}

function displayResult(elementId: string, data: any) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = JSON.stringify(data, null, 2);
  }
}
