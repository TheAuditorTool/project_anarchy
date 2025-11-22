/**
 * WebhookManager Component - SSRF Taint Flow
 *
 * TAINT FLOW:
 * webhookUrl input → registerWebhook() → backend axios.get() → SSRF
 */

import React, { useState } from 'react';
import { registerWebhook } from '../api/userApi';

export default function WebhookManager() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');

  const availableEvents = [
    'user.created',
    'user.updated',
    'user.deleted',
    'order.placed',
    'payment.completed'
  ];

  const toggleEvent = (event) => {
    setEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  // TAINT FLOW: webhookUrl → API → server-side HTTP request
  const handleRegister = async () => {
    setStatus('Registering...');
    try {
      // User controlled URL flows to server-side request
      // Attacker could use: http://169.254.169.254/latest/meta-data/ (AWS metadata)
      // Or: http://localhost:6379/ (internal Redis)
      const result = await registerWebhook(webhookUrl, events);
      setStatus(`Webhook registered: ${result.id}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="webhook-manager">
      <h2>Webhook Manager</h2>

      <div className="form-group">
        <label>Webhook URL:</label>
        {/* TAINT SOURCE: SSRF attack vector */}
        <input
          type="text"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
        />
        <small>We'll POST event data to this URL</small>
      </div>

      <div className="form-group">
        <label>Events to subscribe:</label>
        {availableEvents.map(event => (
          <label key={event} className="checkbox">
            <input
              type="checkbox"
              checked={events.includes(event)}
              onChange={() => toggleEvent(event)}
            />
            {event}
          </label>
        ))}
      </div>

      <button onClick={handleRegister} disabled={!webhookUrl || events.length === 0}>
        Register Webhook
      </button>

      {status && <p className="status">{status}</p>}
    </div>
  );
}
