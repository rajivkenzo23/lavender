const fs = require('fs');
const path = require('path');
const config = require('./index');

class Language {
    constructor() {
        this.languages = {};
        this.load();
    }

    load() {
        const dir = path.join(__dirname, '../languages');
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith('.json')) {
                const lang = file.replace('.json', '');
                this.languages[lang] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
            }
        });
    }

    get(key, lang = config.defaultLanguage) {
        const l = this.languages[lang] || this.languages['en'];
        const keys = key.split('.');
        let val = l;
        for (const k of keys) val = val?.[k];
        return val || key;
    }
}

module.exports = new Language();