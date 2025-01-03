// server.js - BACKEND - Never remove
const express = require('express');
const archiver = require('archiver');
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
    console.log(`Scheduling deletion for file: ${fileName}, Path: ${filePath}`);
    
    setTimeout(() => {
        console.log(`Checking if file exists before deletion: ${filePath}`);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                } else {
                    console.log(`Temporary file deleted: ${fileName}`);
                    delete fileCache[videoUrl];
                    console.log(`Cache entry removed for: ${videoUrl}`);
                }
            });
        } else {
            console.log(`File does not exist at time of deletion: ${filePath}`);
        }
    }, 60000); // Delete after 60 seconds
}
// Function to delete a directory and all its contents with existence check
function deleteDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.rm(directoryPath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error(`Error deleting directory ${directoryPath}:`, err);
            } else {
                console.log(`Directory and its contents deleted successfully: ${directoryPath}`);
            }
        });
    } else {
        console.error(`Directory does not exist: ${directoryPath}`);
    }
}

// Routes for downloading MP3
app.get('/mp3', (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);

    // Check if file is cached
    const cachedFile = fileCache[videoUrl];
    if (cachedFile && cachedFile.extension === 'mp3') {
        console.log(`Serving cached MP3 file: ${cachedFile.fileName}, Path: ${cachedFile.filePath}`);
        return res.download(cachedFile.filePath, cachedFile.fileName);
    }

    console.log('No cached file found, starting new download...');

    youtubedl(videoUrl, {
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        dumpSingleJson: true,
    })
    .then((info) => {
        const videoTitle = sanitizeFileName(info.title || 'audio');
        const fileName = `${videoTitle}.mp3`;
        const filePath = path.join(process.cwd(), 'downloads', fileName);

        console.log(`Downloading MP3: ${fileName}, Path: ${filePath}`);

        // Send initial SSE response headers
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');

        const process = youtubedl(videoUrl, {
            format: 'bestaudio[ext=mp3]/bestaudio[ext=m4a]',
            noCheckCertificates: true,
            noPlaylist: true,
            noWarnings: true,
            progress: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: cookiesPath,
            output: filePath,
        });
        // Start streaming response for progress updates
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Track progress using the library's progress option
        process.on('progress', (progress) => {
            console.log(
                `Progress: ${progress.percent}% - Downloaded: ${progress.size} at ${progress.speed}`
            );
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        });

        process.then(() => {
            console.log(`MP3 download completed: ${fileName}`);

            // Cache the file
            fileCache[videoUrl] = {
                filePath,
                fileName,
                extension: 'mp3',
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
        console.error('Failed to download MP3:', error);
        res.status(500).json({ error: 'Failed to download MP3', details: error.message });
    });
});

// Routes for downloading MP4
app.get('/mp4', (req, res) => {
    const videoUrl = req.query.url;
    const resolution = req.query.resolution || '1080p' || '720p' || '480p';  // Default to '1080p' if no resolution is specified

    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log(`MP4 download endpoint hit. URL: ${videoUrl}, Resolution: ${resolution}`);

    // Check if file is cached
    const cachedFile = fileCache[videoUrl] && fileCache[videoUrl][resolution];
    if (cachedFile && cachedFile.extension === 'mp4') {
        console.log(`Serving cached MP4 file: ${cachedFile.fileName}, Resolution: ${resolution}, Path: ${cachedFile.filePath}`);
        return res.download(cachedFile.filePath, cachedFile.fileName);
    }

    console.log('No cached file found, starting new download...');

    youtubedl(videoUrl, {
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        dumpSingleJson: true,
    })
    .then((info) => {
        const videoTitle = sanitizeFileName(info.title || 'video');
        const fileName = `${videoTitle}_${resolution}.mp4`;  // Use the title and resolution for the filename
        const filePath = path.join(process.cwd(), 'downloads', fileName);

        console.log(`Downloading MP4: ${fileName}, Path: ${filePath}`);

        youtubedl(videoUrl, {
            format: `bv*[vcodec=h264][height=${resolution.replace('p', '')}][ext=mp4]+ba[acodec=aac][ext=m4a]/best`,
            formatSort: `vcodec:h264,res:${resolution},ext:mp4,acodec:aac`,            
            noCheckCertificates: true,
            writeThumbnail: true,
            noPlaylist: true,
            noWarnings: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: cookiesPath,
            output: filePath,
        })
        .stdout.on('progress', (progress) => {
            console.log(`Progress: ${progress.percent}% - Downloaded: ${progress.current} of ${progress.total}`);
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        })
        .then(() => {
            console.log(`MP4 download completed: ${fileName}`);

            // Cache the file by video URL and resolution
            if (!fileCache[videoUrl]) {
                fileCache[videoUrl] = {}; // Initialize video URL cache if it doesn't exist
            }
            fileCache[videoUrl][resolution] = {
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
        console.error('Failed to download MP4:', error);
        res.status(500).json({ error: 'Failed to download MP4', details: error.message });
    });
});

// Routes for downloading Playlist as MP3
app.get('/playlist', (req, res) => {
    const playlistUrl = req.query.url;

    if (!playlistUrl) {
        return res.status(400).json({ error: 'YouTube Playlist URL is required' });
    }
    console.log(`Playlist download endpoint hit. URL: ${playlistUrl}`);

    // Check if file is cached
    const cachedFile = fileCache[playlistUrl];
    if (cachedFile && cachedFile.extension === 'zip') {
        console.log(`Serving cached ZIP file: ${cachedFile.fileName}, Path: ${cachedFile.filePath}`);
        return res.download(cachedFile.filePath, cachedFile.fileName);
    }

    console.log('No cached playlist found, starting new download...');

    // Get playlist information using yt-dlp
    youtubedl(playlistUrl, {
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        cookies: cookiesPath,
        dumpSingleJson: true,
    })
    .then((info) => {
        const playlistTitle = sanitizeFileName(info.title || 'playlist');
        const playlistPath = path.join(process.cwd(), 'downloads', playlistTitle);

        console.log(`Downloading Playlist: ${playlistTitle}, Path: ${playlistPath}`);

        // Download each video as MP3
        youtubedl(playlistUrl, {
            format: 'bestaudio[ext=mp3]/bestaudio[ext=m4a]',
            noCheckCertificates: true,
            writeThumbnail: true,
            yesPlaylist: true,
            noWarnings: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            cookies: cookiesPath,
            output: path.join(playlistPath, `%(title)s.%(ext)s`),
        })
        .stdout.on('progress', (progress) => {
            console.log(`Progress: ${progress.percent}% - Downloaded: ${progress.current} of ${progress.total}`);
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        })
        .then(() => {
            console.log(`Playlist download completed: ${playlistTitle}`);

            // Use Archiver to zip the MP3 files
            const zipFilePath = path.join(process.cwd(), 'downloads', `${playlistTitle}.zip`);
            const archive = archiver('zip', {zlib:{level: 0 }});

            const output = fs.createWriteStream(zipFilePath);
            archive.pipe(output);

            // Add MP3 files to the ZIP
            archive.directory(playlistPath, false);

            archive.finalize();

            output.on('close', () => {
                console.log(`ZIP file created: ${zipFilePath}`);

                // Cache the zip file by playlist URL
                fileCache[playlistUrl] = {
                    filePath: zipFilePath,
                    fileName: `${playlistTitle}.zip`,
                    extension: 'zip'
                };

                res.download(zipFilePath, `${playlistTitle}.zip`, (err) => {
                    if (err) {
                        console.error('Error sending ZIP file:', err);
                        res.status(500).json({ error: 'Failed to send ZIP file' });
                    } else {
                        console.log(`ZIP file sent successfully: ${playlistTitle}.zip`);
                    }
                });
                scheduleFileDeletion(zipFilePath, `${playlistTitle}.zip`, playlistUrl);
                deleteDirectory(playlistPath)
            });
            output.on('error', (err) => {
                console.error('Error creating ZIP file:', err);
                deleteDirectory(playlistPath)
                res.status(500).json({ error: 'Failed to create ZIP file', details: err.message });
            });
        })
        .catch((error) => {
            console.error('Failed to download playlist:', error);
            deleteDirectory(playlistPath)
            res.status(500).json({ error: 'Failed to download playlist', details: error.message });
        });
    })
    .catch((error) => {
        console.error('Failed to fetch playlist info:', error);
        deleteDirectory(playlistPath)
        res.status(500).json({ error: 'Failed to fetch playlist info', details: error.message });
    });
});


// Start server
app.listen(port, () => {
    console.log(`Server running at ${host}`);
});


//%(ext)s
