// ────────── Fetch Details ──────────
export async function fetchVideoTitle(id, apiKey) {
    return fetch(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&part=snippet`)
        .then(response => response.json());
};

export async function fetchPlaylistTitle(id, apiKey) {
    return fetch(`https://www.googleapis.com/youtube/v3/playlists?id=${id}&key=${apiKey}&part=snippet`)
        .then(response => response.json());
};

// ────────── Fetch Server ettings ──────────
export let apiKey, serverApiUrl;
fetch('./settings')
    .then(res => res.json())
    .then(s => {
        apiKey = s["YT-APIKey"];
        serverApiUrl = s["Server-APIURL"];
    })
