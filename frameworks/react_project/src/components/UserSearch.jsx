/**
 * UserSearch Component - React Cross-Boundary Taint Demo
 *
 * TAINT FLOWS:
 * 1. Input → searchUsers() → SQL Injection in backend
 * 2. API Response → dangerouslySetInnerHTML → XSS
 */

import React, { useState, useEffect } from 'react';
import { searchUsers, updateUserProfile } from '../api/userApi';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editBio, setEditBio] = useState('');

  // TAINT FLOW: query → searchUsers → SQL
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      // User input flows directly to API call
      const data = await searchUsers(query);
      setResults(data.data || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // TAINT FLOW: editBio → updateUserProfile → stored XSS
  const handleUpdateBio = async () => {
    if (!selectedUser) return;

    try {
      // User input (bio) flows to database, later rendered as HTML
      await updateUserProfile(selectedUser.id, {
        bio: editBio,  // TAINT: Stored XSS payload
        name: selectedUser.displayName,
        website: selectedUser.website
      });
      alert('Profile updated!');
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  return (
    <div className="user-search">
      <h2>User Search</h2>

      {/* TAINT SOURCE: User input */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
        />
        <button type="submit">Search</button>
      </form>

      {/* Results list */}
      <div className="results">
        {results.map((user) => (
          <div key={user.id} className="user-card" onClick={() => setSelectedUser(user)}>
            <h3>{user.username}</h3>

            {/* TAINT SINK: XSS vulnerability - rendering user bio as HTML */}
            <div
              className="user-bio"
              dangerouslySetInnerHTML={{ __html: user.bio }}
            />

            <p>Email: {user.email}</p>
          </div>
        ))}
      </div>

      {/* Edit selected user */}
      {selectedUser && (
        <div className="edit-panel">
          <h3>Edit {selectedUser.username}'s Profile</h3>

          {/* TAINT SOURCE: Bio input that will be stored */}
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            placeholder="Enter bio (HTML allowed)..."
          />
          <button onClick={handleUpdateBio}>Save Bio</button>
        </div>
      )}
    </div>
  );
}
