fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const apiBaseUrl = data.apiBaseUrl;
        const apiKey = data.YOUTUBE_API_KEY;

        const urlInput = document.getElementById('url');
        const fetchInfoBtn = document.getElementById('fetchInfoBtn');
        const downloadMp3Btn = document.getElementById('downloadMp3Btn');
        const downloadMp4Btn = document.getElementById('downloadMp4Btn');
        const titleElem = document.getElementById('title');
        const videoEmbedElem = document.getElementById('videoEmbed');
        const durationElem = document.getElementById('duration');
        const errorElem = document.getElementById('error');
        const videoContainer = document.getElementById('videoContainer');
        const mp3Table = document.getElementById('mp3Table');
        const mp4Table = document.getElementById('mp4Table');

        let savedUrl = null;

        // Track downloaded videos
        const downloadedMp3 = new Set();
        const downloadedMp4 = new Set();

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

        function parseDuration(duration) {
            const regex = /^PT(\d+H)?(\d+M)?(\d+S)?$/;
            const match = duration.match(regex);

            const hours = match[1] ? parseInt(match[1].replace('H', ''), 10) : 0;
            const minutes = match[2] ? parseInt(match[2].replace('M', ''), 10) : 0;
            const seconds = match[3] ? parseInt(match[3].replace('S', ''), 10) : 0;

            let timeString = '';
            if (hours > 0) timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
            if (minutes > 0) timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
            if (seconds > 0) timeString += `${seconds} second${seconds > 1 ? 's' : ''}`;

            return timeString.trim();
        }

        function addToTable(type, videoUrl, videoTitle) {
            const table = type === 'mp3' ? mp3Table : mp4Table;
            const row = table.insertRow();
            const videoCell = row.insertCell(0);
            const downloadCell = row.insertCell(1);

            videoCell.textContent = videoTitle;
            const downloadButton = document.createElement('button');
            downloadButton.textContent = `Download ${type.toUpperCase()}`;
            downloadButton.onclick = () => {
                window.location.href = `${apiBaseUrl}/${type}?url=${encodeURIComponent(videoUrl)}`;
            };
            downloadCell.appendChild(downloadButton);
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
                        console.log('Fetched video info:', data);  // Log the whole API response

                        if (data.items && data.items.length > 0) {
                            const videoData = data.items[0];

                            titleElem.textContent = `${videoData.snippet.title}`;
                            durationElem.textContent = `${parseDuration(videoData.contentDetails.duration)}`;

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
                if (downloadedMp3.has(savedUrl)) {
                    console.log('MP3 already downloaded, serving from cache...');
                    return;
                }

                console.log('Requested MP3 download for URL:', savedUrl);
                window.location.href = `${apiBaseUrl}/mp3?url=${encodeURIComponent(savedUrl)}`;
                
                downloadedMp3.add(savedUrl);  // Add to cache
                addToTable('mp3', savedUrl, titleElem.textContent);  // Add to table
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        });

        downloadMp4Btn.addEventListener('click', () => {
            if (savedUrl) {
                if (downloadedMp4.has(savedUrl)) {
                    console.log('MP4 already downloaded, serving from cache...');
                    return;
                }

                console.log('Requested MP4 download for URL:', savedUrl);
                window.location.href = `${apiBaseUrl}/mp4?url=${encodeURIComponent(savedUrl)}`;
                
                downloadedMp4.add(savedUrl);  // Add to cache
                addToTable('mp4', savedUrl, titleElem.textContent);  // Add to table
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        });

        // Clear cached data when the tab is closed
        window.addEventListener('beforeunload', () => {
            downloadedMp3.clear();
            downloadedMp4.clear();
        });
    })
    .catch(error => {
        console.error('Error fetching data.json:', error);
        alert('Failed to load API base URL.');
    });
