const config = require('../config');
const logger = require('../utils/logger');
const { isOwner } = require('../utils/helpers');
const { findPlugin } = require('./pluginLoader');

const cooldowns = new Map();
const spamControl = new Map();

async function handleCommand(sock, msg, plugins) {
    try {
        if (!msg.message) return;
        if (msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        const isGroup = from.endsWith('@g.us');

        // Get message text
        const messageType = Object.keys(msg.message)[0];
        let bodyText = '';

        if (messageType === 'conversation') {
            bodyText = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            bodyText = msg.message.extendedTextMessage.text;
        } else if (msg.message[messageType]?.caption) {
            bodyText = msg.message[messageType].caption;
        }

        if (!bodyText || !bodyText.startsWith(config.prefix)) return;

        // Extract command and args
        const args = bodyText.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        logger.info(`Command: ${command} | From: ${sender.split('@')[0]} | Group: ${isGroup}`);

        // Anti-spam check
        if (!isOwner(sender) && checkSpam(sender)) {
            await sock.sendMessage(from, {
                text: '⚠️ Slow down! Wait a few seconds.'
            }, { quoted: msg });
            return;
        }

        // Find plugin
        const plugin = findPlugin(plugins, command);

        if (!plugin) return;

        // Check if plugin is disabled
        if (plugin.disabled) return;

        // Check owner only
        if (plugin.ownerOnly && !isOwner(sender)) {
            await sock.sendMessage(from, {
                text: '⛔ This command is for owner only!'
            }, { quoted: msg });
            return;
        }

        // Check group only
        if (plugin.groupOnly && !isGroup) {
            await sock.sendMessage(from, {
                text: '⛔ This command can only be used in groups!'
            }, { quoted: msg });
            return;
        }

        // Check admin only (group)
        if (plugin.adminOnly && isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            const participant = participants.find(p => p.id === sender);

            if (!participant || (!participant.admin && !participant.superAdmin)) {
                await sock.sendMessage(from, {
                    text: '⛔ This command is for group admins only!'
                }, { quoted: msg });
                return;
            }
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
                        text: `⏳ Please wait ${timeLeft} seconds before using this command again.`
                    }, { quoted: msg });
                    return;
                }
            }

            cooldowns.set(cooldownKey, now);
            setTimeout(() => cooldowns.delete(cooldownKey), cooldownAmount);
        }

        // Execute plugin
        try {
            await plugin.execute(sock, msg, args, { from, sender, isGroup, command });
        } catch (error) {
            logger.error(`Plugin error (${command}): ${error.message}`);
            await sock.sendMessage(from, {
                text: `❌ Error executing command:\n${error.message}`
            }, { quoted: msg });
        }

    } catch (error) {
        logger.error(`Command handler error: ${error.message}`);
    }
}

function checkSpam(sender) {
    const now = Date.now();
    const userData = spamControl.get(sender) || { count: 0, lastMessage: now };

    const spamThreshold = 5;
    const spamTimeout = 10000; // 10 seconds

    if (now - userData.lastMessage < spamTimeout) {
        userData.count++;

        if (userData.count > spamThreshold) {
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

module.exports = {
    handleCommand
};