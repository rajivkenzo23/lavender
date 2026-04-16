const config = require('../config');

module.exports = {
    command: ['menu', 'help'],
    description: 'Show all commands',

    async execute(sock, m) {
        const menu = `╔═══ *${config.botName}* ═══╗

📋 *GENERAL*
• ${config.prefix}menu - Show commands
• ${config.prefix}ping - Check speed
• ${config.prefix}owner - Owner contact

🎨 *STICKER*
• ${config.prefix}sticker - Reply to image/video
• ${config.prefix}s - Short command

📥 *DOWNLOADERS*
• ${config.prefix}fb <url> - Facebook video
• ${config.prefix}ig <url> - Instagram media
• ${config.prefix}tiktok <url> - TikTok (no watermark)
• ${config.prefix}ytmp3 <url> - YouTube audio
• ${config.prefix}ytmp4 <url> - YouTube video

⚙️ *OWNER ONLY*
• ${config.prefix}update check - Check updates
• ${config.prefix}update now - Update bot

╚════════════════════╝

*Prefix:* ${config.prefix}
*Owner:* ${config.ownerName}
*Version:* 2.1.0`;

        await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m });
    }
};