const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, '../plugins');

    if (!fs.existsSync(pluginDir)) {
        logger.warn('Plugins directory not found!');
        return plugins;
    }

    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

    files.forEach(file => {
        try {
            const plugin = require(path.join(pluginDir, file));

            if (plugin.command) {
                plugins.push(plugin);
                logger.success(`Loaded: ${file}`);
            } else {
                logger.warn(`Invalid plugin: ${file}`);
            }
        } catch (error) {
            logger.error(`Failed to load ${file}: ${error.message}`);
        }
    });

    return plugins;
}

function findPlugin(plugins, command) {
    return plugins.find(p => {
        if (Array.isArray(p.command)) {
            return p.command.includes(command);
        }
        return p.command === command;
    });
}

function reloadPlugins() {
    // Clear require cache for plugins
    const pluginDir = path.join(__dirname, '../plugins');

    Object.keys(require.cache).forEach(key => {
        if (key.includes(pluginDir)) {
            delete require.cache[key];
        }
    });

    return loadPlugins();
}

module.exports = {
    loadPlugins,
    findPlugin,
    reloadPlugins
};