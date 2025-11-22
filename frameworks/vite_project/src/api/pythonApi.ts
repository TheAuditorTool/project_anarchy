/**
 * Python Backend API Client - Vite → Python (Flask/FastAPI) Cross-Boundary Flow
 *
 * CROSS-BOUNDARY TAINT FLOWS:
 * 1. Pickle payload → Python /api/pickle → pickle.loads()
 * 2. YAML content → Python /api/yaml → yaml.load()
 * 3. Regex pattern → Python /api/regex → re.compile() (ReDoS)
 * 4. Expression → Python /api/eval → eval()
 * 5. Template → Python /api/jinja → Jinja2.render()
 *
 * Target backend: api/ (FastAPI on port 8001)
 */

const PYTHON_API = '/api/python';

/**
 * TAINT FLOW #1: Pickle Deserialization RCE
 * Source: pickleData (base64 encoded pickle)
 * Sink: pickle.loads()
 */
export async function deserializePickle(pickleData: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/pickle/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: pickleData })
  });
  return response.json();
}

/**
 * TAINT FLOW #2: YAML Deserialization
 * Source: yamlContent (user controlled YAML)
 * Sink: yaml.load(Loader=yaml.Loader) - unsafe loader
 */
export async function parseYaml(yamlContent: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/yaml/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: yamlContent })
  });
  return response.json();
}

/**
 * TAINT FLOW #3: ReDoS via regex
 * Source: pattern (user controlled regex)
 * Sink: re.compile().match() with catastrophic backtracking
 */
export async function matchRegex(pattern: string, text: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/regex/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pattern, text })
  });
  return response.json();
}

/**
 * TAINT FLOW #4: Code Injection via eval
 * Source: expression (user controlled)
 * Sink: eval()
 */
export async function evaluateExpression(expression: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/eval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression })
  });
  return response.json();
}

/**
 * TAINT FLOW #5: SSTI via Jinja2
 * Source: template (user controlled)
 * Sink: jinja2.Template().render()
 */
export async function renderJinja(template: string, context: Record<string, any>): Promise<any> {
  const response = await fetch(`${PYTHON_API}/jinja/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, context })
  });
  return response.json();
}

/**
 * TAINT FLOW #6: subprocess injection
 * Source: shellCmd (user controlled)
 * Sink: subprocess.Popen(shell=True)
 */
export async function runShellCommand(shellCmd: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/shell/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: shellCmd })
  });
  return response.json();
}

/**
 * TAINT FLOW #7: LDAP Injection
 * Source: username (user controlled)
 * Sink: ldap.search_s() with string formatting
 */
export async function ldapSearch(username: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/ldap/search?user=${encodeURIComponent(username)}`);
  return response.json();
}

/**
 * TAINT FLOW #8: XPath Injection
 * Source: xpath (user controlled)
 * Sink: lxml.etree.xpath()
 */
export async function xpathQuery(xpath: string, xml: string): Promise<any> {
  const response = await fetch(`${PYTHON_API}/xpath/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xpath, xml })
  });
  return response.json();
}

export default {
  deserializePickle,
  parseYaml,
  matchRegex,
  evaluateExpression,
  renderJinja,
  runShellCommand,
  ldapSearch,
  xpathQuery
};
