const axios = require('axios');

module.exports = {
    command: ['ig', 'instagram'],
    description: 'Download Instagram media',

    async execute(sock, m, args) {
        if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: '❌ Provide URL!' }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { text: '⏳ Downloading...' }, { quoted: m });

        try {
            const { data } = await axios.get(`https://api.neoxr.eu/api/ig?url=${encodeURIComponent(args[0])}&apikey=anyakey`);

            if (data.status && data.data) {
                const media = Array.isArray(data.data) ? data.data : [data.data];

                for (const item of media.slice(0, 5)) {
                    const buffer = await axios.get(item.url, { responseType: 'arraybuffer' });
                    const isVideo = item.type === 'video' || item.url.includes('.mp4');

                    if (isVideo) {
                        await sock.sendMessage(m.key.remoteJid, {
                            video: Buffer.from(buffer.data),
                            caption: '✅ *Instagram Video*\n\n_Lavender Bot_'
                        }, { quoted: m });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            image: Buffer.from(buffer.data),
                            caption: '✅ *Instagram Photo*\n\n_Lavender Bot_'
                        }, { quoted: m });
                    }
                }
            } else {
                throw new Error('No media found');
            }
        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed: ' + e.message }, { quoted: m });
        }
    }
};