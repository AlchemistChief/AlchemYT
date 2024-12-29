// Load the API base URL from the JSON file
async function loadApiUrl() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data.apiBaseUrl;
    } catch (error) {
        console.error('Error loading JSON:', error);
        alert('Failed to load API configuration');
        return null;
    }
}

async function fetchVideoInfo() {
    const url = document.getElementById('videoUrl').value;

    if (!url) {
        alert('Please enter a valid YouTube URL');
        return;
    }

    // Show a loading message or indicator
    document.getElementById('videoTitle').textContent = "Loading video info...";
    document.getElementById('downloadLinks').style.display = 'none';  // Hide download links initially

    // Get the API base URL from the JSON file
    const apiBaseUrl = await loadApiUrl();

    if (!apiBaseUrl) {
        alert('API URL could not be loaded');
        return;
    }

    try {
        // Make the API request to Replit backend using the URL from the JSON
        const response = await fetch(`${apiBaseUrl}/info?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.title) {
            // Show video info
            document.getElementById('videoTitle').textContent = `Video Title: ${data.title}`;
            
            // Show download links section
            document.getElementById('downloadLinks').style.display = 'block';

            // Enable MP3 and MP4 download links
            document.getElementById('mp3DownloadLink').href = `${apiBaseUrl}/mp3?url=${encodeURIComponent(url)}`;
            document.getElementById('mp3DownloadLink').style.display = 'inline';

            document.getElementById('mp4DownloadLink').href = `${apiBaseUrl}/mp4?url=${encodeURIComponent(url)}`;
            document.getElementById('mp4DownloadLink').style.display = 'inline';
        } else {
            alert('Failed to fetch video info');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
