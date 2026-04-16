const config = require('../config');

class Logger {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            cyan: '\x1b[36m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            red: '\x1b[31m',
            magenta: '\x1b[35m'
        };
    }

    info(message) {
        console.log(`${this.colors.cyan}[INFO]${this.colors.reset} ${message}`);
    }

    success(message) {
        console.log(`${this.colors.green}[SUCCESS]${this.colors.reset} ${message}`);
    }

    warn(message) {
        console.log(`${this.colors.yellow}[WARN]${this.colors.reset} ${message}`);
    }

    error(message) {
        console.log(`${this.colors.red}[ERROR]${this.colors.reset} ${message}`);
    }

    debug(message) {
        if (config.debug) {
            console.log(`${this.colors.magenta}[DEBUG]${this.colors.reset} ${message}`);
        }
    }
}

module.exports = new Logger();