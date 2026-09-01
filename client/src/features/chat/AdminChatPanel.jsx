"use client";

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiSend, FiCheckCircle, FiHeadphones, FiUser, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminChatPanel.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const AdminChatPanel = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('admin_join');

    socket.on('active_live_sessions', ({ sessions: active }) => {
      setSessions(active || []);
      if (active && active.length > 0 && !activeSessionId) {
        setActiveSessionId(active[0].id);
        socket.emit('admin_join_session', { sessionId: active[0].id });
      }
    });

    socket.on('new_live_session', ({ sessionId }) => {
      toast('🎧 New customer requested live agent!', { icon: '🍿' });
      setSessions((prev) => {
        if (prev.some((s) => s.id === sessionId)) return prev;
        return [{ id: sessionId, customerName: `Session #${sessionId}`, status: 'live' }, ...prev];
      });
    });

    socket.on('session_messages', ({ sessionId, messages: history }) => {
      if (sessionId === activeSessionId) {
        setMessages(history || []);
      }
    });

    socket.on('new_message', (msg) => {
      if (msg.sessionId === activeSessionId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('customer_message_update', ({ sessionId, message }) => {
      if (sessionId === activeSessionId) {
        setMessages((prev) => [...prev, message]);
      } else {
        toast(`New message in Session #${sessionId}`, { icon: '💬' });
      }
    });

    socket.on('session_closed', ({ sessionId }) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeSessionId]);

  const selectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    if (socketRef.current) {
      socketRef.current.emit('admin_join_session', { sessionId });
    }
  };

  const sendReply = () => {
    if (!replyText.trim() || !activeSessionId || !socketRef.current) return;

    socketRef.current.emit('admin_message', {
      sessionId: activeSessionId,
      content: replyText.trim(),
    });

    setReplyText('');
  };

  const closeSession = (sessionId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('close_session', { sessionId });
    toast.success('Live chat session closed.');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="admin-chat">
      {/* Sidebar with active live sessions */}
      <div className="admin-chat__sidebar">
        <div className="admin-chat__sidebar-header">
          <FiHeadphones /> Live Queue ({sessions.length})
        </div>
        <div className="admin-chat__sessions">
          {sessions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active live inquiries. PopBot is answering FAQ questions.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`admin-chat__session-item ${activeSessionId === session.id ? 'admin-chat__session-item--active' : ''}`}
                onClick={() => selectSession(session.id)}
              >
                <div className="admin-chat__session-name">
                  <FiUser size={12} style={{ marginRight: '4px' }} />
                  {session.customerName || `Customer #${session.id}`}
                </div>
                <div className="admin-chat__session-meta">
                  <span>Session #{session.id}</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>● Active</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat conversation view */}
      <div className="admin-chat__main">
        {activeSessionId ? (
          <>
            <div className="admin-chat__main-header">
              <div>
                <strong>Active Chat Session #{activeSessionId}</strong>
                <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '10px' }}>
                  Live Customer Support
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => closeSession(activeSessionId)}
              >
                <FiCheckCircle /> End Session
              </button>
            </div>

            <div className="admin-chat__messages">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`chat-message chat-message--${msg.senderType === 'admin' ? 'customer' : 'bot'}`}
                >
                  <span className="chat-message__sender">
                    {msg.senderType === 'admin'
                      ? 'You (Admin)'
                      : msg.senderType === 'bot'
                      ? 'PopBot'
                      : 'Customer'}
                  </span>
                  <div className="chat-message__bubble">{msg.content}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="admin-chat__input-bar">
              <input
                type="text"
                className="form-input"
                placeholder="Type your response to customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-primary" onClick={sendReply} disabled={!replyText.trim()}>
                <FiSend /> Send
              </button>
            </div>
          </>
        ) : (
          <div className="admin-chat__empty">
            <FiMessageSquare size={48} />
            <h3>Live Agent Chat Desk</h3>
            <p>Select a live chat session from the queue to start responding to customers in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatPanel;
