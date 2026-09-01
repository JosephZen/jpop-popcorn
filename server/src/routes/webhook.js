import { Router } from 'express';
import config from '../config/index.js';

const router = Router();

// ─── Facebook Messenger Webhook Verification (GET) ───
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.facebook.verifyToken) {
      console.log('✅ Facebook Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ─── Facebook Messenger Webhook Incoming Events (POST) ───
router.post('/facebook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry?.forEach((entry) => {
      const webhookEvent = entry.messaging?.[0];
      if (webhookEvent) {
        const senderPsid = webhookEvent.sender?.id;
        console.log(`📩 Incoming Facebook message from sender PSID: ${senderPsid}`);
        // Handle message event if FB_PAGE_ACCESS_TOKEN is configured
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

export default router;
