const axios = require('axios');

module.exports = {
    command: ['tiktok', 'tt'],
    description: 'Download TikTok video',

    async execute(sock, m, args) {
        if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: '❌ Provide URL!' }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { text: '⏳ Downloading...' }, { quoted: m });

        try {
            const { data } = await axios.get(`https://api.neoxr.eu/api/tiktok?url=${encodeURIComponent(args[0])}&apikey=anyakey`);

            if (data.status && data.data) {
                const videoUrl = data.data.video?.noWatermark || data.data.video?.watermark || data.data.play;
                const buffer = await axios.get(videoUrl, { responseType: 'arraybuffer' });

                await sock.sendMessage(m.key.remoteJid, {
                    video: Buffer.from(buffer.data),
                    caption: `✅ *TikTok Video*\n\n👤 ${data.data.author?.nickname || 'Unknown'}\n\n_No Watermark • Lavender Bot_`,
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