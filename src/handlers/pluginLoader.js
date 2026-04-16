import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, '../plugins');
    
    async function loadFromDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                await loadFromDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                try {
                    const plugin = await import(`file://${fullPath}`);
                    
                    if (plugin.default && plugin.default.command) {
                        plugins.push(plugin.default);
                        logger.debug(`Loaded plugin: ${plugin.default.command}`);
                    }
                } catch (error) {
                    logger.error(`Failed to load plugin ${item}: ${error.message}`);
                }
            }
        }
    }
    
    await loadFromDirectory(pluginDir);
    return plugins;
}

export function findPlugin(plugins, command) {
    return plugins.find(p => {
        if (Array.isArray(p.command)) {
            return p.command.includes(command);
        }
        return p.command === command;
    });
}
