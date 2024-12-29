const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const path = require('path');

const app = express();
const port = 3000;

// CORS options
const corsOptions = {
    origin: 'https://alchemistchief.github.io',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200,
};

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
    console.log(`Info endpoint hit. URL: ${videoUrl}`);

    try {
        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: path.resolve(__dirname, 'cookies.txt')  // Use cookies.txt instead of cookies.json
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
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: path.resolve(__dirname, 'cookies.txt')  // Use cookies.txt instead of cookies.json
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
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: path.resolve(__dirname, 'cookies.txt')  // Use cookies.txt instead of cookies.json
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
