import React, { useState, useEffect, useRef, useCallback } from 'react';


const API_URL = window._env_.API_URL || 'http://localhost:8000';

export default function ChatApp() {
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/session/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(`Failed to fetch sessions: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const connectToSession = useCallback((session) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    wsRef.current = new WebSocket(`ws://${API_URL.replace('http://', '')}/session/connect/${session.session_id}/${userId}`);
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    wsRef.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
    };
  }, [userId]);

  useEffect(() => {
    if (selectedSession) {
      connectToSession(selectedSession);
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedSession, connectToSession]);

  const createSession = async () => {
    try {
      const response = await fetch(`${API_URL}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await response.json();  // We're not using the data, but we should still await it
      setNewSessionName('');
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      setError(`Failed to create session: ${error.message}`);
    }
  };

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(newMessage);
      setNewMessage('');
    } else {
      setError('WebSocket is not connected');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Chat App</h1>
      
      {error && (
        <div style={{ backgroundColor: '#ffcccc', padding: '10px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="New session name"
          style={{ padding: '5px', marginRight: '10px' }}
        />
        <button onClick={createSession} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Create Session
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Available Sessions</h2>
        {sessions.map((session) => (
          <button
            key={session.session_id}
            onClick={() => setSelectedSession(session)}
            style={{ padding: '5px 10px', marginRight: '10px', marginBottom: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd' }}
          >
            {session.name} ({session.active_users} active)
          </button>
        ))}
      </div>
      
      {selectedSession && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Chat: {selectedSession.name}</h2>
          <div style={{ border: '1px solid #ddd', padding: '10px', height: '300px', overflowY: 'auto', marginBottom: '10px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <strong>{msg.sender_id === userId ? 'You' : msg.sender_id}:</strong> {msg.message}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              style={{ flexGrow: 1, padding: '5px', marginRight: '10px' }}
            />
            <button onClick={sendMessage} style={{ padding: '5px 10px', backgroundColor: '#008CBA', color: 'white', border: 'none' }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
