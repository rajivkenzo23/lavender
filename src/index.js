require('dotenv').config();
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const logger = require('./utils/logger');
const { loadPlugins } = require('./handlers/pluginLoader');
const { processMessage } = require('./controllers/messageController');
const { handleGroupEvents, handleMessageDelete, handleCallEvents } = require('./handlers/eventHandler');
const sessionController = require('./controllers/sessionController');

console.log('╔════════════════════════════════════════╗');
console.log('║       🌸 LAVENDER BOT STARTING 🌸      ║');
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
    printQRInTerminal: true,
    auth: state,
    browser: ['Lavender Bot', 'Chrome', '128.0.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 SCAN THE QR CODE ABOVE TO LOGIN\n');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      logger.warn(`Connection closed. Reason: ${reason}`);

      if (shouldReconnect) {
        logger.info('Reconnecting in 5 seconds...');
        setTimeout(() => startBot(sessionId), 5000);
      } else {
        logger.error('Logged out. Please delete session and restart.');
      }
    } else if (connection === 'open') {
      logger.success('╔════════════════════════════════════════╗');
      logger.success('║     ✅ BOT CONNECTED SUCCESSFULLY      ║');
      logger.success('╚════════════════════════════════════════╝');
      logger.info(`\n🤖 Bot: ${config.botName}`);
      logger.info(`📌 Prefix: ${config.prefix}`);
      logger.info(`👤 Owner: ${config.ownerNumber}`);
      logger.info(`📱 Session: ${sessionId}`);
      logger.info(`\n✨ Bot is ready!\n`);

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
  process.exit(1);
});