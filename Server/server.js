const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { create: createYoutubeDl } = require('youtube-dl-exec')
const youtubedl = createYoutubeDl(path.resolve(__dirname, '.bin', 'yt-dlp'));

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

// Cache object to store the paths of downloaded files
const fileCache = {};

// Helper function to sanitize filenames
function sanitizeFileName(filename) {
    return filename.replace(/[\\/:*?"<>|]/g, '_'); // Replace illegal characters
}

function scheduleFileDeletion(filePath, fileName, videoUrl) {
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            } else {
                console.log(`Temporary file deleted: ${fileName}`);

                // Remove the file from the cache after deletion
                delete fileCache[videoUrl];
                console.log(`Cache entry removed for: ${videoUrl}`);
            }
        });
    }, 60000); // Delete after 60 seconds
}


// Routes for downloading MP3 and MP4
app.get('/mp3', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);

    // Check if file is cached
    const cachedFile = fileCache[videoUrl];
    if (cachedFile && cachedFile.extension === 'mp3') {
        console.log(`Serving cached MP3 file: ${cachedFile.fileName}`);
        return res.download(cachedFile.filePath, cachedFile.fileName);
    }

    youtubedl(videoUrl, {
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        dumpSingleJson: true,
    })
    .then((info) => {
        const videoTitle = sanitizeFileName(info.title || 'audio');
        const fileName = `${videoTitle}.mp3`;
        const filePath = path.resolve(__dirname, 'downloads', fileName);

        youtubedl(videoUrl, {
            format: 'bestaudio',
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: cookiesPath,
            output: filePath,
        })
        .then(() => {
            console.log(`Download completed: ${fileName}`);

            // Cache the file
            fileCache[videoUrl] = {
                filePath,
                fileName,
                extension: 'mp3'
            };

            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Failed to send MP3 file' });
                } else {
                    console.log(`MP3 file sent successfully: ${fileName}`);
                }
            });

            scheduleFileDeletion(filePath, fileName, videoUrl);
        });
    })
    .catch((error) => {
        console.error('Failed to download video:', error);
        res.status(500).json({ error: 'Failed to download MP3', details: error.message });
    });
});

// Routes for downloading MP3 and MP4
app.get('/mp4', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);

    // Check if file is cached
    const cachedFile = fileCache[videoUrl];
    if (cachedFile && cachedFile.extension === 'mp4') {
        console.log(`Serving cached MP4 file: ${cachedFile.fileName}`);
        return res.download(cachedFile.filePath, cachedFile.fileName);
    }

    youtubedl(videoUrl, {
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        dumpSingleJson: true,
    })
    .then((info) => {
        const videoTitle = sanitizeFileName(info.title || 'video');
        const fileName = `${videoTitle}.mp4`;
        const filePath = path.resolve(__dirname, 'downloads', fileName);

        youtubedl(videoUrl, {
            format: 'bestvideo',
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: cookiesPath,
            output: filePath,
        })
        .then(() => {
            console.log(`Download completed: ${fileName}`);

            // Cache the file
            fileCache[videoUrl] = {
                filePath,
                fileName,
                extension: 'mp4'
            };

            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).json({ error: 'Failed to send MP4 file' });
                } else {
                    console.log(`MP4 file sent successfully: ${fileName}`);
                }
            });

            scheduleFileDeletion(filePath, fileName, videoUrl);
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