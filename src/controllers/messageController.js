import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { lang } from '../config/language.js';
import { findPlugin } from '../handlers/pluginLoader.js';
import { isOwner, extractCommand, sleep } from '../utils/helpers.js';

const cooldowns = new Map();
const spamControl = new Map();

export async function handleMessage(sock, msg, plugins, sessionId) {
    try {
        if (!msg.message) return;
        if (msg.key.fromMe && !config.debug) return;

        const messageType = Object.keys(msg.message)[0];
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : from;
        
        // Auto read messages
        if (config.autoRead) {
            await sock.readMessages([msg.key]);
        }

        // Get message body
        let body = '';
        if (messageType === 'conversation') {
            body = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            body = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            body = msg.message.imageMessage.caption || '';
        } else if (messageType === 'videoMessage') {
            body = msg.message.videoMessage.caption || '';
        }

        if (!body) return;

        // Check if message starts with prefix
        if (!body.startsWith(config.prefix)) return;

        // Extract command and arguments
        const { command, args, text } = extractCommand(body, config.prefix);
        if (!command) return;

        logger.info(`Command: ${command} | From: ${sender} | Session: ${sessionId}`);

        // Anti-spam
        if (!isOwner(sender) && checkSpam(sender)) {
            await sock.sendMessage(from, {
                text: lang.get('errors.cooldown').replace('{time}', config.spamTimeout / 1000)
            }, { quoted: msg });
            return;
        }

        // Find and execute plugin
        const plugin = findPlugin(plugins, command);
        
        if (!plugin) return;

        // Check if plugin is enabled
        if (plugin.disabled) return;

        // Check owner only
        if (plugin.ownerOnly && !isOwner(sender)) {
            await sock.sendMessage(from, {
                text: lang.get('admin.ownerOnly')
            }, { quoted: msg });
            return;
        }

        // Check group only
        if (plugin.groupOnly && !isGroup) {
            await sock.sendMessage(from, {
                text: lang.get('group.notGroup')
            }, { quoted: msg });
            return;
        }

        // Check cooldown
        if (!isOwner(sender) && plugin.cooldown) {
            const cooldownKey = `${sender}_${command}`;
            const now = Date.now();
            const cooldownAmount = plugin.cooldown * 1000;

            if (cooldowns.has(cooldownKey)) {
                const expirationTime = cooldowns.get(cooldownKey) + cooldownAmount;
                
                if (now < expirationTime) {
                    const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                    await sock.sendMessage(from, {
                        text: lang.format('errors.cooldown', { time: timeLeft })
                    }, { quoted: msg });
                    return;
                }
            }

            cooldowns.set(cooldownKey, now);
            setTimeout(() => cooldowns.delete(cooldownKey), cooldownAmount);
        }

        // Execute plugin
        try {
            await plugin.execute(sock, msg, { args, text, command, isGroup, sender, sessionId });
        } catch (error) {
            logger.error(`Plugin error (${command}): ${error.message}`);
            await sock.sendMessage(from, {
                text: lang.format('errors.general') + `\n\n${error.message}`
            }, { quoted: msg });
        }

    } catch (error) {
        logger.error(`Message handler error: ${error.message}`);
    }
}

function checkSpam(sender) {
    const now = Date.now();
    const userData = spamControl.get(sender) || { count: 0, lastMessage: now };
    
    if (now - userData.lastMessage < config.spamTimeout) {
        userData.count++;
        
        if (userData.count > config.spamThreshold) {
            spamControl.set(sender, userData);
            return true;
        }
    } else {
        userData.count = 1;
    }
    
    userData.lastMessage = now;
    spamControl.set(sender, userData);
    
    return false;
}
