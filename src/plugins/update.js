const { execSync } = require('child_process');

module.exports = {
    command: ['update'],
    description: 'Update bot from GitHub',
    ownerOnly: true,

    async execute(sock, m, args) {
        const action = args[0];

        if (action === 'check') {
            await sock.sendMessage(m.key.remoteJid, { text: '🔍 Checking...' }, { quoted: m });
            try {
                execSync('git fetch origin');
                const local = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
                const remote = execSync('git rev-parse origin/main', { encoding: 'utf-8' }).trim();

                if (local !== remote) {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: `✨ *Update Available!*\n\n📦 Current: ${local.substring(0, 7)}\n📦 Latest: ${remote.substring(0, 7)}\n\nUse \`!update now\``
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: '✅ Up to date!' }, { quoted: m });
                }
            } catch (e) {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ Error: ' + e.message }, { quoted: m });
            }
        } else if (action === 'now') {
            await sock.sendMessage(m.key.remoteJid, { text: '🔄 Updating...' }, { quoted: m });
            try {
                execSync('git pull origin main');
                await sock.sendMessage(m.key.remoteJid, { text: '✅ Updated! Restarting...' });
                setTimeout(() => process.exit(0), 2000);
            } catch (e) {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed: ' + e.message }, { quoted: m });
            }
        } else {
            await sock.sendMessage(m.key.remoteJid, {
                text: '*Update Commands*\n\n• !update check\n• !update now'
            }, { quoted: m });
        }
    }
};