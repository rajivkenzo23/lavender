import { config } from '../config/index.js';
import { lang } from '../config/language.js';
import { logger } from '../utils/logger.js';
import { Database } from '../utils/database.js';

const db = new Database();

export async function handleEvents(sock, event, type) {
    try {
        switch (type) {
            case 'group-participants':
                await handleGroupParticipants(sock, event);
                break;
            case 'message-delete':
                await handleMessageDelete(sock, event);
                break;
            default:
                break;
        }
    } catch (error) {
        logger.error(`Event handler error: ${error.message}`);
    }
}

async function handleGroupParticipants(sock, event) {
    const { id, participants, action } = event;
    
    if (!config.welcomeMessage && !config.goodbyeMessage) return;
    
    try {
        const groupMetadata = await sock.groupMetadata(id);
        
        for (const participant of participants) {
            const name = participant.split('@')[0];
            
            if (action === 'add' && config.welcomeMessage) {
                const welcomeText = lang.format('group.welcome', {
                    user: `@${name}`,
                    message: groupMetadata.subject
                });
                
                await sock.sendMessage(id, {
                    text: welcomeText,
                    mentions: [participant]
                });
                
                logger.info(`Welcome message sent to ${name} in ${groupMetadata.subject}`);
            } else if ((action === 'remove' || action === 'leave') && config.goodbyeMessage) {
                const goodbyeText = lang.format('group.goodbye', {
                    user: `@${name}`,
                    message: 'Thank you for being part of this group!'
                });
                
                await sock.sendMessage(id, {
                    text: goodbyeText,
                    mentions: [participant]
                });
                
                logger.info(`Goodbye message sent for ${name} in ${groupMetadata.subject}`);
            }
        }
    } catch (error) {
        logger.error(`Group participant handler error: ${error.message}`);
    }
}

async function handleMessageDelete(sock, event) {
    if (!config.antiDelete) return;
    
    try {
        const deletedMessages = event.keys || [];
        
        for (const key of deletedMessages) {
            const deleted = await db.getDeletedMessage(key.id);
            
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
                
                // If there was media, resend it
                if (deleted.media) {
                    // Implementation depends on your storage strategy
                }
                
                logger.info(`Anti-delete triggered for message from ${deleted.sender}`);
            }
        }
    } catch (error) {
        logger.error(`Message delete handler error: ${error.message}`);
    }
}
