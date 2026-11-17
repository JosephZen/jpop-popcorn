"use client";

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiCheckCircle, FiHeadphones, FiUser, FiMessageSquare, FiShoppingCart, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import './AdminChatPanel.css';

const AdminChatPanel = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeCart, setActiveCart] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const chatEndRef = useRef(null);
  const activeSessionRef = useRef(activeSessionId);

  useEffect(() => {
    activeSessionRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all sessions
  const fetchSessions = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const res = await axios.get('/api/chat/sessions');
      const list = res.data?.sessions || [];
      setSessions(list);

      // Auto-select first active session if none selected
      if (list.length > 0 && !activeSessionRef.current) {
        const first = list[0];
        setActiveSessionId(first.sessionId);
        setActiveCart(first.cart || null);
        fetchMessages(first.sessionId);
      }
    } catch {
      // Ignore background poll errors
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  // Fetch messages for active session
  const fetchMessages = async (sid) => {
    const targetId = sid || activeSessionRef.current;
    if (!targetId) return;

    try {
      const res = await axios.get(`/api/chat/messages?sessionId=${encodeURIComponent(targetId)}`);
      const newMsgs = res.data?.messages || [];
      setMessages(newMsgs);
    } catch {}
  };

  // Poll sessions and active messages periodically
  useEffect(() => {
    fetchSessions();

    const interval = setInterval(() => {
      fetchSessions(true);
      if (activeSessionRef.current) {
        fetchMessages(activeSessionRef.current);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const selectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    const targetSession = sessions.find((s) => s.sessionId === sessionId);
    setActiveCart(targetSession?.cart || null);
    fetchMessages(sessionId);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeSessionId || sending) return;

    const content = replyText.trim();
    setSending(true);

    try {
      const res = await axios.post('/api/chat/messages', {
        sessionId: activeSessionId,
        content,
        senderType: 'admin',
        adminName: user?.name || 'J-Pop Store Admin',
      });

      if (res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
      }

      setReplyText('');
      fetchSessions(true);
    } catch (err) {
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const closeSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      await axios.patch('/api/chat/sessions', {
        sessionId,
        status: 'closed',
      });
      toast.success('Chat session marked as closed.');
      fetchSessions();
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setActiveCart(null);
      }
    } catch {
      toast.error('Failed to close session.');
    }
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
        <div className="admin-chat__sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><FiHeadphones /> Live Customer Queue ({sessions.length})</span>
          <button
            onClick={() => fetchSessions()}
            className="btn btn-sm btn-outline"
            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            title="Refresh sessions"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="admin-chat__sessions">
          {sessions.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active customer chats yet.<br />
              <small>When visitors type in the website chat, their conversations appear here in real time!</small>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.sessionId || session.id}
                className={`admin-chat__session-item ${activeSessionId === (session.sessionId || session.id) ? 'admin-chat__session-item--active' : ''}`}
                onClick={() => selectSession(session.sessionId || session.id)}
              >
                <div className="admin-chat__session-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    <FiUser size={12} style={{ marginRight: '4px' }} />
                    {session.customerName || `Customer #${(session.sessionId || '').slice(-4)}`}
                  </span>
                  {session.unreadCount > 0 && (
                    <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px' }}>
                      {session.unreadCount} new
                    </span>
                  )}
                </div>
                <div className="admin-chat__session-meta">
                  <span>Session #{(session.sessionId || session.id || '').slice(-6)}</span>
                  <span style={{ color: session.status === 'closed' ? 'var(--text-muted)' : 'var(--color-success)', fontWeight: 700 }}>
                    {session.status === 'closed' ? 'Closed' : '● Live'}
                  </span>
                </div>
                {session.lastMessage && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    &ldquo;{session.lastMessage}&rdquo;
                  </div>
                )}
                {session.cart && session.cart.itemCount > 0 && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)', marginTop: '4px' }}>
                    🛒 Cart: {session.cart.itemCount} items (₱{parseFloat(session.cart.subtotal || 0).toFixed(2)})
                  </div>
                )}
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
                <strong>Active Customer Session #{(activeSessionId || '').slice(-6)}</strong>
                <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '10px' }}>
                  Live Store Desk
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => closeSession(activeSessionId)}
              >
                <FiCheckCircle /> Mark Resolved
              </button>
            </div>

            {/* If customer has items in cart, display live context bar */}
            {activeCart && activeCart.itemCount > 0 && (
              <div className="admin-chat__cart-bar">
                <FiShoppingCart /> Customer Cart: {activeCart.itemCount} items (Subtotal: ₱{parseFloat(activeCart.subtotal || 0).toFixed(2)})
              </div>
            )}

            {/* Conversation Messages */}
            <div className="admin-chat__messages">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No messages recorded in this session.
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`admin-chat__message admin-chat__message--${msg.senderType}`}
                  >
                    <div className="admin-chat__message-sender">
                      {msg.senderType === 'admin'
                        ? `${msg.adminName || 'You (Admin)'} 🎧`
                        : msg.senderType === 'bot'
                        ? 'PopBot 🍿'
                        : 'Customer 👤'}
                    </div>
                    <div className="admin-chat__message-bubble" style={{ whiteSpace: 'pre-line' }}>
                      {msg.content}
                    </div>
                    {msg.createdAt && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input Bar */}
            <div className="admin-chat__footer">
              <input
                type="text"
                className="admin-chat__input"
                placeholder="Type your live reply to customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
              >
                {sending ? 'Sending...' : <><FiSend /> Reply Live</>}
              </button>
            </div>
          </>
        ) : (
          <div className="admin-chat__empty">
            <FiMessageSquare size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h4>No Customer Conversation Selected</h4>
            <p className="text-muted">
              Select an active session from the left queue to chat directly with website visitors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatPanel;
