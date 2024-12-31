// script.js - Frontend - Never remove
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const apiBaseUrl = data.apiBaseUrl;
        const apiKey = data.YOUTUBE_API_KEY;

        const urlInput = document.getElementById('url');
        const fetchInfoBtn = document.getElementById('fetchInfoBtn');
        const downloadMp3Btn = document.getElementById('downloadMp3Btn');
        const downloadMp4_144pBtn = document.getElementById('downloadMp4_144pBtn');
        const downloadMp4_240pBtn = document.getElementById('downloadMp4_240pBtn');
        const downloadMp4_360pBtn = document.getElementById('downloadMp4_360pBtn');
        const downloadMp4_480pBtn = document.getElementById('downloadMp4_480pBtn');
        const downloadMp4_720pBtn = document.getElementById('downloadMp4_720pBtn');
        const downloadMp4_1080pBtn = document.getElementById('downloadMp4_1080pBtn');
        const titleElem = document.getElementById('title');
        const videoEmbedElem = document.getElementById('videoEmbed');
        const durationElem = document.getElementById('duration');
        const errorElem = document.getElementById('error');
        const videoContainer = document.getElementById('videoContainer');
        const mp3Table = document.getElementById('mp3Table');
        const mp4Table = document.getElementById('mp4Table');
        const mp3TableContainer = document.getElementById('mp3TableContainer');
        const mp4TableContainer = document.getElementById('mp4TableContainer');

        let savedUrl = null;

        // Cache for downloaded videos (MP3 and MP4)
        const fileCache = {
            mp3: {},
            mp4: {}
        };

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

        function addToTable(type, videoUrl, videoTitle, fileBlob, extension) {
            const table = type === 'mp3' ? mp3Table : mp4Table;
            const tableContainer = type === 'mp3' ? mp3TableContainer : mp4TableContainer;
        
            const row = table.insertRow();
            const videoCell = row.insertCell(0);
            const downloadCell = row.insertCell(1);
        
            videoCell.textContent = videoTitle;
        
            const downloadButton = document.createElement('button');
            downloadButton.textContent = `Download ${type.toUpperCase()}`;
            downloadButton.onclick = () => {
                // Use videoTitle for the filename instead of the URL
                const sanitizedTitle = videoTitle.replace(/[\/\\?%*:|"<>]/g, '-'); // Remove invalid characters for filename
                downloadBlob(fileBlob, `${sanitizedTitle}.${extension}`);
            };
            downloadCell.appendChild(downloadButton);
        
            // Make the container visible if it's not already
            if (!tableContainer.classList.contains('visible')) {
                tableContainer.classList.add('visible');
            }
        }

        function downloadBlob(blob, filename) {
            const objectURL = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = objectURL;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(objectURL); // Release the object URL after download
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

        function handleMp4Download(resolution) {
            if (savedUrl) {
                if (fileCache.mp4[savedUrl]) {
                    console.log('MP4 already downloaded, serving from cache...');
                    const cachedBlob = fileCache.mp4[savedUrl].file;
                    // Use title instead of URL
                    downloadBlob(cachedBlob, `${titleElem.textContent}.mp4`);
                    return;
                }

                console.log(`Requested MP4 download for URL: ${savedUrl} with resolution ${resolution}`);
                fetch(`${apiBaseUrl}/mp4?url=${encodeURIComponent(savedUrl)}&resolution=${resolution}`)
                    .then(response => response.blob())
                    .then(blob => {
                        fileCache.mp4[savedUrl] = {
                            file: blob,
                            extension: 'mp4'
                        };
                        addToTable('mp4', savedUrl, titleElem.textContent, blob, 'mp4');
                        // Use title instead of URL
                        downloadBlob(blob, `${titleElem.textContent}.mp4`);
                    })
                    .catch(error => {
                        console.error('Error fetching MP4:', error);
                    });
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        }

        downloadMp4_144pBtn.addEventListener('click', () => handleMp4Download('144p'));
        downloadMp4_240pBtn.addEventListener('click', () => handleMp4Download('240p'));
        downloadMp4_360pBtn.addEventListener('click', () => handleMp4Download('360p'));
        downloadMp4_480pBtn.addEventListener('click', () => handleMp4Download('480p'));
        downloadMp4_720pBtn.addEventListener('click', () => handleMp4Download('720p'));
        downloadMp4_1080pBtn.addEventListener('click', () => handleMp4Download('1080p'));

        downloadMp3Btn.addEventListener('click', () => {
            if (savedUrl) {
                if (fileCache.mp3[savedUrl]) {
                    console.log('MP3 already downloaded, serving from cache...');
                    const cachedBlob = fileCache.mp3[savedUrl].file;
                    // Use title instead of URL
                    downloadBlob(cachedBlob, `${titleElem.textContent}.mp3`);
                    return;
                }
        
                console.log('Requested MP3 download for URL:', savedUrl);
                fetch(`${apiBaseUrl}/mp3?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        fileCache.mp3[savedUrl] = {
                            file: blob,
                            extension: 'mp3'
                        };
                        addToTable('mp3', savedUrl, titleElem.textContent, blob, 'mp3');
                        // Use title instead of URL
                        downloadBlob(blob, `${titleElem.textContent}.mp3`);
                    })
                    .catch(error => {
                        console.error('Error fetching MP3:', error);
                    });
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        });
        
        // Clear cached data when the tab is closed
        window.addEventListener('beforeunload', () => {
            for (let type in fileCache) {
                for (let key in fileCache[type]) {
                    delete fileCache[type][key];  // Clear the cache
                }
            }
        });
    })
    .catch(error => {
        console.error('Error fetching data.json:', error);
        alert('Failed to load API base URL.');
    });
