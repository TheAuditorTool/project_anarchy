/**
 * Main React App - Cross-Boundary Entry Point
 *
 * This app makes real API calls to:
 * - full_stack_node/backend (Express) on port 3000
 * - frameworks/fastapi_project on port 8000
 */

import React, { useState, useEffect } from 'react';
import UserSearch from './components/UserSearch';
import ReportGenerator from './components/ReportGenerator';
import WebhookManager from './components/WebhookManager';
import { login } from './api/userApi';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login(username, password);
      if (result.token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <h1>Project Anarchy - React Frontend</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Project Anarchy Dashboard</h1>
        <nav>
          <button onClick={() => setActiveTab('search')}>User Search</button>
          <button onClick={() => setActiveTab('reports')}>Reports</button>
          <button onClick={() => setActiveTab('webhooks')}>Webhooks</button>
        </nav>
      </header>

      <main>
        {activeTab === 'search' && <UserSearch />}
        {activeTab === 'reports' && <ReportGenerator />}
        {activeTab === 'webhooks' && <WebhookManager />}
      </main>
    </div>
  );
}

export default App;
