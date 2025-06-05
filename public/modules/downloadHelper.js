// ────────── Fetch Details ──────────
export async function fetchVideoTitle(id, ) {
    return fetch(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&part=snippet`).json();
};

export async function fetchPlaylistTitle(id, apikey) {
    return fetch(`https://www.googleapis.com/youtube/v3/playlists?id=${id}&key=${apiKey}&part=snippet`).json();
};

// ────────── Log Progress ──────────
export function logProgress(msg, filename, type) {
    if (type === "download-progress" && msg.downloaded && msg.total && msg.percent) {
        const progressText = `Download: "${filename}" || ${msg.downloaded}/${msg.total} (${msg.percent}%)`;
        logMessage(progressText, "DEBUG", true);
    } else if (type === "package-progress" && msg.packaged && msg.total && msg.percent) {
        const packageText = `Packaging: ${msg.packaged}/${msg.total} (${msg.percent}%)`;
        logMessage(packageText, "DEBUG", true);
    } else {
        logMessage(`Progress: ${msg.progress}`, "DEBUG", true);
    }
};

// ────────── Fetch Server ettings ──────────
export let apiKey, serverApiUrl;
fetch('./settings')
    .then(res => res.json())
    .then(s => {
        apiKey = s["YT-APIKey"];
        serverApiUrl = s["Server-APIURL"];
    })
