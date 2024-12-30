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

        // Cache to store downloaded files by URL
        const fileCache = {
            mp3: {},
            mp4: {}
        };

        // Function to check for Blob in cache and download if available
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
                savedUrl = normalizedUrl;
                // Fetch video info from YouTube API and handle response...
            }
        });

        // Helper function to add file to the respective table
        function addToTable(type, videoUrl, fileBlob) {
            const table = type === 'mp3' ? mp3Table : mp4Table;
            const row = table.insertRow();
            const videoCell = row.insertCell(0);
            const downloadCell = row.insertCell(1);

            videoCell.textContent = videoUrl;  // Display URL (or use a more descriptive name if preferred)
            const downloadButton = document.createElement('button');
            downloadButton.textContent = `Download ${type.toUpperCase()}`;
            downloadButton.onclick = () => {
                downloadBlob(fileBlob, `${videoUrl.split('?')[1]}.${type}`);
            };
            downloadCell.appendChild(downloadButton);
        }

        downloadMp3Btn.addEventListener('click', () => {
            if (savedUrl) {
                if (fileCache.mp3[savedUrl]) {
                    console.log('MP3 already downloaded, serving from cache...');
                    const cachedBlob = fileCache.mp3[savedUrl].file;
                    downloadBlob(cachedBlob, `${savedUrl.split('?')[1]}.mp3`);
                    return;
                }

                console.log('Requested MP3 download for URL:', savedUrl);
                fetch(`${apiBaseUrl}/mp3?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        // Cache the Blob with savedUrl as the key and mp3 extension
                        fileCache.mp3[savedUrl] = {
                            file: blob,
                            extension: 'mp3'
                        };
                        addToTable('mp3', savedUrl, blob);  // Add to table with button to download
                        downloadBlob(blob, `${savedUrl.split('?')[1]}.mp3`);
                    })
                    .catch(error => {
                        console.error('Error fetching MP3:', error);
                    });
            } else {
                errorElem.textContent = 'Please fetch video info first.';
            }
        });

        downloadMp4Btn.addEventListener('click', () => {
            if (savedUrl) {
                if (fileCache.mp4[savedUrl]) {
                    console.log('MP4 already downloaded, serving from cache...');
                    const cachedBlob = fileCache.mp4[savedUrl].file;
                    downloadBlob(cachedBlob, `${savedUrl.split('?')[1]}.mp4`);
                    return;
                }

                console.log('Requested MP4 download for URL:', savedUrl);
                fetch(`${apiBaseUrl}/mp4?url=${encodeURIComponent(savedUrl)}`)
                    .then(response => response.blob())
                    .then(blob => {
                        // Cache the Blob with savedUrl as the key and mp4 extension
                        fileCache.mp4[savedUrl] = {
                            file: blob,
                            extension: 'mp4'
                        };
                        addToTable('mp4', savedUrl, blob);  // Add to table with button to download
                        downloadBlob(blob, `${savedUrl.split('?')[1]}.mp4`);
                    })
                    .catch(error => {
                        console.error('Error fetching MP4:', error);
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
