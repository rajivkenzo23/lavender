import fs from 'fs';
import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export class Database {
    constructor() {
        this.dataDir = './src/data';
        this.settingsFile = `${this.dataDir}/settings.json`;
        this.antiDeleteFile = `${this.dataDir}/antidelete.json`;
        this.useMongoDB = !!config.mongodbUri;
    }

    async init() {
        if (this.useMongoDB) {
            try {
                await mongoose.connect(config.mongodbUri);
                logger.success('Connected to MongoDB');
            } catch (error) {
                logger.error(`MongoDB connection failed: ${error.message}`);
                logger.info('Falling back to JSON storage');
                this.useMongoDB = false;
            }
        }

        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        // Initialize JSON files
        if (!fs.existsSync(this.settingsFile)) {
            fs.writeFileSync(this.settingsFile, JSON.stringify({}));
        }
        if (!fs.existsSync(this.antiDeleteFile)) {
            fs.writeFileSync(this.antiDeleteFile, JSON.stringify({}));
        }
    }

    readJSON(file) {
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        } catch {
            return {};
        }
    }

    writeJSON(file, data) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }

    // Settings
    getSetting(key) {
        const data = this.readJSON(this.settingsFile);
        return data[key];
    }

    setSetting(key, value) {
        const data = this.readJSON(this.settingsFile);
        data[key] = value;
        this.writeJSON(this.settingsFile, data);
    }

    // Anti-delete
    saveMessage(messageId, messageData) {
        const data = this.readJSON(this.antiDeleteFile);
        data[messageId] = {
            ...messageData,
            timestamp: Date.now()
        };
        this.writeJSON(this.antiDeleteFile, data);

        // Clean old messages (older than 24 hours)
        this.cleanOldMessages();
    }

    getDeletedMessage(messageId) {
        const data = this.readJSON(this.antiDeleteFile);
        return data[messageId];
    }

    cleanOldMessages() {
        const data = this.readJSON(this.antiDeleteFile);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        let cleaned = false;
        Object.keys(data).forEach(key => {
            if (now - data[key].timestamp > oneDay) {
                delete data[key];
                cleaned = true;
            }
        });

        if (cleaned) {
            this.writeJSON(this.antiDeleteFile, data);
        }
    }
}
