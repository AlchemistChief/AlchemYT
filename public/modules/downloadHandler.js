// ────────── Module Importing ──────────
import { logMessage } from './logHandler.js';
import { normalizeYoutubeLink } from './utils.js';
import { fetchVideoTitle, fetchPlaylistTitle, apiKey, serverApiUrl} from './downloadHelper.js';

// ────────── WebSocket Download Function ──────────
async function requestDownloadWs(normalizedUrl, title, button) {
    try {
        logMessage(`Starting WebSocket download`, "VALID");
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = protocol + serverApiUrl + '/ws/download';
        const socket = new WebSocket(wsUrl);
        socket.binaryType = "arraybuffer";
        socket.button = button;
        let receivedBuffers = [];

        button.disabled = true;
        button.textContent = 'Downloading...';

        socket.onopen = () => {
            socket.send(JSON.stringify({ url: normalizedUrl }));
            logMessage(`WebSocket connected, download started`, "DEBUG");
        };

        socket.onmessage = handleWebSocketMessage.bind(null, title, receivedBuffers, socket, Date.now());

        socket.onerror = () => {
            logMessage(`WebSocket error`, "ERROR");
            button.disabled = false;
            button.textContent = 'Download MP3/M4A';
        };

        socket.onclose = () => {
            logMessage(`WebSocket closed`, "DEBUG");
        };
    } catch (error) {
        logMessage(`WebSocket download error: ${error.message}`, "ERROR");
        button.disabled = false;
        button.textContent = 'Download MP3/M4A';
    }
}

// ────────── Log Progress ──────────
function logProgress(msg, title, type, progressID) {
    const skipPatterns = ['Destination:', 'has already been downloaded'];
    if (msg.progress && skipPatterns.some(p => msg.progress.includes(p))) {
        return;
    }

    if (type === "download-progress" && msg.downloaded && msg.total && msg.percent) {
        const progressText = `Download: "${msg.title || title}" || ${msg.downloaded}/${msg.total} (${msg.percent}%)`;
        logMessage(progressText, "DEBUG", true, progressID + msg.total);
    } else if (type === "package-progress" && msg.packaged && msg.total && msg.percent) {
        const packageText = `Packaging: "${msg.title || title}" || ${msg.packaged}/${msg.total} (${msg.percent}%)`;
        logMessage(packageText, "DEBUG", true, progressID);
    } else if (msg.progress) {
        logMessage(`Progress: ${msg.progress}`, "DEBUG");
    }
};

// ────────── Handle WebSocket Messages ──────────
function handleWebSocketMessage(title, receivedBuffers, socket, progressID, event) {
    if (typeof event.data === "string") {
        let msg;
        try {
            msg = JSON.parse(event.data);
        } catch {
            logMessage(`Invalid JSON from server: ${event.data}`, "ERROR");
            return;
        }
        if (msg.error) {
            logMessage(`Server error: ${msg.error}`, "ERROR");
            socket.close();
            socket.button.disabled = false;
            socket.button.textContent = 'Download MP3/M4A';
        } else if (msg.status === "done") {
            finalizeDownload(receivedBuffers, title + msg.extension, socket);
        } else if (msg.status === "download-progress") {
            logProgress(msg, title, "download-progress", progressID);
        } else if (msg.status === "package-progress") {
            logProgress(msg, title, "package-progress", progressID);
        }
    } else if (event.data instanceof ArrayBuffer) {
        receivedBuffers.push(new Uint8Array(event.data));
    }
}

// ────────── Finalize Download ──────────
function finalizeDownload(receivedBuffers, filename, socket) {
    logMessage(`Download complete. Received ${filename}`, "VALID");
    const blob = new Blob(receivedBuffers);
    const blobUrl = window.URL.createObjectURL(blob);
    const oldButton = socket.button;

    // Clone button to remove original listener
    const newButton = oldButton.cloneNode(true);
    newButton.textContent = 'Save File';
    newButton.disabled = false;
    newButton.classList.add('save-button');

    // Remove any previous click listeners on this button to avoid duplicates
    newButton.replaceWith(newButton.cloneNode(true));
    const cleanButton = oldButton.parentNode.querySelector('.save-button') || newButton;

    cleanButton.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });

    oldButton.replaceWith(cleanButton);
    bindDownloadAllButton();

    receivedBuffers.length = 0;
    socket.close();
}

// ────────── Ensure "Download All" Button Exists ──────────
function bindDownloadAllButton() {
    const downloadAllBtn = document.getElementById('download-all');
    if (!downloadAllBtn) return;

    downloadAllBtn.style.display = 'block';

    // Remove existing listener before adding new one to prevent duplicates
    const newBtn = downloadAllBtn.cloneNode(true);
    downloadAllBtn.replaceWith(newBtn);

    newBtn.addEventListener('click', () => {
        const saveButtons = document.querySelectorAll('.save-button');
        saveButtons.forEach(btn => btn.click());
    });
}

// ────────── Show Download Row ──────────
function showDownloadRow(title, type, normalizedUrl) {
    const downloadContainer = document.querySelector('.download-container');
    downloadContainer.style.display = "block";

    const row = document.createElement('tr');
    row.classList.add('download-row');

    const titleColumn = document.createElement('td');
    titleColumn.classList.add('download-title');
    titleColumn.textContent = title;

    const buttonColumn = document.createElement('td');
    buttonColumn.classList.add('download-button');
    const button = document.createElement('button');
    button.textContent = type === "file" ? "Download MP3/M4A" : "Download Playlist";
    button.addEventListener('click', () => requestDownloadWs(normalizedUrl, title, button));

    buttonColumn.appendChild(button);
    row.appendChild(titleColumn);
    row.appendChild(buttonColumn);
    downloadContainer.querySelector('tbody').appendChild(row);
};

// ────────── Helper Functions ──────────
async function handleFileDownload(id, normalizedUrl, videoEmbed) {
    const apiData = await fetchVideoTitle(id, apiKey);
    if (apiData.items && apiData.items.length > 0) {
        const videoTitle = apiData.items[0].snippet.title;
        showDownloadRow(videoTitle, "file", normalizedUrl);
        videoEmbed.style.display = "block";
        videoEmbed.src = `https://www.youtube.com/embed/${id}`;
        logMessage(`Successfully fetched video details for ID: ${id}`, "VALID");
    } else {
        logMessage("Failed to fetch video details.", "ERROR");
    }
}

async function handlePlaylistDownload(id, normalizedUrl) {
    const apiData = await fetchPlaylistTitle(id, apiKey);
    if (apiData.items && apiData.items.length > 0) {
        const playlistTitle = apiData.items[0].snippet.title;
        showDownloadRow(playlistTitle, "playlist", normalizedUrl);
        logMessage(`Successfully fetched playlist details for ID: ${id}`, "VALID");
    } else {
        logMessage("Failed to fetch playlist details.", "ERROR");
    }
}

// ────────── Bind Download Handler ──────────
export function bindDownloadHandler() {
    const fetchButton = document.querySelector('.fetch-button');

    if (!fetchButton) return; // Guard statement

    fetchButton.addEventListener('click', async () => {
        const linkInputElement = document.querySelector('.link-input');
        const linkInput = linkInputElement.value;


        const videoEmbed = document.querySelector('.video-embed');
        videoEmbed.style.display = "none";

        if (linkInput) {
            const result = normalizeYoutubeLink(linkInput);
            if (result) {
                const { normalizedUrl, type, id } = result;
                linkInputElement.value = normalizedUrl;

                if (type === "file") {
                    await handleFileDownload(id, normalizedUrl, videoEmbed);
                } else if (type === "playlist") {
                    await handlePlaylistDownload(id, normalizedUrl);
                }
            }
        } else {
            logMessage('Please enter a YouTube link.', "ERROR");
        }
    });
}