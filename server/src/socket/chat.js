import { eq, desc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import { chatSessions, chatMessages, siteSettings } from '../models/schema.js';

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
      question: 'What flavors do you have?',
      answer: 'We offer 6 signature flavors: Classic Golden Butter, Aged Sharp Cheddar, Salted Caramel Gold, Fiery Sriracha BBQ, Cookies & Cream Dream, and Kyoto Matcha White Chocolate! Check our Shop page for details.'
    },
    {
      question: 'How do I order?',
      answer: '1. Browse our Shop and select your popcorn & flavors.\n2. Add to cart & click Checkout.\n3. Choose Delivery or Pickup and pick your scheduled time.\n4. Scan our QR code (GCash/Maya/InstaPay) and upload your payment receipt!'
    },
    {
      question: 'What are your delivery fees & bulk discounts?',
      answer: '🍿 Bulk Order Promo:\n• 10 or more items: FREE Delivery!\n• 7 to 9 items: Only ₱5 shipping fee\n• 2 to 6 items: ₱40 shipping fee\n• 1 item: ₱50 shipping fee\n• Pickup at store: FREE!'
    },
    {
      question: 'How do I pay?',
      answer: 'We accept cashless QR code payments via GCash, Maya, and InstaPay. Scan the QR code at checkout, complete payment, and upload your screenshot receipt.'
    },
    {
      question: 'What are your operating hours?',
      answer: 'We pop fresh Monday to Saturday, 9:00 AM to 8:00 PM.'
    },
    {
      question: 'Can I pick up my order?',
      answer: 'Yes! Select "Pickup" at checkout and choose your scheduled pickup time.'
    }
  ];
};

// Keyword matcher
const findBotResponse = (message, faq) => {
  const lower = message.toLowerCase().trim();

  for (const item of faq) {
    if (lower === item.question.toLowerCase() || lower.includes(item.question.toLowerCase())) {
      return item.answer;
    }
  }

  if (lower.includes('flavor') || lower.includes('taste') || lower.includes('menu') || lower.includes('kind') || lower.includes('variety')) {
    return faq.find(f => f.question.toLowerCase().includes('flavor'))?.answer;
  }
  if (lower.includes('how to order') || lower.includes('buy') || lower.includes('purchase') || lower.includes('ordering')) {
    return faq.find(f => f.question.toLowerCase().includes('order'))?.answer;
  }
  if (lower.includes('bulk') || lower.includes('shipping') || lower.includes('delivery') || lower.includes('fee') || lower.includes('cost') || lower.includes('promo') || lower.includes('discount')) {
    return faq.find(f => f.question.toLowerCase().includes('delivery') || f.question.toLowerCase().includes('discount') || f.question.toLowerCase().includes('bulk'))?.answer;
  }
  if (lower.includes('pay') || lower.includes('gcash') || lower.includes('maya') || lower.includes('instapay') || lower.includes('payment') || lower.includes('qr')) {
    return faq.find(f => f.question.toLowerCase().includes('pay'))?.answer;
  }
  if (lower.includes('hour') || lower.includes('open') || lower.includes('time') || lower.includes('schedule') || lower.includes('when')) {
    return faq.find(f => f.question.toLowerCase().includes('hour'))?.answer;
  }
  if (lower.includes('pick') || lower.includes('pickup') || lower.includes('store')) {
    return faq.find(f => f.question.toLowerCase().includes('pick'))?.answer;
  }

  return null;
};

export const setupChat = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    console.log(`🔌 Chat client connected: ${socket.id}`);

    // ─── Customer: Start or Resume Session ───
    socket.on('start_session', async ({ userId, customerName }) => {
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

            const greeting = "Hi there! 🍿 Welcome to J-Pop Popcorn! I'm PopBot, your personal popcorn assistant. How can I help you today?";
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

            const greeting = "Hi there! 🍿 Welcome to J-Pop Popcorn! I'm PopBot, your personal popcorn assistant. How can I help you today?";
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
        }
      } catch (err) {
        console.error('Start chat session error:', err);
        socket.emit('error', { message: 'Failed to start chat session.' });
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
          createdAt: new Date(),
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
              createdAt: new Date(),
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
          } else {
            const offerMsg = "I'm not sure about that one! 🤔 Would you like to connect directly with our live owner/agent?";
            let botMsg = {
              sessionId,
              senderType: 'bot',
              content: offerMsg,
              createdAt: new Date(),
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
            content: "You're now connected to our live agent queue! 🎧 Joseph (Owner) has been notified and will reply shortly.",
          }).returning();

          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        } else {
          localDb.update('chat_sessions', s => s.id === sessionId, { status: 'live' });
          const botMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'bot',
            content: "You're now connected to our live agent queue! 🎧 Joseph (Owner) has been notified and will reply shortly.",
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
      console.log('👑 Admin joined chat room');

      try {
        let activeSessions = [];
        if (isUsingNeon && db) {
          activeSessions = await db.select().from(chatSessions)
            .where(eq(chatSessions.status, 'live'))
            .orderBy(desc(chatSessions.updatedAt));
        } else {
          activeSessions = localDb.find('chat_sessions', s => s.status === 'live');
        }
        socket.emit('active_live_sessions', { sessions: activeSessions });
      } catch (err) {
        console.error('Failed to load active sessions for admin:', err);
      }
    });

    // ─── Admin: Join specific session ───
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
        socket.emit('session_messages', { sessionId, messages });
      } catch (err) {
        console.error('Admin join session error:', err);
      }
    });

    // ─── Admin: Send Message ───
    socket.on('admin_message', async ({ sessionId, content }) => {
      try {
        if (!content || !content.trim()) return;

        let adminMsg = {
          sessionId,
          senderType: 'admin',
          content: content.trim(),
          createdAt: new Date(),
        };

        if (isUsingNeon && db) {
          const [saved] = await db.insert(chatMessages).values({
            sessionId,
            senderType: 'admin',
            content: content.trim(),
          }).returning();
          if (saved) adminMsg = saved;
        } else {
          adminMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'admin',
            content: content.trim(),
          });
        }

        chatNamespace.to(`session_${sessionId}`).emit('new_message', adminMsg);
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
            content: "This chat session has ended. Thank you for choosing J-Pop Popcorn! 🍿",
          }).returning();

          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        } else {
          localDb.update('chat_sessions', s => s.id === sessionId, { status: 'closed' });
          const botMsg = localDb.insert('chat_messages', {
            sessionId,
            senderType: 'bot',
            content: "This chat session has ended. Thank you for choosing J-Pop Popcorn! 🍿",
          });
          chatNamespace.to(`session_${sessionId}`).emit('new_message', botMsg);
        }

        chatNamespace.to(`session_${sessionId}`).emit('session_status', { status: 'closed' });
        chatNamespace.to('admin_room').emit('session_closed', { sessionId });
      } catch (err) {
        console.error('Close session error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Chat client disconnected: ${socket.id}`);
    });
  });
};
