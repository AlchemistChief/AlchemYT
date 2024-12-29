const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core'); // Import ytdl-core to handle YouTube video downloads

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
app.use(express.json());

// Routes
app.get('/info', cors(corsOptions), (req, res) => {
	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`Info endpoint hit. URL: ${videoUrl}`);
	// Simulate fetching video info (can use ytdl-core to fetch actual info)
	ytdl.getInfo(videoUrl).then(info => {
		res.json({
			title: info.videoDetails.title,
			thumbnail: info.videoDetails.thumbnails[0].url,
		});
	}).catch(err => {
		res.status(500).json({ error: 'Failed to fetch video info', details: err.message });
	});
});

app.get('/mp3', cors(corsOptions), (req, res) => {
	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);
	// Fetch and stream the audio to the user
	ytdl(videoUrl, { filter: 'audioonly' }).pipe(res);
});

app.get('/mp4', cors(corsOptions), (req, res) => {
	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);
	// Fetch and stream the video to the user
	ytdl(videoUrl, { filter: 'videoandaudio' })
		.pipe(res)
		.on('finish', () => {
			console.log('Video streaming completed');
		})
		.on('error', (err) => {
			console.log('Error while streaming video:', err);
			res.status(500).json({ error: 'Failed to stream video', details: err.message });
		});
});

// Start server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
