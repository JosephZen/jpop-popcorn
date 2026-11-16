import { eq, desc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { chatSessions, chatMessages, siteSettings } from '../models/schema.js';

// In-memory cache for live customer carts per session
const liveCarts = new Map();

// Load FAQ from settings or fallback
const loadFaq = async () => {
  try {
    if (isUsingNeon && db) {
      const [faqSetting] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'faq'));
      if (faqSetting && Array.isArray(faqSetting.value)) return faqSetting.value;
    } else {
      const faqSetting = localDb.findOne('site_settings', s => s.key === 'faq');
      if (faqSetting && Array.isArray(faqSetting.value)) return faqSetting.value;
    }
  } catch (err) {
    console.error('Failed to load FAQ:', err.message);
  }
  return [
    {
      question: 'Chat Live Seller',
      answer: 'Connecting you directly to our live Facebook Messenger inbox! Our multi-admin team is ready to assist you with inquiries, custom flavor orders, and bulk delivery.'
    },
    {
      question: 'Can I pick up my order?',
      answer: 'Yes! You can choose "Store Pickup" at checkout with ₱0 shipping fee.\n📍 Pickup Location: J-Pop Corner, Poblacion, San Juan, Abra.\n⏱️ Prep Time: 15–30 minutes fresh from popping/frying. You will receive a ready-for-pickup notification!'
    },
    {
      question: 'My Area is not listed on the shipping options.',
      answer: 'If your exact barangay or municipality outside Abra isn\'t listed, simply choose "Store Pickup" or message our Live Seller on Facebook Messenger with your exact address. We partner with local courier and bus dispatch services for special delivery quotes!'
    },
    {
      question: 'Operating Hours',
      answer: '🕒 Store Hours: Monday to Saturday, 9:00 AM – 8:00 PM.\n⏰ Order Cut-off: 7:30 PM for same-day delivery or pickup. Orders placed after cut-off are queued for next morning popping!'
    },
    {
      question: 'Payment methods',
      answer: 'We support 3 flexible payment methods:\n1. 💵 Cash (Cash on Delivery or Cash on Pickup)\n2. 📱 Manual QR Ph / E-Wallet (GCash, Maya, InstaPay bank transfer with receipt upload)\n3. 💳 Automated Online Gateway (Credit/Debit cards, Maya & QR Ph via PayMongo / HitPay)'
    }
  ];
};

// Keyword & Quick-Reply matcher
const findBotResponse = (message, faq) => {
  const lower = message.toLowerCase().trim();

  // Exact or near matches for the 5 quick replies
  if (lower.includes('chat live seller') || lower.includes('messenger') || lower.includes('chat with joseph') || lower.includes('facebook') || lower.includes('live agent') || lower.includes('human')) {
    return faq.find(f => f.question.toLowerCase().includes('chat live seller'))?.answer ||
      'Connecting you to our Live Seller on Facebook Messenger! You can chat directly with our team at https://m.me/josephzencastro';
  }

  if (lower.includes('pick up') || lower.includes('pickup') || lower.includes('can i pick up')) {
    return faq.find(f => f.question.toLowerCase().includes('pick up'))?.answer;
  }

  if (lower.includes('not listed') || lower.includes('my area') || lower.includes('shipping options') || lower.includes('deliver to') || lower.includes('outside abra')) {
    return faq.find(f => f.question.toLowerCase().includes('not listed'))?.answer;
  }

  if (lower.includes('operating hour') || lower.includes('hours') || lower.includes('open') || lower.includes('close') || lower.includes('cut-off') || lower.includes('time')) {
    return faq.find(f => f.question.toLowerCase().includes('operating hours'))?.answer;
  }

  if (lower.includes('payment') || lower.includes('pay') || lower.includes('gcash') || lower.includes('maya') || lower.includes('qr') || lower.includes('card') || lower.includes('cash')) {
    return faq.find(f => f.question.toLowerCase().includes('payment'))?.answer;
  }

  for (const item of faq) {
    if (lower === item.question.toLowerCase() || lower.includes(item.question.toLowerCase())) {
      return item.answer;
    }
  }

  return null;
};

export const setupChat = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    // ─── Customer: Start or Resume Session ───
    socket.on('start_session', async ({ userId, customerName, cart }) => {
      try {
        let session = null;

        if (isUsingNeon && db) {
          if (userId) {
            const [existing] = await db.select().from(chatSessions)
              .where(eq(chatSessions.userId, userId))
              .orderBy(desc(chatSessions.createdAt));

            if (existing && existing.status !== 'closed') {
              session = existing;
              const messages = await db.select().from(chatMessages)
                .where(eq(chatMessages.sessionId, session.id))
                .orderBy(chatMessages.createdAt);
              socket.emit('session_history', { session, messages });
            }
          }

          if (!session) {
            [session] = await db.insert(chatSessions).values({
              userId: userId || null,
              customerName: customerName || 'Guest Visitor',
              status: 'bot',
            }).returning();

            const greeting = "Hi there! 🍿 Welcome to J-Pop Corner! I'm PopBot, your personal snack assistant. How can I help you today?";
            const [botMsg] = await db.insert(chatMessages).values({
              sessionId: session.id,
              senderType: 'bot',
              content: greeting,
            }).returning();

            socket.emit('session_started', { session, message: botMsg });
          }
        } else {
          if (userId) {
            const existing = localDb.findOne('chat_sessions', s => s.userId === userId && s.status !== 'closed');
            if (existing) {
              session = existing;
              const history = localDb.find('chat_messages', m => m.sessionId === session.id);
              socket.emit('session_history', { session, messages: history });
            }
          }

          if (!session) {
            session = localDb.insert('chat_sessions', {
              userId: userId || null,
              customerName: customerName || 'Guest Visitor',
              status: 'bot',
            });

            const greeting = "Hi there! 🍿 Welcome to J-Pop Corner! I'm PopBot, your personal snack assistant. How can I help you today?";
            const botMsg = localDb.insert('chat_messages', {
              sessionId: session.id,
              senderType: 'bot',
              content: greeting,
            });

            socket.emit('session_started', { session, message: botMsg });
          }
        }

        if (session) {
          socket.join(`session_${session.id}`);
          socket.sessionId = session.id;

          if (cart) {
            liveCarts.set(session.id, cart);
            chatNamespace.to('admin_room').emit('customer_live_cart_update', {
              sessionId: session.id,
              cart,
            });
          }
        }
      } catch (err) {
        console.error('Start chat session error:', err);
        socket.emit('error', { message: 'Failed to start chat session.' });
      }
    });

    // ─── Customer: Live Cart Sync ───
    socket.on('sync_live_cart', ({ sessionId, cart }) => {
      if (sessionId && cart) {
        liveCarts.set(sessionId, cart);
        chatNamespace.to('admin_room').emit('customer_live_cart_update', {
          sessionId,
          cart,
        });
      }
    });

    // ─── Customer: Send Message ───
    socket.on('customer_message', async ({ sessionId, content }) => {
      try {
        if (!content || !content.trim()) return;

        let customerMsg = {
          sessionId,
          senderType: 'customer',
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };

        if (isUsingNeon && db) {
          const [saved] = await db.insert(chatMessages).values({
            sessionId,
            senderType: 'customer',
            content: content.trim(),
          }).returning();
          if (saved) customerMsg = saved;
        } else {
          customerMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'customer',
            content: content.trim(),
          });
        }

        chatNamespace.to(`session_${sessionId}`).emit('new_message', customerMsg);

        let sessionStatus = 'bot';
        if (isUsingNeon && db) {
          const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
          if (session) sessionStatus = session.status;
        } else {
          const session = localDb.findOne('chat_sessions', s => s.id === sessionId);
          if (session) sessionStatus = session.status;
        }

        if (sessionStatus === 'bot') {
          const faq = await loadFaq();
          const botResponse = findBotResponse(content, faq);

          if (botResponse) {
            let botMsg = {
              sessionId,
              senderType: 'bot',
              content: botResponse,
              createdAt: new Date().toISOString(),
            };

            if (isUsingNeon && db) {
              const [saved] = await db.insert(chatMessages).values({
                sessionId,
                senderType: 'bot',
                content: botResponse,
              }).returning();
              if (saved) botMsg = saved;
            } else {
              botMsg = localDb.insert('chat_messages', {
                sessionId,
                senderType: 'bot',
                content: botResponse,
              });
            }

            chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);

            // If user clicked Chat Live Seller, trigger live offer
            if (content.toLowerCase().includes('live seller') || content.toLowerCase().includes('messenger')) {
              chatNamespace.to(`session_${sessionId}`).emit('offer_live_agent');
            }
          } else {
            const offerMsg = "I'm not completely certain about that! 🤔 Would you like to connect directly with our live team on Facebook Messenger or right here?";
            let botMsg = {
              sessionId,
              senderType: 'bot',
              content: offerMsg,
              createdAt: new Date().toISOString(),
            };

            if (isUsingNeon && db) {
              const [saved] = await db.insert(chatMessages).values({
                sessionId,
                senderType: 'bot',
                content: offerMsg,
              }).returning();
              if (saved) botMsg = saved;
            } else {
              botMsg = localDb.insert('chat_messages', {
                sessionId,
                senderType: 'bot',
                content: offerMsg,
              });
            }

            chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
            chatNamespace.to(`session_${sessionId}`).emit('offer_live_agent');
          }
        } else if (sessionStatus === 'live') {
          chatNamespace.to('admin_room').emit('customer_message_update', {
            sessionId,
            message: customerMsg,
          });
        }
      } catch (err) {
        console.error('Customer message error:', err);
      }
    });

    // ─── Customer: Request Live Agent ───
    socket.on('request_live_agent', async ({ sessionId }) => {
      try {
        if (isUsingNeon && db) {
          await db.update(chatSessions)
            .set({ status: 'live', updatedAt: new Date() })
            .where(eq(chatSessions.id, sessionId));

          const [botMsg] = await db.insert(chatMessages).values({
            sessionId,
            senderType: 'bot',
            content: "You're now connected to our live agent queue! 🎧 Our store team has been notified and will reply shortly.",
          }).returning();

          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        } else {
          localDb.update('chat_sessions', s => s.id === sessionId, { status: 'live' });
          const botMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'bot',
            content: "You're now connected to our live agent queue! 🎧 Our store team has been notified and will reply shortly.",
          });
          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        }

        chatNamespace.to(`session_${sessionId}`).emit('session_status', { status: 'live' });
        chatNamespace.to('admin_room').emit('new_live_session', { sessionId });
      } catch (err) {
        console.error('Request live agent error:', err);
      }
    });

    // ─── Admin: Join Admin Room ───
    socket.on('admin_join', async () => {
      socket.join('admin_room');

      try {
        let activeSessions = [];
        if (isUsingNeon && db) {
          activeSessions = await db.select().from(chatSessions)
            .where(eq(chatSessions.status, 'live'))
            .orderBy(desc(chatSessions.updatedAt));
        } else {
          activeSessions = localDb.find('chat_sessions', s => s.status === 'live');
        }

        // Attach live cart if available
        const enriched = activeSessions.map(s => ({
          ...s,
          cart: liveCarts.get(s.id) || null,
        }));

        socket.emit('active_live_sessions', { sessions: enriched });
      } catch (err) {
        console.error('Failed to load active sessions for admin:', err);
      }
    });

    // ─── Admin: Join Specific Session ───
    socket.on('admin_join_session', async ({ sessionId }) => {
      socket.join(`session_${sessionId}`);
      try {
        let messages = [];
        if (isUsingNeon && db) {
          messages = await db.select().from(chatMessages)
            .where(eq(chatMessages.sessionId, sessionId))
            .orderBy(chatMessages.createdAt);
        } else {
          messages = localDb.find('chat_messages', m => m.sessionId === sessionId);
        }
        const cart = liveCarts.get(sessionId) || null;
        socket.emit('session_messages', { sessionId, messages, cart });
      } catch (err) {
        console.error('Admin join session error:', err);
      }
    });

    // ─── Admin: Typing & Reply Indicator Broadcast ───
    socket.on('admin_typing', ({ sessionId, adminName, isTyping }) => {
      // Broadcast to other admins so they know someone is actively replying
      socket.to('admin_room').emit('peer_admin_typing', {
        sessionId,
        adminName: adminName || 'Another Admin',
        isTyping: !!isTyping,
      });

      // Also inform the customer in session
      socket.to(`session_${sessionId}`).emit('agent_typing', {
        isTyping: !!isTyping,
        adminName: adminName || 'Store Team',
      });
    });

    // ─── Admin: Send Message ───
    socket.on('admin_message', async ({ sessionId, content, adminName }) => {
      try {
        if (!content || !content.trim()) return;

        let adminMsg = {
          sessionId,
          senderType: 'admin',
          content: content.trim(),
          adminName: adminName || 'Admin',
          createdAt: new Date().toISOString(),
        };

        if (isUsingNeon && db) {
          const [saved] = await db.insert(chatMessages).values({
            sessionId,
            senderType: 'admin',
            content: content.trim(),
          }).returning();
          if (saved) adminMsg = { ...saved, adminName };
        } else {
          adminMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'admin',
            content: content.trim(),
            adminName,
          });
        }

        chatNamespace.to(`session_${sessionId}`).emit('new_message', adminMsg);

        // Turn off typing indicator
        socket.to('admin_room').emit('peer_admin_typing', {
          sessionId,
          adminName: adminName || 'Admin',
          isTyping: false,
        });
      } catch (err) {
        console.error('Admin message error:', err);
      }
    });

    // ─── Admin: Close Session ───
    socket.on('close_session', async ({ sessionId }) => {
      try {
        if (isUsingNeon && db) {
          await db.update(chatSessions)
            .set({ status: 'closed', updatedAt: new Date() })
            .where(eq(chatSessions.id, sessionId));

          const [botMsg] = await db.insert(chatMessages).values({
            sessionId,
            senderType: 'bot',
            content: "This chat session has ended. Thank you for visiting J-Pop Corner! 🍿",
          }).returning();

          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        } else {
          localDb.update('chat_sessions', s => s.id === sessionId, { status: 'closed' });
          const botMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'bot',
            content: "This chat session has ended. Thank you for visiting J-Pop Corner! 🍿",
          });
          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        }

        liveCarts.delete(sessionId);
        chatNamespace.to(`session_${sessionId}`).emit('session_status', { status: 'closed' });
        chatNamespace.to('admin_room').emit('session_closed', { sessionId });
      } catch (err) {
        console.error('Close session error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
};
