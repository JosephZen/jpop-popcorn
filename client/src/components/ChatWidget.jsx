"use client";

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiX, FiSend, FiHeadphones, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../features/auth/AuthContext';
import './ChatWidget.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const FAQ_CHIPS = [
  '🍿 What flavors do you have?',
  '📦 How do I order?',
  '🚚 Delivery fees & bulk promos',
  '💳 Payment methods (QR codes)',
  '⏰ Operating hours',
  '📍 Pickup options',
];

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('bot');
  const [offerLive, setOfferLive] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Connect socket when widget opens
  useEffect(() => {
    if (!isOpen) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('start_session', {
      userId: user?.id || null,
      customerName: user?.name || 'Guest Popcorn Lover',
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

  const sendMessage = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || !sessionId || !socketRef.current) return;

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
                  {sessionStatus === 'live' ? 'Live Support (Joseph)' : 'PopBot Assistant'}
                </div>
                <div className="chat-header__status">
                  <span style={{ fontSize: '8px' }}>🟢</span>
                  {sessionStatus === 'live' ? 'Live Agent Connected' : 'Instant Bot Response'}
                </div>
              </div>
            </div>
            <button
              className="chat-header__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="chat-body">
            {messages.map((msg, index) => (
              <div key={msg.id || index} className={`chat-message chat-message--${msg.senderType}`}>
                <span className="chat-message__sender">
                  {msg.senderType === 'bot'
                    ? 'PopBot 🍿'
                    : msg.senderType === 'admin'
                    ? 'Joseph (Live Agent) 🎧'
                    : 'You'}
                </span>
                <div className="chat-message__bubble">{msg.content}</div>
              </div>
            ))}

            {/* Initial Preset Query Chips */}
            {messages.length <= 1 && sessionStatus === 'bot' && (
              <div className="chat-faq-chips">
                {FAQ_CHIPS.map((chip, idx) => (
                  <button key={idx} className="chat-chip" onClick={() => handleChipClick(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Offer Live Agent Handoff Button */}
            {offerLive && sessionStatus === 'bot' && (
              <div className="chat-live-action">
                <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  Need a personalized answer? Connect with Joseph directly.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRequestLiveAgent}
                >
                  <FiHeadphones /> Connect to Live Agent
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
                  ? 'Message live agent...'
                  : 'Ask PopBot or select a topic...'
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
