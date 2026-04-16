const axios = require('axios');

module.exports = {
    command: ['fb', 'facebook'],
    description: 'Download Facebook video',

    async execute(sock, m, args) {
        if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: '❌ Provide URL!' }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { text: '⏳ Downloading...' }, { quoted: m });

        try {
            const { data } = await axios.get(`https://api.neoxr.eu/api/fb?url=${encodeURIComponent(args[0])}&apikey=anyakey`);

            if (data.status && data.data) {
                const videoUrl = data.data.url || data.data[0]?.url;
                const videoBuffer = await axios.get(videoUrl, { responseType: 'arraybuffer' });

                await sock.sendMessage(m.key.remoteJid, {
                    video: Buffer.from(videoBuffer.data),
                    caption: '✅ *Facebook Video*\n\n_Lavender Bot_',
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                throw new Error('No video found');
            }
        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed: ' + e.message }, { quoted: m });
        }
    }
};