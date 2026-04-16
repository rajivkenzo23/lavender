const config = require('../config');

module.exports = {
    command: ['owner', 'creator'],
    description: 'Get owner contact',

    async execute(sock, m) {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${config.ownerName}
ORG:Lavender Bot
TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}
END:VCARD`;

        await sock.sendMessage(m.key.remoteJid, {
            contacts: {
                displayName: config.ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: m });
    }
};