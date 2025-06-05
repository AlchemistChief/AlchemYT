// ────────── Module Importing ──────────
import type WebSocket from 'ws';

// ────────── Utilities ──────────
export function extractPlaylistID(url: string): string {
    if (!url.includes('playlist')) return null;
    const playlistIDMatch = url.match(/[?&]list=([^&]+)/);
    const playlistID = playlistIDMatch ? playlistIDMatch[1] : `playlist_${Date.now()}`;

    return playlistID;
}

export function normalizeYoutubeLink(link:string) {
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
        return {normalizedUrl, type};
    } catch (error:any) {
        return null;
    }
};

export function notifyClient(ws: WebSocket, message: object, consoleLog: boolean = false) {

    if (!ws || !message) {
        console.error("Missing Parameter in Function");
        return;
    };

    ws.send(JSON.stringify(message));

    if (consoleLog) {console.log("Client Notification:", message);};
}

/* equal to:
notifyClient(ws, { error: 'Invalid message format' })
ws.send(JSON.stringify({ error: 'Invalid message format' }));

Valid Message Type Examples:
 - { error: 'Error message' }
 - { message: 'Informational message' }
*/
