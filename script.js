async function fetchVideoInfo() {
    const url = document.getElementById('videoUrl').value;

    if (!url) {
        alert('Please enter a valid YouTube URL');
        return;
    }

    // Show a loading message or indicator
    document.getElementById('videoTitle').textContent = "Loading video info...";
    document.getElementById('downloadLink').style.display = 'none';

    try {
        // API request to Replit backend
        const response = await fetch(`https://efab6203-87f8-4f41-b157-377e4e459507-00-1iw7j6gn8wxm9.kirk.replit.dev/fetch-video?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.success) {
            // Show video info and download link
            document.getElementById('videoTitle').textContent = `Video Title: ${data.title}`;
            document.getElementById('downloadLink').href = data.downloadUrl;
            document.getElementById('downloadLink').style.display = 'inline';
        } else {
            alert('Failed to fetch video info');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
