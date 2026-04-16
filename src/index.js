require('dotenv').config();
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const PREFIX = process.env.BOT_PREFIX || '!';
const OWNER = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';

console.log('🌸 Lavender Bot Starting...\n');

const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');

if (fs.existsSync(pluginDir)) {
  fs.readdirSync(pluginDir).forEach(file => {
    if (file.endsWith('.js')) {
      try {
        const p = require(path.join(pluginDir, file));
        if (p.command) plugins.push(p);
        console.log(`✅ ${file}`);
      } catch (e) {
        console.error(`❌ ${file}:`, e.message);
      }
    }
  });
}

console.log(`\n📦 ${plugins.length} plugins loaded\n`);

async function start(sessionId = 'main') {
  const sessionPath = path.join(__dirname, 'sessions', sessionId);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Lavender', 'Chrome', '128.0.0'],
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'close') {
      const should = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (should) setTimeout(() => start(sessionId), 5000);
    } else if (connection === 'open') {
      console.log('✅ Connected!\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    if (process.env.AUTO_READ === 'true') await sock.readMessages([m.key]);

    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const from = m.key.remoteJid;
    const sender = m.key.participant || from;

    const plugin = plugins.find(p => 
      Array.isArray(p.command) ? p.command.includes(cmd) : p.command === cmd
    );

    if (plugin) {
      if (plugin.ownerOnly && sender !== OWNER) {
        return sock.sendMessage(from, { text: '❌ Owner only!' }, { quoted: m });
      }

      try {
        await plugin.execute(sock, m, args);
      } catch (e) {
        console.error('Plugin error:', e);
        await sock.sendMessage(from, { text: '❌ Error: ' + e.message }, { quoted: m });
      }
    }
  });

  sock.ev.on('call', async (calls) => {
    if (process.env.AUTO_REJECT_CALLS === 'true') {
      for (const call of calls) {
        if (call.status === 'offer') await sock.rejectCall(call.id, call.from);
      }
    }
  });

  sock.ev.on('group-participants.update', async (e) => {
    if (process.env.WELCOME_MESSAGE !== 'true') return;
    const { id, participants, action } = e;
    try {
      const meta = await sock.groupMetadata(id);
      for (const p of participants) {
        if (action === 'add') {
          await sock.sendMessage(id, {
            text: `👋 Welcome to *${meta.subject}*!\n\nHello @${p.split('@')[0]}! 🎉`,
            mentions: [p]
          });
        }
      }
    } catch {}
  });
}

start().catch(console.error);