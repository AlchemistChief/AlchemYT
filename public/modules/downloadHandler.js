  // ────────── Module Importing ──────────
import { logMessage } from './logHandler.js';
import { normalizeYoutubeLink } from './utils.js';

  // ──────────  ──────────  ──────────  ──────────  ──────────  ──────────

  // ────────── Global Variables ──────────
let currentDownloadTitle = "";
let apiKey;
let serverApiUrl;

fetch('./settings')
    .then(res => res.json())
    .then(settings => {
        apiKey       = settings["YT-APIKey"];
        serverApiUrl = settings["Server-APIURL"];
    });

  // ────────── Download Function ──────────
async function requestDownloadWs(type, normalizedUrl) {
    try {
        logMessage(`Starting WebSocket download`, "VALID");
        const protocol          = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl             = protocol + serverApiUrl + '/ws/download';
        const socket            = new WebSocket(wsUrl);
              socket.binaryType = "arraybuffer";

        let receivedBuffers = [];
        let totalBytes      = 0;
        let filename        = currentDownloadTitle + ".m4a";

        socket.onopen = () => {
            socket.send(JSON.stringify({ url: normalizedUrl, type: type }));
            logMessage(`WebSocket connected, download started`, "DEBUG");
        };

        socket.onmessage = (event) => {
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
                } else if (msg.filename) {
                    filename = currentDownloadTitle + ".m4a";
                    logMessage(`Receiving file: ${filename}`, "VALID");
                } else if (msg.status === "done") {
                    logMessage(`Download complete`, "VALID");
                    const blob        = new Blob(receivedBuffers);
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a           = document.createElement("a");
                          a.href      = downloadUrl;
                          a.download  = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    receivedBuffers = [];
                    totalBytes      = 0;
                    socket.close();
                } else if (msg.status === "progress") {
                    if (msg.downloaded && msg.total && msg.percent) {
                        const progressText = `Download: "${filename}" || ${msg.downloaded}/${msg.total} (${msg.percent}%)`;
                        logMessage(progressText, "DEBUG", true);
                    } else {
                        logMessage(`Progress: ${msg.progress}`, "DEBUG", true);
                    }
                }
            } else if (event.data instanceof ArrayBuffer) {
                receivedBuffers.push(new Uint8Array(event.data));
                totalBytes += event.data.byteLength;
            }
        };

        socket.onerror = () => {
            logMessage(`WebSocket error`, "ERROR");
        };

        socket.onclose = () => {
            logMessage(`WebSocket closed`, "DEBUG");
        };
    } catch (error) {
        logMessage(`WebSocket download error: ${error.message}`, "ERROR");
    }
}

function showDownloadRow(title, type, normalizedUrl) {
          currentDownloadTitle            = title;
    const downloadContainer               = document.querySelector('.download-container');
          downloadContainer.style.display = "block";
    const tableBody                       = downloadContainer.querySelector('tbody');

    const row = document.createElement('tr');
    row.classList.add('download-row');

    const titleColumn = document.createElement('td');
    titleColumn.classList.add('download-title');
    titleColumn.textContent = title;

    const buttonColumn = document.createElement('td');
    buttonColumn.classList.add('download-button');
    const button             = document.createElement('button');
          button.textContent = type === "file" ? "Download MP3/M4A" : "Download Playlist";
    button.addEventListener('click', () => requestDownloadWs(type, normalizedUrl));

    buttonColumn.appendChild(button);
    row.appendChild(titleColumn);
    row.appendChild(buttonColumn);
    tableBody.appendChild(row);
}

export function bindDownloadHandler() {
    const fetchButton = document.querySelector('.fetch-button')

    if (!fetchButton) return // Guard statement

    fetchButton.addEventListener('click', async () => {
        const linkInputElement = document.querySelector('.link-input')
        const linkInput        = linkInputElement.value;
        logMessage(`Input URL: ${linkInput}`, "DEBUG");

        const videoEmbed               = document.querySelector('.video-embed');
              videoEmbed.style.display = "none";

        if (linkInput) {
            const result = normalizeYoutubeLink(linkInput);
            if (result) {
                const { normalizedUrl, type, id } = result;
                linkInputElement.value            = normalizedUrl;

                if (type === "file") {
                    logMessage(`Fetching video details for ID: ${id}`, "DEBUG");
                    const apiResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&part=snippet`);
                    const apiData     = await apiResponse.json();
                    if (apiData.items && apiData.items.length > 0) {
                        const videoTitle = apiData.items[0].snippet.title;
                        showDownloadRow(videoTitle, type, normalizedUrl);
                        videoEmbed.style.display = "block";
                        videoEmbed.src           = `https://www.youtube.com/embed/${id}`;
                        logMessage(`Successfully fetched video details for ID: ${id}`, "VALID");
                    } else {
                        logMessage("Failed to fetch video details.", "ERROR");
                    }
                } else if (type === "playlist") {
                    logMessage(`Fetching playlist details for ID: ${id}`, "DEBUG");
                    const apiResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlists?id=${id}&key=${apiKey}&part=snippet`);
                    const apiData     = await apiResponse.json();
                    if (apiData.items && apiData.items.length > 0) {
                        const playlistTitle = apiData.items[0].snippet.title;
                        showDownloadRow(playlistTitle, type, normalizedUrl);
                        logMessage(`Successfully fetched playlist details for ID: ${id}`, "VALID");
                    } else {
                        logMessage("Failed to fetch playlist details.", "ERROR");
                    }
                }
            }
        } else {
            logMessage('Please enter a YouTube link.', "ERROR");
        }
    });
}