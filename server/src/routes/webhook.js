import { Router } from 'express';
import config from '../config/index.js';

const router = Router();

// ─── Facebook Messenger Webhook Verification (GET) ───
// Supports /facebook and /messenger endpoints
const handleVerification = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = config.facebook.verifyToken || process.env.FB_VERIFY_TOKEN || 'jpop_messenger_verify_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && (token === expectedToken || token === config.facebook.verifyToken)) {
      console.log('✅ Facebook Messenger Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.warn('⚠️ Facebook Webhook verification token mismatch.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

// ─── Facebook Messenger Incoming Events (POST) ───
const handleIncomingEvent = (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry?.forEach((entry) => {
      const webhookEvent = entry.messaging?.[0];
      if (webhookEvent) {
        const senderPsid = webhookEvent.sender?.id;
        const message = webhookEvent.message;
        console.log(`📩 Incoming Meta Messenger message from PSID: ${senderPsid}`, message?.text || '');
        // When FB_PAGE_ACCESS_TOKEN is configured, Meta Business Suite shared inbox handles multi-admin replies.
      }
    });
    return res.status(200).send('EVENT_RECEIVED');
  }
  return res.sendStatus(404);
};

router.get('/facebook', handleVerification);
router.post('/facebook', handleIncomingEvent);
router.get('/messenger', handleVerification);
router.post('/messenger', handleIncomingEvent);

export default router;
