const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');  // WebSocket for progress updates

const app = express();
const port = 3000;

// CORS options
const corsOptions = {
    origin: 'https://alchemistchief.github.io',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200,
};

// Cookies path
const cookiesPath = path.resolve(__dirname, 'cookies.txt');

// WebSocket server for progress updates
const wss = new WebSocket.Server({ port: 4000 });

// Handle WebSocket connection for progress updates
wss.on('connection', (ws) => {
    console.log('Client connected for progress updates');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

app.use(cors(corsOptions));
app.use(express.json());

app.get('/mp3', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);

    const filePath = path.resolve(__dirname, 'downloads', 'audio.mp3');

    // Track download progress
    const options = {
        format: 'bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        output: filePath,
    };

    const ytdlProcess = youtubedl(videoUrl, options);

    // Listen for download progress
    ytdlProcess.stdout.on('data', (data) => {
        const progressData = data.toString();
        const match = progressData.match(/([0-9.]+)%/); // Regex to extract percentage
        if (match && match[1]) {
            const progress = parseFloat(match[1]);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ progress }));
                }
            });
        }
    });

    // When the download finishes
    ytdlProcess.on('close', () => {
        res.download(filePath, 'audio.mp3', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to send MP3 file' });
            } else {
                console.log('MP3 file sent successfully');
            }
            fs.unlinkSync(filePath); // Clean up the downloaded file
        });
    });

    ytdlProcess.on('error', (error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP3', details: error.message });
    });
});

// Similar logic for MP4 route
app.get('/mp4', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);

    const filePath = path.resolve(__dirname, 'downloads', 'video.mp4');

    const options = {
        format: 'bestvideo+bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        output: filePath,
    };

    const ytdlProcess = youtubedl(videoUrl, options);

    ytdlProcess.stdout.on('data', (data) => {
        const progressData = data.toString();
        const match = progressData.match(/([0-9.]+)%/);
        if (match && match[1]) {
            const progress = parseFloat(match[1]);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ progress }));
                }
            });
        }
    });

    ytdlProcess.on('close', () => {
        res.download(filePath, 'video.mp4', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to send MP4 file' });
            } else {
                console.log('MP4 file sent successfully');
            }
            fs.unlinkSync(filePath); // Clean up the downloaded file
        });
    });

    ytdlProcess.on('error', (error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP4', details: error.message });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
