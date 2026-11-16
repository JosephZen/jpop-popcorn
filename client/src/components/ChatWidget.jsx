"use client";

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiX, FiSend, FiHeadphones } from 'react-icons/fi';
import { useAuth } from '../features/auth/AuthContext';
import useCartStore from '../store/cartStore';
import { settingsAPI } from '../services/api';
import './ChatWidget.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const DEFAULT_MESSENGER_URL = process.env.NEXT_PUBLIC_FB_MESSENGER_URL || 'https://m.me/josephzencastro';

// Meta Messenger SVG Icon
const MessengerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.518 3.735 7.208V22l3.39-1.86c.91.252 1.88.388 2.875.388 5.523 0 10-4.145 10-9.27C22 6.145 17.523 2 12 2zm1.045 12.453l-2.61-2.784-5.093 2.784 5.602-5.947 2.673 2.784 5.03-2.784-5.602 5.947z"/>
  </svg>
);

// The 5 Pre-Programmed Instant Automated Chatbot Quick-Replies
const FAQ_CHIPS = [
  '💬 Chat Live Seller',
  '🏪 Can I pick up my order?',
  '📍 My Area is not listed on the shipping options.',
  '⏰ Operating Hours',
  '💳 Payment methods',
];

const ChatWidget = () => {
  const { user } = useAuth();
  const { items, getSubtotal } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('bot');
  const [offerLive, setOfferLive] = useState(false);
  const [agentTyping, setAgentTyping] = useState(null);
  const [messengerUrl, setMessengerUrl] = useState(DEFAULT_MESSENGER_URL);
  const [messengerLabel, setMessengerLabel] = useState('Chat with Team on Messenger');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch live settings on mount
  useEffect(() => {
    settingsAPI.get()
      .then(({ data }) => {
        const fb = data.settings?.facebook_messenger;
        if (fb?.url) setMessengerUrl(fb.url);
        if (fb?.label) setMessengerLabel(fb.label);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, offerLive, agentTyping]);

  // Connect socket when widget opens
  useEffect(() => {
    if (!isOpen) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const liveCartPayload = {
      itemCount: items.reduce((s, i) => s + (i.quantity || 1), 0),
      subtotal: getSubtotal(),
      items: items.map(i => ({
        name: i.name,
        qty: i.quantity,
        flavor: i.flavor,
        size: i.size,
      })),
    };

    socket.emit('start_session', {
      userId: user?.id || null,
      customerName: user?.name || 'Guest Popcorn Lover',
      cart: liveCartPayload,
    });

    socket.on('session_started', ({ session, message }) => {
      setSessionId(session.id);
      setSessionStatus(session.status);
      setMessages([message]);
    });

    socket.on('session_history', ({ session, messages: history }) => {
      setSessionId(session.id);
      setSessionStatus(session.status);
      setMessages(history);
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setAgentTyping(null);
    });

    socket.on('agent_typing', ({ isTyping, adminName }) => {
      setAgentTyping(isTyping ? adminName || 'Store Team' : null);
    });

    socket.on('offer_live_agent', () => {
      setOfferLive(true);
    });

    socket.on('session_status', ({ status }) => {
      setSessionStatus(status);
      if (status === 'live') setOfferLive(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen, user]);

  // Sync cart changes to socket if session is open
  useEffect(() => {
    if (socketRef.current && sessionId) {
      socketRef.current.emit('sync_live_cart', {
        sessionId,
        cart: {
          itemCount: items.reduce((s, i) => s + (i.quantity || 1), 0),
          subtotal: getSubtotal(),
          items: items.map(i => ({
            name: i.name,
            qty: i.quantity,
            flavor: i.flavor,
            size: i.size,
          })),
        },
      });
    }
  }, [items, sessionId]);

  const sendMessage = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text || !text.trim() || !sessionId || !socketRef.current) return;

    // Special action for Live Seller / Messenger
    if (text.includes('Chat Live Seller') || text.includes('Messenger')) {
      window.open(messengerUrl, '_blank', 'noopener,noreferrer');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          senderType: 'customer',
          content: 'I want to chat with the seller on Facebook Messenger 💬',
        },
        {
          id: Date.now() + 1,
          senderType: 'bot',
          content: `Opening Meta Messenger to connect you with our multi-admin shared inbox! If the tab was blocked, click the button below:`,
        },
      ]);
      setOfferLive(true);
      if (!textToSend) setInputValue('');
      return;
    }

    socketRef.current.emit('customer_message', {
      sessionId,
      content: text.trim(),
    });

    if (!textToSend) setInputValue('');
  };

  const handleChipClick = (chip) => {
    sendMessage(chip);
  };

  const handleRequestLiveAgent = () => {
    if (!sessionId || !socketRef.current) return;
    socketRef.current.emit('request_live_agent', { sessionId });
    setOfferLive(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="chat-trigger animate-pulse-glow"
          onClick={() => setIsOpen(true)}
          aria-label="Open PopBot Chat Assistant"
        >
          <span>🍿</span>
          <span className="chat-trigger__badge">Help</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header__info">
              <span className="chat-header__avatar">🍿</span>
              <div>
                <div className="chat-header__title">
                  {sessionStatus === 'live' ? 'Live Store Team 🎧' : 'PopBot Snack Assistant'}
                </div>
                <div className="chat-header__status">
                  <span style={{ fontSize: '8px' }}>🟢</span>
                  {sessionStatus === 'live' ? 'Live Agent Connected' : 'Instant Bot Quick-Reply'}
                </div>
              </div>
            </div>

            <div className="chat-header__actions">
              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-header__fb"
                title="Chat with Team on Facebook Messenger"
                aria-label="Open Messenger"
              >
                <MessengerIcon size={18} />
              </a>
              <button
                className="chat-header__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="chat-body">
            {messages.map((msg, index) => (
              <div key={msg.id || index} className={`chat-message chat-message--${msg.senderType}`}>
                <span className="chat-message__sender">
                  {msg.senderType === 'bot'
                    ? 'PopBot 🍿'
                    : msg.senderType === 'admin'
                    ? `${msg.adminName || 'Store Team'} (Live Agent) 🎧`
                    : 'You'}
                </span>
                <div className="chat-message__bubble" style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
              </div>
            ))}

            {/* Agent Typing Indicator */}
            {agentTyping && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 8px' }}>
                🎧 {agentTyping} is typing...
              </div>
            )}

            {/* The 5 Automated Quick-Reply Chips */}
            {messages.length <= 2 && sessionStatus === 'bot' && (
              <div className="chat-faq-chips">
                {FAQ_CHIPS.map((chip, idx) => (
                  <button key={idx} className="chat-chip" onClick={() => handleChipClick(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Live Agent / Messenger Handoff Options */}
            {offerLive && sessionStatus === 'bot' && (
              <div className="chat-live-action">
                <p style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                  Need personalized assistance from our team?
                </p>

                <a
                  href={messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-messenger-btn"
                >
                  <MessengerIcon size={18} /> {messengerLabel}
                </a>

                <div style={{ margin: '10px 0 6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  or connect to website live chat:
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', fontSize: '0.82rem' }}
                  onClick={handleRequestLiveAgent}
                >
                  <FiHeadphones /> Chat Here on Website
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="chat-footer">
            <input
              type="text"
              className="chat-input"
              placeholder={
                sessionStatus === 'live'
                  ? 'Message store team...'
                  : 'Ask PopBot or tap a quick-reply...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!inputValue.trim()}
              aria-label="Send Message"
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
