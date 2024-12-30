const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs'); // <-- Add this line to import the fs module
const NodeCache = require('node-cache');
const videoCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

const app = express();
const port = 3000;

// CORS options
const corsOptions = {
    origin: 'https://alchemistchief.github.io',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200,
};

// Cookies path (set your path correctly)
const cookiesPath = path.resolve(__dirname, 'cookies.txt');

// Check if cookies file exists
if (!fs.existsSync(cookiesPath)) {
    console.error('Cookies file not found:', cookiesPath);
    return;
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/info', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Check cache first
    const cachedData = videoCache.get(videoUrl);
    if (cachedData) {
        console.log('Returning cached video info');
        return res.json(cachedData);
    }

    console.log(`Fetching info for URL: ${videoUrl}`);
    try {
        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: path.resolve(__dirname, 'cookies.txt'),
        });

        const videoData = {
            title: output.title,
            thumbnail: output.thumbnail,
        };

        // Cache the response
        videoCache.set(videoUrl, videoData);

        res.json(videoData);
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
    }
});

app.get('/mp3', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);

    const filePath = path.resolve(__dirname, 'downloads', 'audio.mp3'); // Path to save the file

    youtubedl(videoUrl, {
        format: 'bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: path.resolve(__dirname, 'cookies.txt'),
        output: filePath, // Save the file to the server
    })
    .then(() => {
        res.download(filePath, 'audio.mp3', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to send MP3 file' });
            } else {
                console.log('MP3 file sent successfully');
            }
            fs.unlinkSync(filePath);  // Remove the file after sending it
        });
    })
    .catch((error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP3', details: error.message });
    });
});

app.get('/mp4', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);

    const filePath = path.resolve(__dirname, 'downloads', 'video.mp4'); // Path to save the file

    youtubedl(videoUrl, {
        format: 'bestvideo+bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: path.resolve(__dirname, 'cookies.txt'),
        output: filePath, // Save the file to the server
    })
    .then(() => {
        res.download(filePath, 'video.mp4', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Failed to send MP4 file' });
            } else {
                console.log('MP4 file sent successfully');
            }
            fs.unlinkSync(filePath);  // Remove the file after sending it
        });
    })
    .catch((error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP4', details: error.message });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
