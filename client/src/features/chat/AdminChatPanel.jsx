"use client";

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiSend, FiCheckCircle, FiHeadphones, FiUser, FiMessageSquare, FiShoppingCart, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';
import './AdminChatPanel.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const AdminChatPanel = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeCart, setActiveCart] = useState(null);
  const [peerTyping, setPeerTyping] = useState(null);
  const [replyText, setReplyText] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerTyping]);

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
        setActiveCart(active[0].cart || null);
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

    socket.on('session_messages', ({ sessionId, messages: history, cart }) => {
      if (sessionId === activeSessionId) {
        setMessages(history || []);
        if (cart) setActiveCart(cart);
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

    socket.on('customer_live_cart_update', ({ sessionId, cart }) => {
      if (sessionId === activeSessionId) {
        setActiveCart(cart);
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, cart } : s))
      );
    });

    // Multi-admin typing indicator
    socket.on('peer_admin_typing', ({ sessionId, adminName, isTyping }) => {
      if (sessionId === activeSessionId) {
        setPeerTyping(isTyping ? adminName : null);
      }
    });

    socket.on('session_closed', ({ sessionId }) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setActiveCart(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeSessionId]);

  const selectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setPeerTyping(null);
    const targetSession = sessions.find((s) => s.id === sessionId);
    setActiveCart(targetSession?.cart || null);

    if (socketRef.current) {
      socketRef.current.emit('admin_join_session', { sessionId });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setReplyText(val);

    if (socketRef.current && activeSessionId) {
      socketRef.current.emit('admin_typing', {
        sessionId: activeSessionId,
        adminName: user?.name || 'Store Admin',
        isTyping: val.length > 0,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('admin_typing', {
            sessionId: activeSessionId,
            adminName: user?.name || 'Store Admin',
            isTyping: false,
          });
        }
      }, 2500);
    }
  };

  const sendReply = () => {
    if (!replyText.trim() || !activeSessionId || !socketRef.current) return;

    socketRef.current.emit('admin_message', {
      sessionId: activeSessionId,
      content: replyText.trim(),
      adminName: user?.name || 'Store Admin',
    });

    setReplyText('');
    setPeerTyping(null);
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
          <FiHeadphones /> Multi-Admin Queue ({sessions.length})
        </div>
        <div className="admin-chat__sessions">
          {sessions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active live inquiries. PopBot is assisting customers with instant quick replies.
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
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>● Live</span>
                </div>
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
                <strong>Active Inquiry Session #{activeSessionId}</strong>
                <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '10px' }}>
                  Multi-Admin Shared Desk
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => closeSession(activeSessionId)}
              >
                <FiCheckCircle /> End Session
              </button>
            </div>

            {/* Live Customer Cart Bar */}
            {activeCart && activeCart.items && activeCart.items.length > 0 && (
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '8px 16px',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FiShoppingCart color="var(--color-primary)" />
                <strong>Customer Live Cart ({activeCart.itemCount} items - ₱{parseFloat(activeCart.subtotal || 0).toFixed(2)}):</strong>
                <span className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeCart.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                </span>
              </div>
            )}

            {/* Peer Admin Typing Indicator */}
            {peerTyping && (
              <div style={{
                background: '#fff3cd',
                color: '#856404',
                padding: '6px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}>
                <FiAlertCircle />
                <span>⚠️ {peerTyping} is actively typing a response to this customer...</span>
              </div>
            )}

            <div className="admin-chat__messages">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`chat-message chat-message--${msg.senderType === 'admin' ? 'customer' : 'bot'}`}
                >
                  <span className="chat-message__sender">
                    {msg.senderType === 'admin'
                      ? `Admin (${msg.adminName || 'Team'})`
                      : msg.senderType === 'bot'
                      ? 'PopBot'
                      : 'Customer'}
                  </span>
                  <div className="chat-message__bubble" style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
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
                onChange={handleInputChange}
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
            <h3>Multi-Admin Live Inquiry Desk</h3>
            <p>Select an inquiry session from the live queue to see the customer's cart and collaborate with linked admins in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatPanel;
