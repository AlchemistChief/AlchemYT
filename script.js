fetch('data.json')
	.then(response => response.json())
	.then(data => {
		const apiKey = data.YOUTUBE_API_KEY; // The API key is now stored in data.json
		const apiBaseUrl = data.apiBaseUrl;

		const urlInput = document.getElementById('url');
		const fetchInfoBtn = document.getElementById('fetchInfoBtn');
		const downloadMp3Btn = document.getElementById('downloadMp3Btn');
		const downloadMp4Btn = document.getElementById('downloadMp4Btn');
		const videoInfoDiv = document.getElementById('videoInfo');
		const titleElem = document.getElementById('title');
		const videoEmbedElem = document.getElementById('videoEmbed');
		const durationElem = document.getElementById('duration');
		const errorElem = document.getElementById('error');
		const videoContainer = document.getElementById('videoContainer');

		let savedUrl = null;

		function normalizeYouTubeUrl(url) {
			try {
				const urlObj = new URL(url);
				if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
					const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/')[1];
					if (videoId) {
						return `https://www.youtube.com/watch?v=${videoId}`;
					}
				}
			} catch (e) {
				console.error('Invalid URL provided:', url);
			}
			return null;
		}

		function extractVideoId(url) {
			try {
				const urlObj = new URL(url);
				return urlObj.searchParams.get('v') || urlObj.pathname.split('/')[1];
			} catch {
				return null;
			}
		}

		fetchInfoBtn.addEventListener('click', () => {
			const rawUrl = urlInput.value.trim();
			const normalizedUrl = normalizeYouTubeUrl(rawUrl);
			const videoId = extractVideoId(rawUrl);

			if (normalizedUrl && videoId) {
				// Save the URL for future use
				savedUrl = normalizedUrl;

				// Set embed URL immediately and make embed visible
				videoEmbedElem.src = `https://www.youtube.com/embed/${videoId}`;
				videoEmbedElem.style.display = 'block'; // Make sure it's visible immediately
				videoContainer.style.display = 'flex';
				videoContainer.style.height = 'auto';
				videoContainer.classList.add('visible');

				// Call YouTube API to get video info
				const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;

				fetch(apiUrl)
					.then(response => response.json())
					.then(data => {
						console.log('Fetched video info:', data);
						if (data.items && data.items.length > 0) {
							const videoData = data.items[0];
							titleElem.textContent = `Title: ${videoData.snippet.title}`;
							durationElem.textContent = `Duration: ${videoData.contentDetails.duration}`;

							videoContainer.style.display = 'flex';
							videoContainer.style.height = 'auto';
							videoContainer.classList.add('visible');
							errorElem.textContent = '';
						} else {
							errorElem.textContent = 'Failed to fetch video info. Video not found.';
						}
					})
					.catch(() => {
						console.error('Error fetching video info');
						videoContainer.style.height = '0';
						videoContainer.style.opacity = '0';
						videoContainer.classList.remove('visible');
						errorElem.textContent = 'Failed to fetch video info. Please check the URL.';
					});
			} else {
				errorElem.textContent = 'Please enter a valid YouTube URL.';
			}
		});

		downloadMp3Btn.addEventListener('click', () => {
			if (savedUrl) {
				console.log('Requested MP3 download for URL:', savedUrl);
				window.location.href = `${apiBaseUrl}/mp3?url=${encodeURIComponent(savedUrl)}`;
			} else {
				errorElem.textContent = 'Please fetch video info first.';
			}
		});

		downloadMp4Btn.addEventListener('click', () => {
			if (savedUrl) {
				console.log('Requested MP4 download for URL:', savedUrl);
				window.location.href = `${apiBaseUrl}/mp4?url=${encodeURIComponent(savedUrl)}`;
			} else {
				errorElem.textContent = 'Please fetch video info first.';
			}
		});
	})
	.catch(error => {
		console.error('Error fetching data.json:', error);
		alert('Failed to load API base URL.');
	});
