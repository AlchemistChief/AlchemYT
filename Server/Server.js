const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');

const app = express();
const port = 3000;

// CORS options
const corsOptions = {
    origin: 'https://alchemistchief.github.io',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Load cookies from the file
const cookiesFilePath = './cookies.json'; // Path to cookies file

// Routes
app.get('/info', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`Info endpoint hit. URL: ${videoUrl}`);

    try {
        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            cookieFile: cookiesFilePath, // Use cookies here
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        });

        res.json({
            title: output.title,
            thumbnail: output.thumbnail,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
    }
});

app.get('/mp3', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);

    youtubedl(videoUrl, {
        format: 'bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        cookieFile: cookiesFilePath, // Use cookies here
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
    })
    .pipe(res)
    .on('finish', () => {
        console.log('MP3 streaming completed');
    })
    .on('error', (err) => {
        console.log('Error while streaming MP3:', err);
        res.status(500).json({ error: 'Failed to stream MP3', details: err.message });
    });
});

app.get('/mp4', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);

    youtubedl(videoUrl, {
        format: 'bestvideo+bestaudio',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        cookieFile: cookiesFilePath, // Use cookies here
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
    })
    .pipe(res)
    .on('finish', () => {
        console.log('MP4 streaming completed');
    })
    .on('error', (err) => {
        console.log('Error while streaming MP4:', err);
        res.status(500).json({ error: 'Failed to stream MP4', details: err.message });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
