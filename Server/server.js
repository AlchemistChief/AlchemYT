// Server.js - https://alchemyt.onrender.com
const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const host = 'https://alchemyt.onrender.com'; // Update the host for Render deployment

// CORS options
const corsOptions = {
    origin: 'https://alchemistchief.github.io',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200,
};

// Cookies path
const cookiesPath = path.resolve(__dirname, 'cookies.txt');
if (!fs.existsSync(cookiesPath)) {
    console.error('Cookies file not found:', cookiesPath);
    return;
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Signal handling
process.on('SIGINT', () => {
    console.log('[SIGINT] Received Signal Interrupt signal');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[SIGTERM] Received Signal Terminate signal');
    process.exit(0);
});

// Routes for downloading MP3 and MP4
app.get('/mp3', (req, res) => {
    const startTime = Date.now();
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);

    const downloadStart = Date.now();
    youtubedl(videoUrl, {
        format: 'bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        getFilename: true,
    })
    .then((output) => {
        console.log('YouTube-DL Output:', output); // Debug output
        const match = output.match(/Destination: (.+)$/m);
        if (!match) {
            throw new Error('Failed to extract filename from YouTube-DL output.');
        }
        const fileName = match[1];
        const filePath = path.resolve(__dirname, 'downloads', fileName);
    

        const downloadEnd = Date.now();
        console.log(`Download completed in ${downloadEnd - downloadStart} ms`);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to send MP3 file' });
            } else {
                console.log(`MP3 file sent successfully in ${Date.now() - startTime} ms`);
            }
        });

        res.on('finish', () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                } else {
                    console.log('Temporary MP3 file deleted successfully.');
                }
            });
        });
    })
    .catch((error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP3', details: error.message });
    });
});

app.get('/mp4', (req, res) => {
    const startTime = Date.now();
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);

    const downloadStart = Date.now();
    youtubedl(videoUrl, {
        format: 'bestvideo+bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        getFilename: true,
    })
    .then((output) => {
        console.log('YouTube-DL Output:', output); // Debug output
        const match = output.match(/Destination: (.+)$/m);
        if (!match) {
            throw new Error('Failed to extract filename from YouTube-DL output.');
        }
        const fileName = match[1];
        const filePath = path.resolve(__dirname, 'downloads', fileName);
    

        const downloadEnd = Date.now();
        console.log(`Download completed in ${downloadEnd - downloadStart} ms`);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to send MP4 file' });
            } else {
                console.log(`MP4 file sent successfully in ${Date.now() - startTime} ms`);
            }
        });

        res.on('finish', () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                } else {
                    console.log('Temporary MP4 file deleted successfully.');
                }
            });
        });
    })
    .catch((error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP4', details: error.message });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at ${host}`);
});
