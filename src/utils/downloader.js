const axios = require('axios');

class Downloader {
    static async downloadMedia(url, maxSize = 100 * 1024 * 1024) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                maxContentLength: maxSize
            });
            return Buffer.from(response.data);
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    static async getVideoInfo(url) {
        try {
            const response = await axios.head(url);
            return {
                size: parseInt(response.headers['content-length']),
                type: response.headers['content-type']
            };
        } catch (error) {
            return null;
        }
    }
}

module.exports = Downloader;