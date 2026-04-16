const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class SessionController {
    constructor() {
        this.sessions = new Map();
        this.sessionDir = path.join(__dirname, '../sessions');
    }

    async createSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            logger.warn(`Session ${sessionId} already exists`);
            return false;
        }

        const sessionPath = path.join(this.sessionDir, sessionId);

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        logger.info(`Session ${sessionId} created`);
        return true;
    }

    async removeSession(sessionId) {
        const sessionPath = path.join(this.sessionDir, sessionId);

        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            this.sessions.delete(sessionId);
            logger.info(`Session ${sessionId} removed`);
            return true;
        }

        return false;
    }

    async listSessions() {
        if (!fs.existsSync(this.sessionDir)) {
            return [];
        }

        return fs.readdirSync(this.sessionDir).filter(dir =>
            fs.statSync(path.join(this.sessionDir, dir)).isDirectory() &&
            dir !== '.gitkeep'
        );
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    setSession(sessionId, sock) {
        this.sessions.set(sessionId, sock);
    }

    getAllSessions() {
        return Array.from(this.sessions.entries()).map(([id, sock]) => ({
            id,
            connected: sock.user ? true : false,
            number: sock.user?.id || 'Not connected'
        }));
    }
}

module.exports = new SessionController();