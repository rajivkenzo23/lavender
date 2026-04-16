module.exports = {
    command: ['ping', 'speed'],
    description: 'Check bot speed',

    async execute(sock, m) {
        const start = Date.now();
        await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pinging...' }, { quoted: m });
        const latency = Date.now() - start;
        await sock.sendMessage(m.key.remoteJid, {
            text: `🏓 *Pong!*\n\n⚡ Speed: ${latency}ms\n💻 Uptime: ${Math.floor(process.uptime())}s`
        }, { quoted: m });
    }
};