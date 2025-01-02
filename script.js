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
        
        function extractPlaylistId(url) {
            const match = url.match(/[?&]list=([^&#]+)/);
            return match ? match[1] : null;
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
        
            if (fileBlob) {
                // If blob is valid, create the download button
                const downloadButton = document.createElement('button');
                downloadButton.textContent = `Download ${extension.toUpperCase()}${resolution ? ` ${resolution}` : ''}`;
                downloadButton.onclick = () => {
                    downloadBlob(fileBlob, `${videoTitle}${resolution ? `_${resolution}` : ''}.${extension}`);
                };
        
                downloadCell.appendChild(downloadButton);
        
                // Make the container visible if it's not already
                if (!tableContainer.classList.contains('visible')) {
                    tableContainer.classList.add('visible');
                }
        
                return downloadButton;
            } else {
                // If blob is null, create the progress bar
                const progressBarContainer = document.createElement('div');
                const progressBar = document.createElement('progress');
                progressBar.max = 100;
                progressBar.value = 0;
                progressBarContainer.appendChild(progressBar);
        
                downloadCell.appendChild(progressBarContainer);
        
                // Make the container visible if it's not already
                if (!tableContainer.classList.contains('visible')) {
                    tableContainer.classList.add('visible');
                }
        
                return { progressBarContainer, progressBar };
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
                const { progressBarContainer, progressBar } = addToTable('mp4', savedUrl, titleElem.textContent, null, 'mp4', resolution);
                const eventSource = new EventSource('/mp4');
                eventSource.onmessage = function (event) {
                    const data = JSON.parse(event.data);
                    const percent = data.percent;

                    // Update progress bar value
                    progressBar.value = percent;

                    // Once the download reaches 100%, hide progress bar and show the download button
                    if (percent === 100) {
                        progressBarContainer.style.display = 'none'; // Hide progress bar
                    }
                };

                fetch(`${apiBaseUrl}/mp4?url=${encodeURIComponent(savedUrl)}&resolution=${resolution}`)
                    .then(response => response.blob())
                    .then(blob => {
                        cacheFile(savedUrl, 'mp4', resolution, blob);
                        // Check if the progress bar exists, and remove it if so
                        if (progressBarContainer) {
                            progressBarContainer.remove();
                        }
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
                const { progressBarContainer, progressBar } = addToTable('mp3', savedUrl, titleElem.textContent, null, 'mp3');
                const eventSource = new EventSource('/mp3');
                eventSource.onmessage = function (event) {
                    const data = JSON.parse(event.data);
                    const percent = data.percent;

                    // Update progress bar value
                    progressBar.value = percent;

                    // Once the download reaches 100%, hide progress bar and show the download button
                    if (percent === 100) {
                        progressBarContainer.style.display = 'none'; // Hide progress bar
                    }
                };
                
                fetch(`${apiBaseUrl}/mp3?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        cacheFile(savedUrl, 'mp3', '', blob);

                        // Check if the progress bar exists, and remove it if so
                        if (progressBarContainer) {
                            progressBarContainer.remove();
                        }
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
                const { progressBarContainer, progressBar } = addToTable('mp3', savedUrl, titleElem.textContent, null, 'zip');
                const eventSource = new EventSource('/playlist');
                eventSource.onmessage = function (event) {
                    const data = JSON.parse(event.data);
                    const percent = data.percent;

                    // Update progress bar value
                    progressBar.value = percent;

                    // Once the download reaches 100%, hide progress bar and show the download button
                    if (percent === 100) {
                        progressBarContainer.style.display = 'none'; // Hide progress bar
                    }
                };

                fetch(`${apiBaseUrl}/playlist?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        cacheFile(savedUrl, 'mp3', '', blob);
                        // Check if the progress bar exists, and remove it if so
                        if (progressBarContainer) {
                            progressBarContainer.remove();
                        }
                        addToTable('mp3', savedUrl, titleElem.textContent, blob, 'zip');
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
            const isPlaylist = rawUrl.includes('list=');
            const playlistId = isPlaylist ? extractPlaylistId(rawUrl) : null;
        
            if (normalizedUrl && (videoId || isPlaylist)) {
                // Save the URL for future use
                savedUrl = normalizedUrl;
        
                if (isPlaylist) {
                    const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
                    const playlistItemsApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=50`;
        
                    // Fetch playlist details
                    fetch(playlistApiUrl)
                        .then(response => response.json())
                        .then(playlistData => {
                            if (playlistData.items && playlistData.items.length > 0) {
                                const playlistTitle = playlistData.items[0].snippet.title;
                                titleElem.textContent = playlistTitle;
        
                                // Fetch playlist items to count videos
                                let totalVideos = 0;
                                let nextPageToken = null;
        
                                const fetchAllVideos = (pageToken = '') => {
                                    const url = `${playlistItemsApiUrl}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        
                                    return fetch(url)
                                        .then(response => response.json())
                                        .then(itemsData => {
                                            if (itemsData.items) {
                                                totalVideos += itemsData.items.length;
        
                                                if (itemsData.nextPageToken) {
                                                    // Fetch next page
                                                    return fetchAllVideos(itemsData.nextPageToken);
                                                } else {
                                                    // No more pages, update UI
                                                    durationElem.textContent = `${totalVideos} videos`;
        
                                                    if (totalVideos > 30) {
                                                        // Display only the title and duration if the playlist exceeds 30 videos
                                                        errorElem.textContent = 'This playlist has more than 30 videos. Features are limited.';
                                                        videoEmbedElem.style.display = 'none';
                                                        downloadMp3PlaylistBtn.style.display = 'none';
                                                        downloadMp3Btn.style.display = 'none';
                                                        downloadMp4_144pBtn.style.display = 'none';
                                                        downloadMp4_240pBtn.style.display = 'none';
                                                        downloadMp4_360pBtn.style.display = 'none';
                                                        downloadMp4_480pBtn.style.display = 'none';
                                                        downloadMp4_720pBtn.style.display = 'none';
                                                        downloadMp4_1080pBtn.style.display = 'none';
                                                    } else {
                                                        // Show the first video and buttons if the playlist is within the limit
                                                        const firstVideoId = itemsData.items[0].snippet.resourceId.videoId;
                                                        videoEmbedElem.src = `https://www.youtube.com/embed/${firstVideoId}?list=${playlistId}`;
                                                        videoEmbedElem.style.display = 'block';
        
                                                        downloadMp3PlaylistBtn.style.display = 'inline';
                                                        downloadMp3Btn.style.display = 'none';
                                                        downloadMp4_144pBtn.style.display = 'none';
                                                        downloadMp4_240pBtn.style.display = 'none';
                                                        downloadMp4_360pBtn.style.display = 'none';
                                                        downloadMp4_480pBtn.style.display = 'none';
                                                        downloadMp4_720pBtn.style.display = 'none';
                                                        downloadMp4_1080pBtn.style.display = 'none';
                                                    }
                                                }
                                            } else {
                                                throw new Error('No videos in playlist.');
                                            }
                                        });
                                };
        
                                return fetchAllVideos();
                            } else {
                                throw new Error('Playlist not found.');
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching playlist info:', error);
                            videoContainer.style.height = '0';
                            videoContainer.style.opacity = '0';
                            videoContainer.classList.remove('visible');
                            errorElem.textContent = 'Failed to fetch playlist details.';
                        });
                } else {
                    // Video-specific logic here
                    downloadMp3PlaylistBtn.style.display = 'none';
                    downloadMp3Btn.style.display = 'inline';
                    downloadMp4_144pBtn.style.display = 'inline';
                    downloadMp4_240pBtn.style.display = 'inline';
                    downloadMp4_360pBtn.style.display = 'inline';
                    downloadMp4_480pBtn.style.display = 'inline';
                    downloadMp4_720pBtn.style.display = 'inline';
                    downloadMp4_1080pBtn.style.display = 'inline';
        
                    // Fetch video details
                    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;
        
                    fetch(videoApiUrl)
                        .then(response => response.json())
                        .then(videoData => {
                            if (videoData.items && videoData.items.length > 0) {
                                const videoDetails = videoData.items[0];
                                titleElem.textContent = videoDetails.snippet.title;
                                durationElem.textContent = parseDuration(videoDetails.contentDetails.duration);
        
                                // Embed the video
                                videoEmbedElem.src = `https://www.youtube.com/embed/${videoId}`;
                                videoEmbedElem.style.display = 'block';
                            } else {
                                throw new Error('Video not found.');
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching video info:', error);
                            videoContainer.style.height = '0';
                            videoContainer.style.opacity = '0';
                            videoContainer.classList.remove('visible');
                            errorElem.textContent = 'Failed to fetch video details.';
                        });
                }
        
                videoContainer.style.display = 'flex';
                videoContainer.style.height = 'auto';
                videoContainer.classList.add('visible');
                errorElem.textContent = '';
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
