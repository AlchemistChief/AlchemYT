// ────────── Module Importing ──────────
import { logMessage } from './logHandler.js';
import { normalizeYoutubeLink } from './utils.js';
import { fetchVideoTitle, fetchPlaylistTitle, apiKey } from './downloadHelper.js';
import { withSession, sendMessage, setMessageHandler } from './webSocketHandler.js';

// ────────── Download State ──────────
let receivedBuffers = [];
//let currentSocket = null; XXX
let currentButton = null;
let currentTitle = '';
let progressID = 0;

// ────────── Request Download via WebSocket ──────────
export function requestDownload(normalizedUrl, title, button) {
    withSession(() => {
        logMessage(`Starting download: ${title}`, 'VALID');
        currentButton = button;
        currentTitle = title;
        receivedBuffers = [];
        progressID = Date.now();

        currentButton.disabled = true;
        currentButton.textContent = 'Downloading...';

        // Send URL to server to initiate download
        sendMessage({ url: normalizedUrl });

        // Set currentSocket to active socket
        currentSocket = null; // We'll set it in message handler when needed
    });
}

// ────────── Handle Incoming WebSocket Messages ──────────
function handleMessage(data, event) {
    if (typeof data === 'object' && data instanceof ArrayBuffer) {
        // Binary data received - collect chunks
        receivedBuffers.push(new Uint8Array(data));
    } else if (typeof data === 'object') {
        if (data.error) {
            logMessage(`Server error: ${data.error}`, 'ERROR');
            if (currentButton) {
                currentButton.disabled = false;
                currentButton.textContent = 'Download MP3/M4A';
            }
        } else if (data.status === 'done') {
            finalizeDownload(receivedBuffers, currentTitle + data.extension);
        } else if (data.status === 'download-progress' || data.status === 'package-progress') {
            logProgress(data, currentTitle, data.status, progressID);
        }
    }
}

// ────────── Log Progress Updates ──────────
function logProgress(msg, title, type, progressID) {
    const skipPatterns = ['Destination:', 'has already been downloaded'];
    if (msg.progress && skipPatterns.some(p => msg.progress.includes(p))) return;

    if (type === 'download-progress' && msg.downloaded && msg.total && msg.percent) {
        const progressText = `Download: "${msg.title || title}" || ${msg.downloaded}/${msg.total} (${msg.percent}%)`;
        logMessage(progressText, 'DEBUG', true, progressID + msg.total);
    } else if (type === 'package-progress' && msg.packaged && msg.total && msg.percent) {
        const packageText = `Packaging: "${msg.title || title}" || ${msg.packaged}/${msg.total} (${msg.percent}%)`;
        logMessage(packageText, 'DEBUG', true, progressID);
    } else if (msg.progress) {
        logMessage(`Progress: ${msg.progress}`, 'DEBUG');
    }
}

// ────────── Finalize and Save Downloaded File ──────────
function finalizeDownload(receivedBuffers, filename) {
    logMessage(`Download complete: ${filename}`, 'VALID');
    const blob = new Blob(receivedBuffers);
    const blobUrl = window.URL.createObjectURL(blob);

    if (!currentButton) return;

    const oldButton = currentButton;

    // Create new button to avoid duplicate event listeners
    const newButton = oldButton.cloneNode(true);
    newButton.textContent = 'Save File';
    newButton.disabled = false;
    newButton.classList.add('save-button');

    // Replace old button with new one
    oldButton.replaceWith(newButton);

    // Add click handler to save file
    newButton.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });

    bindDownloadAllButton();

    // Reset state
    receivedBuffers.length = 0;
    currentButton = null;
    currentTitle = '';
}

// ────────── Bind "Download All" Button ──────────
function bindDownloadAllButton() {
    const downloadAllBtn = document.getElementById('download-all');
    if (!downloadAllBtn) return;

    downloadAllBtn.style.display = 'block';

    // Remove previous listeners to prevent duplicates
    const newBtn = downloadAllBtn.cloneNode(true);
    downloadAllBtn.replaceWith(newBtn);

    newBtn.addEventListener('click', () => {
        const saveButtons = document.querySelectorAll('.save-button');
        saveButtons.forEach(btn => btn.click());
    });
}

// ────────── Show Download Row in UI ──────────
export function showDownloadRow(title, type, normalizedUrl) {
    const downloadContainer = document.querySelector('.download-container');
    if (!downloadContainer) return;

    downloadContainer.style.display = 'block';

    const row = document.createElement('tr');
    row.classList.add('download-row');

    const titleColumn = document.createElement('td');
    titleColumn.classList.add('download-title');
    titleColumn.textContent = title;

    const buttonColumn = document.createElement('td');
    buttonColumn.classList.add('download-button');

    const button = document.createElement('button');
    button.textContent = type === 'file' ? 'Download MP3/M4A' : 'Download Playlist';

    button.addEventListener('click', () => {
        requestDownload(normalizedUrl, title, button);
    });

    buttonColumn.appendChild(button);
    row.appendChild(titleColumn);
    row.appendChild(buttonColumn);
    downloadContainer.querySelector('tbody').appendChild(row);
}

// ────────── Handle File Download ──────────
export async function handleFileDownload(id, normalizedUrl, videoEmbed) {
    const apiData = await fetchVideoTitle(id, apiKey);
    if (apiData.items && apiData.items.length > 0) {
        const videoTitle = apiData.items[0].snippet.title;
        showDownloadRow(videoTitle, 'file', normalizedUrl);

        if (videoEmbed) {
            videoEmbed.style.display = 'block';
            videoEmbed.src = `https://www.youtube.com/embed/${id}`;
        }

        logMessage(`Fetched video details for ID: ${id}`, 'VALID');
    } else {
        logMessage('Failed to fetch video details.', 'ERROR');
    }
}

// ────────── Handle Playlist Download ──────────
export async function handlePlaylistDownload(id, normalizedUrl) {
    const apiData = await fetchPlaylistTitle(id, apiKey);
    if (apiData.items && apiData.items.length > 0) {
        const playlistTitle = apiData.items[0].snippet.title;
        showDownloadRow(playlistTitle, 'playlist', normalizedUrl);
        logMessage(`Fetched playlist details for ID: ${id}`, 'VALID');
    } else {
        logMessage('Failed to fetch playlist details.', 'ERROR');
    }
}

// ────────── Bind Download Button Handler ──────────
export function bindDownloadHandler() {
    const fetchButton = document.querySelector('.fetch-button');
    if (!fetchButton) return;

    fetchButton.addEventListener('click', async () => {
        const linkInputElement = document.querySelector('.link-input');
        if (!linkInputElement) return;

        const linkInput = linkInputElement.value;
        const videoEmbed = document.querySelector('.video-embed');

        if (videoEmbed) videoEmbed.style.display = 'none';

        if (linkInput) {
            const result = normalizeYoutubeLink(linkInput);
            if (result) {
                const { normalizedUrl, type, id } = result;
                linkInputElement.value = normalizedUrl;

                if (type === 'file') {
                    await handleFileDownload(id, normalizedUrl, videoEmbed);
                } else if (type === 'playlist') {
                    await handlePlaylistDownload(id, normalizedUrl);
                }
            }
        } else {
            logMessage('Please enter a YouTube link.', 'ERROR');
        }
    });
}

// ────────── Register WebSocket Message Handler ──────────
setMessageHandler(handleMessage);
