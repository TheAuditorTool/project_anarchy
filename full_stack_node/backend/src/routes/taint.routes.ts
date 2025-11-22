/**
 * Taint Flow Routes - Express Backend
 *
 * These routes demonstrate cross-boundary taint flows from React frontend.
 * Each route has a clear Source → Sink path for taint analysis testing.
 *
 * TAINT FLOWS:
 * 1. /reports/generate - Command Injection (filename → exec)
 * 2. /files/:fileId/download - Path Traversal (fileId → fs.readFile)
 * 3. /webhooks/register - SSRF (url → axios.get)
 * 4. /users/advanced-search - NoSQL Injection (filter → MongoDB query)
 */

import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

/**
 * TAINT FLOW #1: Command Injection
 * Source: req.body.filename (from React ReportGenerator)
 * Sink: child_process.exec()
 * Path: HTTP POST body → exec()
 */
router.post('/reports/generate', async (req: Request, res: Response) => {
  const { filename, format, filters } = req.body;

  // TAINT: User controlled filename flows directly to shell command
  // Attacker payload: "; rm -rf /" or "$(cat /etc/passwd)"
  const command = `generate-report --output /tmp/reports/${filename}.${format}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Leaking error details
      return res.status(500).json({
        success: false,
        error: error.message,
        stderr: stderr
      });
    }

    res.json({
      success: true,
      path: `/tmp/reports/${filename}.${format}`,
      stdout: stdout
    });
  });
});

/**
 * TAINT FLOW #2: Path Traversal
 * Source: req.params.fileId (from React ReportGenerator)
 * Sink: fs.readFile()
 * Path: URL parameter → file system read
 */
router.get('/files/:fileId/download', async (req: Request, res: Response) => {
  const { fileId } = req.params;

  // TAINT: User controlled path without sanitization
  // Attacker payload: "../../../etc/passwd" or "....//....//etc/passwd"
  const filePath = path.join('/var/uploads', fileId);

  // No validation that filePath is within allowed directory
  fs.readFile(filePath, (error, data) => {
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        path: filePath  // Leaking full path
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}"`);
    res.send(data);
  });
});

/**
 * TAINT FLOW #3: SSRF (Server-Side Request Forgery)
 * Source: req.body.url (from React WebhookManager)
 * Sink: axios.get()
 * Path: HTTP POST body → server-side HTTP request
 */
router.post('/webhooks/register', async (req: Request, res: Response) => {
  const { url, events } = req.body;

  // TAINT: User controlled URL used for server-side request
  // Attacker payload: "http://169.254.169.254/latest/meta-data/" (AWS)
  // Or: "http://localhost:6379/CONFIG%20SET%20dir%20/tmp" (Redis)
  try {
    // Validating the webhook by making a request to it
    const response = await axios.get(url, {
      timeout: 5000,
      // No URL validation, allows internal network access
    });

    // Store webhook (simulated)
    const webhookId = `webhook_${Date.now()}`;

    res.json({
      success: true,
      id: webhookId,
      status: response.status,
      events: events
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      // Leaking internal network information
      details: error.response?.data || 'Connection failed'
    });
  }
});

/**
 * TAINT FLOW #4: SQL Injection via Raw Query
 * Source: req.body.filter (from React advancedSearch)
 * Sink: sequelize.query() with raw SQL
 */
router.post('/users/advanced-search', async (req: Request, res: Response) => {
  const { filter } = req.body;

  // TAINT: User controlled filter object concatenated into SQL
  // Attacker payload: { "username": "admin'--" }
  const whereClause = Object.entries(filter)
    .map(([key, value]) => `${key} = '${value}'`)  // Direct string interpolation!
    .join(' AND ');

  const query = `SELECT * FROM users WHERE ${whereClause}`;

  try {
    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: results,
      query: query  // Leaking the SQL query
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      query: query  // Leaking query even on error
    });
  }
});

/**
 * TAINT FLOW #5: Reflected XSS
 * Source: req.query.callback (JSONP callback)
 * Sink: Response body
 */
router.get('/api/jsonp', (req: Request, res: Response) => {
  const { callback, data } = req.query;

  // TAINT: User controlled callback name reflected in response
  // Attacker payload: callback=alert(document.cookie)//
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`${callback}(${JSON.stringify({ data })})`);
});

/**
 * TAINT FLOW #6: Header Injection
 * Source: req.query.redirect (redirect URL)
 * Sink: res.setHeader('Location', ...)
 */
router.get('/redirect', (req: Request, res: Response) => {
  const { redirect } = req.query;

  // TAINT: User controlled redirect URL
  // Attacker payload: "http://evil.com" or with CRLF injection
  res.setHeader('Location', redirect as string);
  res.status(302).send();
});

/**
 * TAINT FLOW #7: Deserialization
 * Source: req.body.serialized (serialized object)
 * Sink: eval() or JSON.parse with reviver
 */
router.post('/deserialize', (req: Request, res: Response) => {
  const { serialized, type } = req.body;

  // TAINT: Deserializing user controlled data
  let result;
  if (type === 'json') {
    result = JSON.parse(serialized);
  } else if (type === 'eval') {
    // Extremely dangerous - code execution
    result = eval(`(${serialized})`);
  }

  res.json({ success: true, result });
});

/**
 * TAINT FLOW #8: Log Injection
 * Source: req.body.username (user input)
 * Sink: console.log() / file logger
 */
router.post('/login-attempt', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // TAINT: User controlled data written to logs
  // Attacker payload: "admin\n[ERROR] System compromised\n[INFO] User: "
  console.log(`[INFO] Login attempt for user: ${username}`);

  // Simulate failed login
  res.status(401).json({ error: 'Invalid credentials' });
});

export default router;
