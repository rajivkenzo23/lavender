const config = require('../config');

module.exports = {
    isOwner: (jid) => {
        const number = jid.split('@')[0];
        return number === config.ownerNumber;
    },

    extractCommand: (text, prefix) => {
        const args = text.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        return { command, args, text: args.join(' ') };
    },

    formatNumber: (number) => {
        return number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    },

    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    formatBytes: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    runtime: (seconds) => {
        seconds = Number(seconds);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);

        const dDisplay = d > 0 ? d + 'd ' : '';
        const hDisplay = h > 0 ? h + 'h ' : '';
        const mDisplay = m > 0 ? m + 'm ' : '';
        const sDisplay = s > 0 ? s + 's' : '';

        return dDisplay + hDisplay + mDisplay + sDisplay;
    },

    isUrl: (text) => {
        return /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i.test(text);
    }
};