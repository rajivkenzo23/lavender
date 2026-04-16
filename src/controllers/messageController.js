const config = require('../config');
const logger = require('../utils/logger');
const database = require('../utils/database');
const { handleCommand } = require('../handlers/commandHandler');

async function processMessage(sock, msg, plugins) {
    try {
        if (!msg.message) return;

        const messageType = Object.keys(msg.message)[0];
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;

        // Auto read messages
        if (config.autoRead) {
            await sock.readMessages([msg.key]);
        }

        // Save message for anti-delete
        if (config.antiDelete) {
            saveMessageForAntiDelete(msg);
        }

        // Handle commands
        await handleCommand(sock, msg, plugins);

    } catch (error) {
        logger.error(`Message processing error: ${error.message}`);
    }
}

function saveMessageForAntiDelete(msg) {
    try {
        const messageType = Object.keys(msg.message)[0];
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;

        let messageContent = '';

        if (messageType === 'conversation') {
            messageContent = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            messageContent = msg.message.extendedTextMessage.text;
        } else if (msg.message[messageType]?.caption) {
            messageContent = msg.message[messageType].caption;
        }

        database.saveMessage(msg.key.id, {
            from,
            sender,
            message: messageContent,
            messageType,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error(`Anti-delete save error: ${error.message}`);
    }
}

module.exports = {
    processMessage
};