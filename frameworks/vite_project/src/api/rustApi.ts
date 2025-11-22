/**
 * Rust Backend API Client - Vite → Rust (Actix-web) Cross-Boundary Flow
 *
 * CROSS-BOUNDARY TAINT FLOWS:
 * 1. User search → Rust /api/search → SQL query (diesel raw)
 * 2. File path → Rust /api/files → std::fs::read
 * 3. Command → Rust /api/exec → std::process::Command
 * 4. Deserialize → Rust /api/deserialize → serde (unsafe)
 *
 * Target backend: rust_backend (Actix-web on port 8080)
 */

const RUST_API = '/api/rust';

export interface SearchResult {
  users: Array<{ id: number; username: string; email: string }>;
  query: string;
}

export interface FileResult {
  content: string;
  path: string;
  size: number;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

/**
 * TAINT FLOW #1: SQL Injection via Rust diesel raw query
 * Source: query (user input)
 * Sink: diesel::sql_query()
 */
export async function searchUsersRust(query: string): Promise<SearchResult> {
  const response = await fetch(`${RUST_API}/users/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return response.json();
}

/**
 * TAINT FLOW #2: Path Traversal via Rust fs::read
 * Source: filePath (user controlled)
 * Sink: std::fs::read_to_string()
 */
export async function readFileRust(filePath: string): Promise<FileResult> {
  const response = await fetch(`${RUST_API}/files/read?path=${encodeURIComponent(filePath)}`);
  if (!response.ok) throw new Error(`Read failed: ${response.status}`);
  return response.json();
}

/**
 * TAINT FLOW #3: Command Injection via Rust Command::new
 * Source: command (user controlled)
 * Sink: std::process::Command with shell
 */
export async function executeCommandRust(command: string, args: string[]): Promise<ExecResult> {
  const response = await fetch(`${RUST_API}/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, args })
  });
  if (!response.ok) throw new Error(`Exec failed: ${response.status}`);
  return response.json();
}

/**
 * TAINT FLOW #4: Unsafe Deserialization
 * Source: payload (user controlled JSON)
 * Sink: serde_json::from_str with custom deserializer
 */
export async function deserializePayload(payload: string): Promise<any> {
  const response = await fetch(`${RUST_API}/deserialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload })
  });
  return response.json();
}

/**
 * TAINT FLOW #5: Buffer overflow via unsafe Rust
 * Source: size parameter
 * Sink: unsafe { Vec::set_len() }
 */
export async function allocateBuffer(size: number): Promise<any> {
  const response = await fetch(`${RUST_API}/buffer/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size })
  });
  return response.json();
}

/**
 * TAINT FLOW #6: Format string via Rust format!
 * Source: template (user controlled)
 * Sink: format!() macro with runtime string
 */
export async function formatTemplate(template: string, values: Record<string, string>): Promise<any> {
  const response = await fetch(`${RUST_API}/format`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, values })
  });
  return response.json();
}

export default {
  searchUsersRust,
  readFileRust,
  executeCommandRust,
  deserializePayload,
  allocateBuffer,
  formatTemplate
};
