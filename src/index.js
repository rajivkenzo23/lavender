require('dotenv').config();
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const config = require('./config');
const logger = require('./utils/logger');
const { loadPlugins } = require('./handlers/pluginLoader');
const { processMessage } = require('./controllers/messageController');
const { handleGroupEvents, handleMessageDelete, handleCallEvents } = require('./handlers/eventHandler');
const sessionController = require('./controllers/sessionController');

console.log('╔════════════════════════════════════════╗');
console.log('║        🌸 LAVENDER BOT STARTING 🌸       ║');
console.log('╚════════════════════════════════════════╝\n');

// Load plugins
const plugins = loadPlugins();
logger.info(`\n📦 Total plugins loaded: ${plugins.length}\n`);

async function startBot(sessionId = 'main') {
  const sessionPath = `./src/sessions/${sessionId}`;

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['Lavender Bot', 'Chrome', '128.0.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║      📱 SCAN QR CODE WITH WHATSAPP       ║');
      console.log('╚════════════════════════════════════════╝\n');
      qrcode.generate(qr, { small: true });
      console.log('\n');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;

      // Define fatal errors where the session is no longer valid (Logged Out, Unauthorized, Bad Session)
      const isFatalAuthError = reason === DisconnectReason.loggedOut || reason === 401 || reason === 405;
      const shouldReconnect = !isFatalAuthError;

      logger.warn(`Connection closed. Reason: ${reason}`);

      if (shouldReconnect) {
        logger.info('Reconnecting in 5 seconds...');
        setTimeout(() => startBot(sessionId), 5000);
      } else {
        logger.error('Session invalidated or logged out. Clearing corrupted session data...');

        // Auto-delete the corrupted session folder so it doesn't loop forever
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }

        logger.info('Session cleared. Restarting to generate a new QR code...');
        setTimeout(() => startBot(sessionId), 5000);
      }
    } else if (connection === 'open') {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║      ✅ BOT CONNECTED SUCCESSFULLY       ║');
      console.log('╚════════════════════════════════════════╝\n');
      logger.info(`🤖 Bot: ${config.botName}`);
      logger.info(`📌 Prefix: ${config.prefix}`);
      logger.info(`👤 Owner: ${config.ownerNumber}`);
      logger.info(`📱 Session: ${sessionId}`);
      logger.success(`\n✨ Bot is ready to receive commands!\n`);

      sessionController.setSession(sessionId, sock);
    }
  });

  // Message handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      await processMessage(sock, msg, plugins);
    }
  });

  // Call handler
  sock.ev.on('call', async (calls) => {
    await handleCallEvents(sock, calls);
  });

  // Group events handler
  sock.ev.on('group-participants.update', async (event) => {
    await handleGroupEvents(sock, event);
  });

  // Message delete handler
  sock.ev.on('messages.delete', async (event) => {
    await handleMessageDelete(sock, event);
  });
}

// Start bot
startBot().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Terminating...');
  process.exit(0);
});