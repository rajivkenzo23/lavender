const config = require('../config');
const logger = require('../utils/logger');
const database = require('../utils/database');

async function handleGroupEvents(sock, event) {
    try {
        const { id, participants, action } = event;

        if (!config.welcomeMessage && !config.goodbyeMessage) return;

        const groupMetadata = await sock.groupMetadata(id);

        for (const participant of participants) {
            const name = participant.split('@')[0];

            if (action === 'add' && config.welcomeMessage) {
                const welcomeText = `👋 *Welcome to ${groupMetadata.subject}!*\n\n` +
                    `Hello @${name}! 🎉\n\n` +
                    `Enjoy your stay and read the group rules!`;

                await sock.sendMessage(id, {
                    text: welcomeText,
                    mentions: [participant]
                });

                logger.info(`Welcome message sent to ${name} in ${groupMetadata.subject}`);
            }
            else if ((action === 'remove' || action === 'leave') && config.goodbyeMessage) {
                const goodbyeText = `👋 *Goodbye!*\n\n` +
                    `@${name} has left the group.\n\n` +
                    `Thank you for being part of *${groupMetadata.subject}*!`;

                await sock.sendMessage(id, {
                    text: goodbyeText,
                    mentions: [participant]
                });

                logger.info(`Goodbye message sent for ${name} in ${groupMetadata.subject}`);
            }
        }
    } catch (error) {
        logger.error(`Group event error: ${error.message}`);
    }
}

async function handleMessageDelete(sock, event) {
    if (!config.antiDelete) return;

    try {
        const deletedMessages = event.keys || [];

        for (const key of deletedMessages) {
            const deleted = database.getDeletedMessage(key.id);

            if (deleted) {
                const from = key.remoteJid;
                const messageInfo = `*🔴 ANTI-DELETE MESSAGE*\n\n` +
                    `*From:* @${deleted.sender.split('@')[0]}\n` +
                    `*Deleted at:* ${new Date().toLocaleString()}\n\n` +
                    `*Message:* ${deleted.message}`;

                await sock.sendMessage(from, {
                    text: messageInfo,
                    mentions: [deleted.sender]
                });

                logger.info(`Anti-delete triggered for message from ${deleted.sender}`);
            }
        }
    } catch (error) {
        logger.error(`Message delete handler error: ${error.message}`);
    }
}

async function handleCallEvents(sock, calls) {
    if (!config.autoRejectCalls) return;

    try {
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                logger.info(`Rejected call from ${call.from}`);

                // Notify caller
                await sock.sendMessage(call.from, {
                    text: '📵 *Auto Call Reject*\n\nSorry, this bot automatically rejects all calls.\nPlease send a text message instead.'
                });
            }
        }
    } catch (error) {
        logger.error(`Call event error: ${error.message}`);
    }
}

module.exports = {
    handleGroupEvents,
    handleMessageDelete,
    handleCallEvents
};