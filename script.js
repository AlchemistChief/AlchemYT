// script.js - Frontend - Never remove
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const apiBaseUrl = data.apiBaseUrl;
        const apiKey = data.YOUTUBE_API_KEY;

        const urlInput = document.getElementById('url');
        const fetchInfoBtn = document.getElementById('fetchInfoBtn');
        const downloadMp3Btn = document.getElementById('downloadMp3Btn');
        const downloadMp3PlaylistBtn = document.getElementById('downloadMp3PlaylistBtn')
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
        let Playlist = false

        // Cache for downloaded videos (MP3 and MP4)
        const fileCache = {
            mp3: {},
            mp4: {}
        };

        function normalizeYouTubeUrl(url) {
            try {
                const urlObj = new URL(url);
                if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                    if (urlObj.pathname === '/playlist') {
                        const playlistId = urlObj.searchParams.get('list');
                        if (playlistId) {
                            return `https://www.youtube.com/playlist?list=${playlistId}`;
                        }
                    } else {
                        const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/')[1];
                        if (videoId) {
                            return `https://www.youtube.com/watch?v=${videoId}`;
                        }
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

        function addToTable(type, videoUrl, videoTitle, fileBlob, extension, resolution = '') {
            const table = type === 'mp3' ? mp3Table : mp4Table;
            const tableContainer = type === 'mp3' ? mp3TableContainer : mp4TableContainer;
        
            const row = table.insertRow();
            const videoCell = row.insertCell(0);
            const downloadCell = row.insertCell(1);
        
            videoCell.textContent = videoTitle;
        
            const downloadButton = document.createElement('button');
            // Only add resolution to MP4
            downloadButton.textContent = `Download ${type.toUpperCase()}${resolution ? ` ${resolution}` : ''}`;
            downloadButton.onclick = () => {
                downloadBlob(fileBlob, `${videoTitle}${resolution ? `_${resolution}` : ''}.${extension}`);
            };
            downloadCell.appendChild(downloadButton);
        
            // Make the container visible if it's not already
            if (!tableContainer.classList.contains('visible')) {
                tableContainer.classList.add('visible');
            }
        }

        // Cache the MP3/MP4 blob correctly
        function cacheFile(url, type, resolution, blob) {
            const videoTitle = titleElem.textContent;
            if (type === 'mp3') {
                fileCache.mp3[url] = { file: blob, extension: 'mp3' };
            } else if (type === 'mp4') {
                if (!fileCache.mp4[url]) {
                    fileCache.mp4[url] = {};
                }
                fileCache.mp4[url][resolution] = { file: blob, extension: 'mp4' };
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

        function handleMp4Download(resolution) {
            if (savedUrl) {
                // Check if the video with the given resolution is cached
                if (fileCache.mp4[savedUrl] && fileCache.mp4[savedUrl][resolution]) {
                    console.log('MP4 already downloaded for this resolution, serving from cache...');
                    const cachedBlob = fileCache.mp4[savedUrl][resolution].file;
                    // Use title and resolution for the filename
                    downloadBlob(cachedBlob, `${titleElem.textContent}_${resolution}.mp4`);
                    return;
                }
        
                console.log(`Requested MP4 download for URL: ${savedUrl} with resolution ${resolution}`);
                fetch(`${apiBaseUrl}/mp4?url=${encodeURIComponent(savedUrl)}&resolution=${resolution}`)
                    .then(response => response.blob())
                    .then(blob => {
                        cacheFile(savedUrl, 'mp4', resolution, blob);
                        addToTable('mp4', savedUrl, titleElem.textContent, blob, 'mp4', resolution);
                        downloadBlob(blob, `${titleElem.textContent}_${resolution}.mp4`);
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
                    downloadBlob(cachedBlob, `${titleElem.textContent}.mp3`);
                    return;
                }
        
                console.log('Requested MP3 download for URL:', savedUrl);
                fetch(`${apiBaseUrl}/mp3?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        cacheFile(savedUrl, 'mp3', '', blob);
                        addToTable('mp3', savedUrl, titleElem.textContent, blob, 'mp3');
                        downloadBlob(blob, `${titleElem.textContent}.mp3`);
                    })
                    .catch(error => {
                        console.error('Error fetching MP3:', error);
                    });
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        });

        downloadMp3PlaylistBtn.addEventListener('click', () => {
            if (savedUrl) {
                if (fileCache.mp3[savedUrl]) {
                    console.log('MP3 Playlist already downloaded, serving from cache...');
                    const cachedBlob = fileCache.mp3[savedUrl].file;
                    downloadBlob(cachedBlob, `${titleElem.textContent}.zip`);
                    return;
                }
        
                console.log('Requested MP3 download for URL:', savedUrl);
                fetch(`${apiBaseUrl}/playlist?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        cacheFile(savedUrl, 'mp3', '', blob);
                        addToTable('mp3', savedUrl, titleElem.textContent, blob, 'mp3');
                        downloadBlob(blob, `${titleElem.textContent}.zip`);
                    })
                    .catch(error => {
                        console.error('Error fetching MP3 Playlist:', error);
                    });
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        });
        
        fetchInfoBtn.addEventListener('click', () => { 
            const rawUrl = urlInput.value.trim();
            const normalizedUrl = normalizeYouTubeUrl(rawUrl);
            const videoId = extractVideoId(rawUrl);
        
            if (normalizedUrl) {
                savedUrl = normalizedUrl;
                Playlist = normalizedUrl.includes('list=');
        
                if (Playlist) {
                    const playlistId = new URLSearchParams(new URL(normalizedUrl).search).get('list');
        
                    if (playlistId) {
                        // Fetch playlist details
                        const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${apiKey}`;
        
                        fetch(playlistApiUrl)
                            .then(response => response.json())
                            .then(data => {
                                if (data.items && data.items.length > 0) {
                                    const firstVideoId = data.items[0].snippet.resourceId.videoId;
        
                                    videoEmbedElem.src = `https://www.youtube.com/embed/${firstVideoId}?list=${playlistId}`;
                                    videoEmbedElem.style.display = 'block'; 
                                    videoContainer.style.display = 'flex';
                                    videoContainer.style.height = 'auto';
                                    videoContainer.classList.add('visible');
        
                                    downloadMp3Btn.style.display = 'none';
                                    downloadMp4_144pBtn.style.display = 'none';
                                    downloadMp4_240pBtn.style.display = 'none';
                                    downloadMp4_360pBtn.style.display = 'none';
                                    downloadMp4_480pBtn.style.display = 'none';
                                    downloadMp4_720pBtn.style.display = 'none';
                                    downloadMp4_1080pBtn.style.display = 'none';
                                    document.getElementById('downloadMp3PlaylistBtn').style.display = 'block';
                                } else {
                                    errorElem.textContent = 'Failed to fetch the first video of the playlist.';
                                }
                            })
                            .catch(() => {
                                console.error('Error fetching playlist details');
                                errorElem.textContent = 'Failed to fetch playlist details. Please check the URL.';
                            });
                    } else {
                        errorElem.textContent = 'Invalid playlist ID.';
                    }
                } else if (videoId) {
                    // Handle single video as before
                    videoEmbedElem.src = `https://www.youtube.com/embed/${videoId}`;
                    videoEmbedElem.style.display = 'block'; 
                    videoContainer.style.display = 'flex';
                    videoContainer.style.height = 'auto';
                    videoContainer.classList.add('visible');
        
                    downloadMp3Btn.style.display = 'block';
                    downloadMp4_144pBtn.style.display = 'block';
                    downloadMp4_240pBtn.style.display = 'block';
                    downloadMp4_360pBtn.style.display = 'block';
                    downloadMp4_480pBtn.style.display = 'block';
                    downloadMp4_720pBtn.style.display = 'block';
                    downloadMp4_1080pBtn.style.display = 'block';
                    document.getElementById('downloadMp3PlaylistBtn').style.display = 'none';
                } else {
                    errorElem.textContent = 'Please enter a valid YouTube URL.';
                }
            } else {
                errorElem.textContent = 'Please enter a valid YouTube URL.';
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
