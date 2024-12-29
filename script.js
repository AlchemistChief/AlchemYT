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

        fetchInfoBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                fetch(`${apiBaseUrl}/info?url=${encodeURIComponent(url)}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('Fetched video info:', data);
                        titleElem.textContent = `Title: ${data.title}`;
                        thumbnailElem.src = data.thumbnail;
                        videoInfoDiv.style.display = 'block';
                        errorElem.textContent = '';

                        // Create and append content to videoContainer
                        videoContainer.innerHTML = `
                            <h3>${data.title}</h3>
                            <img src="${data.thumbnail}" alt="Video Thumbnail" style="width: 100%; max-width: 400px;">
                            <p><strong>Duration:</strong> ${data.duration}</p>
                            <p><strong>Description:</strong> ${data.description}</p>
                        `;
                        videoContainer.style.height = 'auto'; // Ensure the video container adjusts in height
                    })
                    .catch(() => {
                        console.error('Error fetching video info');
                        videoInfoDiv.style.display = 'none';
                        errorElem.textContent = 'Failed to fetch video info. Please check the URL.';
                    });
            } else {
                errorElem.textContent = 'Please enter a YouTube URL.';
            }
        });

        downloadMp3Btn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                console.log('Requested MP3 download for URL:', url);
                window.location.href = `${apiBaseUrl}/mp3?url=${encodeURIComponent(url)}`;
            } else {
                errorElem.textContent = 'Please enter a YouTube URL.';
            }
        });

        downloadMp4Btn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                console.log('Requested MP4 download for URL:', url);
                window.location.href = `${apiBaseUrl}/mp4?url=${encodeURIComponent(url)}`;
            } else {
                errorElem.textContent = 'Please enter a YouTube URL.';
            }
        });
    })
    .catch(() => {
        alert('Failed to load API base URL.');
    });
