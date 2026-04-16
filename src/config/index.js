require('dotenv').config();

module.exports = {
    botName: process.env.BOT_NAME || 'Lavender Bot',
    prefix: process.env.BOT_PREFIX || '!',
    ownerNumber: process.env.OWNER_NUMBER || '',
    ownerName: process.env.OWNER_NAME || 'Owner',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    autoRead: process.env.AUTO_READ === 'true',
    autoViewStatus: process.env.AUTO_VIEW_STATUS === 'true',
    autoRejectCalls: process.env.AUTO_REJECT_CALLS === 'true',
    antiDelete: process.env.ANTI_DELETE === 'true',
    welcomeMessage: process.env.WELCOME_MESSAGE === 'true',
    goodbyeMessage: process.env.GOODBYE_MESSAGE === 'true',
    stickerPackname: process.env.STICKER_PACKNAME || 'Lavender',
    stickerAuthor: process.env.STICKER_AUTHOR || 'Bot',
    debug: process.env.DEBUG === 'true'
};