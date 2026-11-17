"use client";

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FiX, FiSend, FiHeadphones } from 'react-icons/fi';
import { useAuth } from '../features/auth/AuthContext';
import useCartStore from '../store/cartStore';
import { settingsAPI } from '../services/api';
import './ChatWidget.css';

const DEFAULT_MESSENGER_URL = process.env.NEXT_PUBLIC_FB_MESSENGER_URL || 'https://m.me/2725998090803875';

// Meta Messenger SVG Icon
const MessengerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.518 3.735 7.208V22l3.39-1.86c.91.252 1.88.388 2.875.388 5.523 0 10-4.145 10-9.27C22 6.145 17.523 2 12 2zm1.045 12.453l-2.61-2.784-5.093 2.784 5.602-5.947 2.673 2.784 5.03-2.784-5.602 5.947z"/>
  </svg>
);

// The 5 Pre-Programmed Instant Automated Chatbot Quick-Replies
const FAQ_CHIPS = [
  '💬 Chat Live Seller',
  '🍿 What are your flavors & prices?',
  '🎉 Free Shipping Promo info',
  '🏪 Can I pick up my order?',
  '⏰ Operating Hours & Location',
  '💳 Payment methods',
];

const INITIAL_WELCOME = {
  id: 'welcome-1',
  senderType: 'bot',
  content: "Hi! Welcome to J-Pop Corner 🍿 I'm PopBot, your virtual snack assistant!\n\nTap any quick-reply below or type your question about our gourmet monster-mushroom popcorn, mini donuts, Abra delivery rates, or store pickup!",
};

// Intelligent PopBot Response Engine
const getBotAnswer = (text, messengerUrl) => {
  const lower = text.toLowerCase().trim();

  if (lower.includes('chat live seller') || lower.includes('messenger') || lower.includes('facebook') || lower.includes('live agent') || lower.includes('human') || lower.includes('seller') || lower.includes('admin')) {
    return {
      content: `Connecting you directly to our live seller desk on Facebook Messenger! You can chat in real-time with Joseph and our multi-admin team here:\n\n👉 ${messengerUrl}`,
      offerLive: true,
    };
  }

  if (lower.includes('flavor') || lower.includes('flavours') || lower.includes('price') || lower.includes('menu') || lower.includes('cost')) {
    return {
      content: "🍿 **Gourmet Popcorn Flavors:**\n• Cheese\n• Spicy BBQ\n• Sour Cream & Onion\n• BBQ\n*(You can customize percentage mixes like 50% Cheese + 50% BBQ!)*\n\n💰 **Popcorn Prices:**\n• 500g Resealable Pouch: ₱35.00\n• 1kg Jumbo Party Bag: ₱60.00\n\n🍩 **Mini Donuts:**\n• Box of 8 (Custom Syrups & Dips): ₱99.00\n• Box of 16 Jumbo: ₱180.00",
      offerLive: false,
    };
  }

  if (lower.includes('free ship') || lower.includes('promo') || lower.includes('discount') || lower.includes('bulk')) {
    return {
      content: "🎉 **Automatic Free Shipping Promo:**\n• Buy **5 or more** 1kg Popcorn Bags (₱60 each), OR\n• Buy **10 or more** 500g Popcorn Pouches (₱35 each)\n\n🚚 Qualify for **₱0.00 Delivery Fee** automatically applied at checkout across eligible Abra delivery locations!",
      offerLive: false,
    };
  }

  if (lower.includes('pick up') || lower.includes('pickup') || lower.includes('store pickup')) {
    return {
      content: "🏪 **Store Pickup Details:**\n• **Location:** J-Pop Corner, Poblacion, San Juan, Abra\n• **Shipping Fee:** ₱0.00 (FREE)\n• **Prep Time:** Freshly popped in 15–30 minutes!\n• Select 'Pickup' at checkout and schedule your preferred pickup time.",
      offerLive: false,
    };
  }

  if (lower.includes('hour') || lower.includes('time') || lower.includes('open') || lower.includes('close') || lower.includes('cut-off') || lower.includes('location') || lower.includes('where')) {
    return {
      content: "🕒 **Operating Hours:**\n• Monday to Saturday: 9:00 AM – 8:00 PM\n• Order Cut-off: 7:30 PM for same-day delivery or pickup\n\n📍 **Store Location:**\n• Poblacion, San Juan, Abra\n• Delivery dispatch available across all 27 Abra Municipalities!",
      offerLive: false,
    };
  }

  if (lower.includes('pay') || lower.includes('payment') || lower.includes('gcash') || lower.includes('maya') || lower.includes('instapay') || lower.includes('cash') || lower.includes('cod')) {
    return {
      content: "💳 **Accepted Payment Methods:**\n1. 💵 **Cash** (Cash on Delivery or Cash on Pickup)\n2. 📱 **QR Ph Cashless** (Scan GCash, Maya, or InstaPay QR codes at checkout and upload screenshot)\n3. 💳 **Online Cards** via PayMongo / HitPay gateway",
      offerLive: false,
    };
  }

  if (lower.includes('donut') || lower.includes('mini donut')) {
    return {
      content: "🍩 **J-Pop Freshly Glazed Mini Donuts:**\n• Made fresh to order!\n• Choose artisan syrups (Strawberry, Caramel, Dark Choco), rich warm dips, and crunchy toppings!\n• Box of 8: ₱99.00\n• Box of 16 Jumbo: ₱180.00",
      offerLive: false,
    };
  }

  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('kamusta')) {
    return {
      content: "Hello! 🍿 How can I help you today? Would you like to check our popcorn flavor mixes, mini donuts, free shipping promo, or connect with our live seller on Messenger?",
      offerLive: true,
    };
  }

  return {
    content: "Thank you for reaching out! 🍿 I've noted your question. You can also chat directly with our store team on Facebook Messenger for custom orders or bulk dispatch inquiries!",
    offerLive: true,
  };
};

const ChatWidget = () => {
  const { user } = useAuth();
  const { items, getSubtotal } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [sessionStatus, setSessionStatus] = useState('bot');
  const [offerLive, setOfferLive] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
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
  }, [messages, isOpen, offerLive, isBotTyping]);

  // Optional socket connection attempt (gracefully falls back if unavailable on Vercel)
  useEffect(() => {
    if (!isOpen) return;

    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      if (socketUrl && socketUrl.startsWith('http') && !socketUrl.includes('vercel.app') && !socketUrl.includes('castrojosephzen.shop')) {
        const socket = io(`${socketUrl}/chat`, {
          transports: ['websocket', 'polling'],
          timeout: 3000,
        });
        socketRef.current = socket;

        socket.on('session_started', ({ session, message }) => {
          if (session?.id) setSessionId(session.id);
          if (message) setMessages(prev => [...prev, message]);
        });

        socket.on('new_message', (msg) => {
          setMessages((prev) => [...prev, msg]);
          setIsBotTyping(false);
        });

        return () => {
          socket.disconnect();
        };
      }
    } catch {
      // Socket not available; standalone bot handles everything
    }
  }, [isOpen]);

  const sendMessage = (textToSend) => {
    const text = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!text) return;

    const userMsgId = `user_${Date.now()}`;
    const newMsg = {
      id: userMsgId,
      senderType: 'customer',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputValue('');

    // Special action for Live Seller / Messenger
    if (text.includes('Chat Live Seller') || text.toLowerCase().includes('messenger')) {
      window.open(messengerUrl, '_blank', 'noopener,noreferrer');
      setOfferLive(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          senderType: 'bot',
          content: `Opening Facebook Messenger to connect you with our seller desk! If your browser blocked the popup, click the button below:\n\n👉 ${messengerUrl}`,
        },
      ]);
      return;
    }

    // If socket is actively connected, emit message
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('customer_message', {
        sessionId,
        content: text,
      });
      return;
    }

    // Otherwise, generate intelligent bot response with natural typing delay
    setIsBotTyping(true);
    setTimeout(() => {
      const response = getBotAnswer(text, messengerUrl);
      setIsBotTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          senderType: 'bot',
          content: response.content,
        },
      ]);
      if (response.offerLive) {
        setOfferLive(true);
      }
    }, 450);
  };

  const handleChipClick = (chip) => {
    sendMessage(chip);
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
                  {sessionStatus === 'live' ? 'Live Agent Connected' : 'Instant Bot Active'}
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

            {/* Bot Typing Indicator */}
            {isBotTyping && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 8px' }}>
                🍿 PopBot is typing...
              </div>
            )}

            {/* Quick-Reply Chips */}
            <div className="chat-faq-chips" style={{ marginTop: '10px' }}>
              {FAQ_CHIPS.map((chip, idx) => (
                <button key={idx} className="chat-chip" onClick={() => handleChipClick(chip)}>
                  {chip}
                </button>
              ))}
            </div>

            {/* Messenger Live Seller Handoff Button */}
            {offerLive && (
              <div className="chat-live-action" style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                  Want to chat directly with our store team?
                </p>

                <a
                  href={messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-messenger-btn"
                >
                  <MessengerIcon size={18} /> {messengerLabel}
                </a>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="chat-footer">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask PopBot or tap a quick-reply..."
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
