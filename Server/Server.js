const express = require('express');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/info', (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', 'https://alchemistchief.github.io');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

app.get('/mp3', (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', 'https://alchemistchief.github.io');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	const videoUrl = req.query.url;
	if (!videoUrl) {
		return res.status(400).json({ error: 'YouTube URL is required' });
	}
	console.log(`MP3 download endpoint hit. URL: ${videoUrl}`);
	// Simulate MP3 download
	res.json({ message: 'MP3 download started.' });
});

app.get('/mp4', (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', 'https://alchemistchief.github.io');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
