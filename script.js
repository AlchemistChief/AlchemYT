fetch('data.json')
	.then(response => response.json())
	.then(data => {
		const apiBaseUrl = data.apiBaseUrl;

		const urlInput = document.getElementById('url');
		const fetchInfoBtn = document.getElementById('fetchInfoBtn');
		const downloadMp3Btn = document.getElementById('downloadMp3Btn');
		const downloadMp4Btn = document.getElementById('downloadMp4Btn');
		const videoInfoDiv = document.getElementById('videoInfo');
		const titleElem = document.getElementById('title');
		const thumbnailElem = document.getElementById('thumbnail');
		const errorElem = document.getElementById('error');
		const videoContainer = document.getElementById('videoContainer');

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

		fetchInfoBtn.addEventListener('click', () => {
			const rawUrl = urlInput.value.trim();
			const normalizedUrl = normalizeYouTubeUrl(rawUrl);

			if (normalizedUrl) {
				fetch(`${apiBaseUrl}/info?url=${encodeURIComponent(normalizedUrl)}`)
					.then(response => response.json())
					.then(data => {
						console.log('Fetched video info:', data);
						titleElem.textContent = `Title: ${data.title}`;
						thumbnailElem.src = data.thumbnail;
						videoInfoDiv.style.display = 'block';
						errorElem.textContent = '';

						videoContainer.innerHTML = `
							<h3>${data.title}</h3>
							<img src="${data.thumbnail}" alt="Video Thumbnail" style="width: 100%; max-width: 400px;">
							<p><strong>Duration:</strong> ${data.duration}</p>
							<p><strong>Description:</strong> ${data.description}</p>
						`;
						videoContainer.style.height = 'auto';
					})
					.catch(() => {
						console.error('Error fetching video info');
						videoInfoDiv.style.display = 'none';
						errorElem.textContent = 'Failed to fetch video info. Please check the URL.';
					});
			} else {
				errorElem.textContent = 'Please enter a valid YouTube URL.';
			}
		});

		downloadMp3Btn.addEventListener('click', () => {
			const rawUrl = urlInput.value.trim();
			const normalizedUrl = normalizeYouTubeUrl(rawUrl);

			if (normalizedUrl) {
				console.log('Requested MP3 download for URL:', normalizedUrl);
				window.location.href = `${apiBaseUrl}/mp3?url=${encodeURIComponent(normalizedUrl)}`;
			} else {
				errorElem.textContent = 'Please enter a valid YouTube URL.';
			}
		});

		downloadMp4Btn.addEventListener('click', () => {
			const rawUrl = urlInput.value.trim();
			const normalizedUrl = normalizeYouTubeUrl(rawUrl);

			if (normalizedUrl) {
				console.log('Requested MP4 download for URL:', normalizedUrl);
				window.location.href = `${apiBaseUrl}/mp4?url=${encodeURIComponent(normalizedUrl)}`;
			} else {
				errorElem.textContent = 'Please enter a valid YouTube URL.';
			}
		});
	})
	.catch(() => {
		alert('Failed to load API base URL.');
	});
