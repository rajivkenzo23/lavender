const sharp = require('sharp');

module.exports = {
    command: ['sticker', 's', 'stiker'],
    description: 'Create sticker from image/video',

    async execute(sock, m) {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.imageMessage && !quoted?.videoMessage) {
            return sock.sendMessage(m.key.remoteJid, {
                text: '❌ Reply to image/video!'
            }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, { text: '🎨 Creating...' }, { quoted: m });

        try {
            const buffer = await sock.downloadMediaMessage({ message: quoted });
            const sticker = await sharp(buffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 100 })
                .toBuffer();

            await sock.sendMessage(m.key.remoteJid, { sticker }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed!' }, { quoted: m });
        }
    }
};