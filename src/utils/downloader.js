import axios from 'axios';
import cheerio from 'cheerio';
import ytdl from 'ytdl-core';
import { logger } from './logger.js';

export class Downloader {
    
    // Facebook Downloader
    static async facebook(url) {
        try {
            const response = await axios.post('https://snapsave.app/action.php', 
                `url=${encodeURIComponent(url)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );
            
            const $ = cheerio.load(response.data);
            const downloadLink = $('a[href*="facebook"]').attr('href');
            
            if (!downloadLink) throw new Error('Video not found');
            
            return {
                url: downloadLink,
                title: 'Facebook Video'
            };
        } catch (error) {
            logger.error(`Facebook download error: ${error.message}`);
            throw error;
        }
    }

    // Instagram Downloader
    static async instagram(url) {
        try {
            const apiUrl = `https://api.saveig.app/api/v1/post-info?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            
            if (!response.data.status) throw new Error('Failed to fetch post');
            
            const media = response.data.data.media;
            const result = [];
            
            for (const item of media) {
                result.push({
                    url: item.url,
                    type: item.type,
                    thumbnail: item.thumbnail
                });
            }
            
            return result;
        } catch (error) {
            logger.error(`Instagram download error: ${error.message}`);
            throw error;
        }
    }

    // TikTok Downloader
    static async tiktok(url) {
        try {
            const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            
            if (!response.data.video) throw new Error('Video not found');
            
            return {
                url: response.data.video.noWatermark || response.data.video.watermark,
                title: response.data.title || 'TikTok Video',
                thumbnail: response.data.thumbnail,
                author: response.data.author
            };
        } catch (error) {
            logger.error(`TikTok download error: ${error.message}`);
            throw error;
        }
    }

    // YouTube Downloader
    static async youtube(url, type = 'video') {
        try {
            if (!ytdl.validateURL(url)) throw new Error('Invalid YouTube URL');
            
            const info = await ytdl.getInfo(url);
            const format = type === 'audio' 
                ? ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
                : ytdl.chooseFormat(info.formats, { quality: 'highest' });
            
            return {
                url: format.url,
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[0].url,
                duration: info.videoDetails.lengthSeconds,
                author: info.videoDetails.author.name
            };
        } catch (error) {
            logger.error(`YouTube download error: ${error.message}`);
            throw error;
        }
    }

    // Pinterest Downloader
    static async pinterest(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            const imageUrl = $('meta[property="og:image"]').attr('content');
            const videoUrl = $('meta[property="og:video"]').attr('content');
            
            return {
                url: videoUrl || imageUrl,
                type: videoUrl ? 'video' : 'image',
                title: $('meta[property="og:title"]').attr('content') || 'Pinterest Media'
            };
        } catch (error) {
            logger.error(`Pinterest download error: ${error.message}`);
            throw error;
        }
    }

    // Generic media downloader
    static async downloadMedia(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                maxContentLength: 100 * 1024 * 1024 // 100MB limit
            });
            
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Media download error: ${error.message}`);
            throw error;
        }
    }
}
