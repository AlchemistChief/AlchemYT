const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// CORS options with additional headers
const corsOptions = {
	origin: 'https://alchemistchief.github.io',
	methods: ['GET', 'POST', 'OPTIONS'], // Allow specific HTTP methods
	allowedHeaders: ['Content-Type'], // Allow specific headers
	optionsSuccessStatus: 200, // For older browsers
};

// Middleware
app.use(express.json());

// Routes with CORS options applied
app.get('/info', cors(corsOptions), (req, res) => {
	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`Info endpoint hit. URL: ${videoUrl}`);
	// Simulate fetching video info
	res.json({
		title: 'Example Video Title',
		thumbnail: 'https://via.placeholder.com/150',
	});
});

app.get('/mp3', cors(corsOptions), (req, res) => {
	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);
	// Simulate MP3 download
	res.json({ message: 'MP3 download started.' });
});

app.get('/mp4', cors(corsOptions), (req, res) => {
	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`MP4 download endpoint hit. URL: ${videoUrl}`);
	// Simulate MP4 download
	res.json({ message: 'MP4 download started.' });
});

// Start server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
