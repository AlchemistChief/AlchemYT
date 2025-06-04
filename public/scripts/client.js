document.addEventListener("DOMContentLoaded", () => {
    // ────────── Global Variables ──────────
    let logContent = document.querySelector(".log-content");
    let logContainer = document.querySelector(".log-container");
    let currentDownloadTitle = "";

    // ────────── Logger Helpers ──────────
    function getTimestamp() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        return `[${hh}:${mm}]`;
    }

    // ────────── Logging Functionality ──────────
    function logMessage(message, type = "DEBUG", update = false) {
        const time = getTimestamp();
        const typeUpper = type.toUpperCase();

        if (update && typeUpper === "DEBUG") {
            let progressElem = document.getElementById("progress-log");
            if (!progressElem) {
                progressElem = document.createElement("p");
                progressElem.id = "progress-log";

                const timeSpan = document.createElement("span");
                timeSpan.style.fontWeight = "600";
                timeSpan.style.color = "#999";
                timeSpan.textContent = time + " ";

                const keywordSpan = document.createElement("span");
                keywordSpan.style.fontWeight = "600";
                keywordSpan.style.color = "#FFD700";
                keywordSpan.textContent = `[${typeUpper}] `;

                progressElem.appendChild(timeSpan);
                progressElem.appendChild(keywordSpan);
                progressElem.appendChild(document.createTextNode(message));
                logContent.appendChild(progressElem);
            } else {
                if (progressElem.childNodes.length > 2) {
                    progressElem.childNodes[2].nodeValue = message;
                } else {
                    progressElem.appendChild(document.createTextNode(message));
                }
            }
            progressElem.scrollIntoView();
        } else {
            const logEntry = document.createElement("p");

            const timeSpan = document.createElement("span");
            timeSpan.style.fontWeight = "600";
            timeSpan.style.color = "#999";
            timeSpan.textContent = time + " ";

            const keywordSpan = document.createElement("span");
            keywordSpan.style.fontWeight = "600";

            switch (typeUpper) {
                case "ERROR":
                    keywordSpan.style.color = "#FF0000";
                    break;
                case "VALID":
                    keywordSpan.style.color = "#00FF00";
                    break;
                case "DEBUG":
                default:
                    keywordSpan.style.color = "#FFD700";
                    break;
            }
            //const paddedType = `[${typeUpper}]`.padEnd(20, " ");
            //keywordSpan.textContent = paddedType;
            keywordSpan.textContent = `[${ typeUpper }]`;


            logEntry.appendChild(timeSpan);
            logEntry.appendChild(keywordSpan);
            logEntry.appendChild(document.createTextNode(message));

            logContent.appendChild(logEntry);
            logEntry.scrollIntoView();
            console.log(`${time} [${typeUpper}] ${message}`);
        }
    }

    // ────────── Downloading Functions ──────────
    let apiKey;
    let serverApiUrl;

    fetch('./settings')
        .then(res => res.json())
        .then(settings => {
            apiKey = settings["YT-APIKey"];
            serverApiUrl = settings["Server-APIURL"];
        });

    function normalizeYoutubeLink(link) {
        try {
            const url = new URL(link);
            const validDomains = ["m.youtube.com", "music.youtube.com", "youtu.be", "youtube.com"];
            if (!validDomains.some(domain => url.hostname.includes(domain))) {
                throw new Error("Invalid YouTube domain.");
            }
            let normalizedUrl, type, id;
            if (url.pathname.startsWith("/playlist")) {
                id = url.searchParams.get("list");
                normalizedUrl = `https://youtube.com/playlist?list=${id}`;
                type = "playlist";
            } else if (url.pathname.startsWith("/watch")) {
                id = url.searchParams.get("v") || url.pathname.slice(1);
                normalizedUrl = `https://youtube.com/watch?v=${id}`;
                type = "file";
            } else {
                throw new Error("Invalid YouTube URL format.");
            }
            logMessage(`Normalized URL: ${normalizedUrl}`, "VALID");
            return { normalizedUrl, type, id };
        } catch (error) {
            logMessage(error.message, "ERROR");
            return null;
        }
    }

    async function requestDownloadWs(type, normalizedUrl) {
        try {
            logMessage(`Starting WebSocket download`, "VALID");
            const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const wsUrl = protocol + serverApiUrl + '/ws/download';
            const socket = new WebSocket(wsUrl);
            socket.binaryType = "arraybuffer";

            let receivedBuffers = [];
            let totalBytes = 0;
            let filename = currentDownloadTitle + ".m4a";

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
                        const blob = new Blob(receivedBuffers);
                        const downloadUrl = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        receivedBuffers = [];
                        totalBytes = 0;
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
        currentDownloadTitle = title;
        const downloadContainer = document.querySelector('.download-container');
        downloadContainer.style.display = "block";
        const tableBody = downloadContainer.querySelector('tbody');

        const row = document.createElement('tr');
        row.classList.add('download-row');

        const titleColumn = document.createElement('td');
        titleColumn.classList.add('download-title');
        titleColumn.textContent = title;

        const buttonColumn = document.createElement('td');
        buttonColumn.classList.add('download-button');
        const button = document.createElement('button');
        button.textContent = type === "file" ? "Download MP3/M4A" : "Download Playlist";
        button.addEventListener('click', () => requestDownloadWs(type, normalizedUrl));

        buttonColumn.appendChild(button);
        row.appendChild(titleColumn);
        row.appendChild(buttonColumn);
        tableBody.appendChild(row);
    }

    function bindDownloadHandler() {
        document.querySelector('.fetch-button').addEventListener('click', async () => {
            const linkInputElement = document.querySelector('.link-input')
            const linkInput = linkInputElement.value;
            logMessage(`Input URL: ${linkInput}`, "DEBUG");

            const videoEmbed = document.querySelector('.video-embed');
            videoEmbed.style.display = "none";

            if (linkInput) {
                const result = normalizeYoutubeLink(linkInput);
                if (result) {
                    const { normalizedUrl, type, id } = result;
                    linkInputElement.value = normalizedUrl;

                    if (type === "file") {
                        logMessage(`Fetching video details for ID: ${id}`, "DEBUG");
                        const apiResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&part=snippet`);
                        const apiData = await apiResponse.json();
                        if (apiData.items && apiData.items.length > 0) {
                            const videoTitle = apiData.items[0].snippet.title;
                            showDownloadRow(videoTitle, type, normalizedUrl);
                            videoEmbed.style.display = "block";
                            videoEmbed.src = `https://www.youtube.com/embed/${id}`;
                            logMessage(`Successfully fetched video details for ID: ${id}`, "VALID");
                        } else {
                            logMessage("Failed to fetch video details.", "ERROR");
                        }
                    } else if (type === "playlist") {
                        logMessage(`Fetching playlist details for ID: ${id}`, "DEBUG");
                        const apiResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlists?id=${id}&key=${apiKey}&part=snippet`);
                        const apiData = await apiResponse.json();
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

    // ────────── Utility Functions ──────────
    async function requestCertificate() { //Manual Certificate Installation
        try {
            logMessage("Requesting certificate...", "DEBUG");
            const res = await fetch('/selfsigned.crt');
            if (!res.ok) throw new Error("Failed to fetch certificate");
            const cert = await res.text();
            const blob = new Blob([cert], { type: 'text/plain' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "selfsigned.crt";
            document.body.appendChild(a);
            a.click();
            a.remove();
            logMessage("Certificate downloaded", "VALID");
        } catch (error) {
            logMessage(error.message, "ERROR");
        }
    }

    // ────────── UI Helper Functions ──────────
    function toggleLogVisibility() {
        if (logContent.style.display === "none") {
            logContent.style.display = "block";
            logContainer.style.maxHeight = "300px";
        } else {
            logContent.style.display = "none";
            logContainer.style.maxHeight = "50px";
        }
    }
    function toggleSideMenuVisibility() {
        const menu = document.querySelector('.side-menu');
        menu.classList.toggle('active');
    }

    // ────────── Initialization: Bind events after DOM is loaded ──────────
    bindDownloadHandler();

    document.querySelector(".close-log").addEventListener("click", toggleLogVisibility);
    document.querySelector('.menu-toggle').addEventListener('click', toggleSideMenuVisibility);
    document.querySelector('.fetch-cert').addEventListener('click', requestCertificate);
});