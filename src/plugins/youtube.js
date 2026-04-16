const ytdl = require('ytdl-core');

module.exports = {
    command: ['ytmp3', 'ytmp4', 'yta', 'ytv'],
    description: 'Download YouTube media',

    async execute(sock, m, args) {
        if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: '❌ Provide URL!' }, { quoted: m });

        const url = args[0];
        const isVideo = this.command.includes('ytmp4') || this.command.includes('ytv');

        if (!ytdl.validateURL(url)) {
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Invalid YouTube URL!' }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, { text: `⏳ Downloading ${isVideo ? 'video' : 'audio'}...` }, { quoted: m });

        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;
            const author = info.videoDetails.author.name;
            const duration = parseInt(info.videoDetails.lengthSeconds);

            if (duration > (isVideo ? 600 : 1200)) {
                return sock.sendMessage(m.key.remoteJid, { text: '❌ Too long!' }, { quoted: m });
            }

            const format = isVideo ?
                ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' }) :
                ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

            const stream = ytdl(url, { format });
            const chunks = [];

            stream.on('data', chunk => chunks.push(chunk));
            await new Promise((res, rej) => {
                stream.on('end', res);
                stream.on('error', rej);
            });

            const buffer = Buffer.concat(chunks);

            if (isVideo) {
                await sock.sendMessage(m.key.remoteJid, {
                    video: buffer,
                    caption: `✅ *${title}*\n\n👤 ${author}\n\n_Lavender Bot_`,
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`
                }, { quoted: m });
            }
        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed: ' + e.message }, { quoted: m });
        }
    }
};