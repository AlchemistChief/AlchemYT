// ────────── Module Importing ──────────
import { WebSocket } from 'ws';
import fs from 'fs';

// ────────── Custom Modules ──────────
// ────────── Utils Module (Backend) ──────────

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

export const deleteDirectory = async function (targetPath: string) {
    const delay = 60 * 1000;
    setTimeout(async () => {
        try {
            if (fs.existsSync(targetPath)) {
                const stat = fs.statSync(targetPath);
                if (stat.isDirectory()) {
                    await fs.promises.rm(targetPath, { recursive: true, force: true });
                } else {
                    await fs.promises.unlink(targetPath);
                }
            }
        } catch (error) {
            console.log("Error deleting directory:", error);
            return null;
        }
    }, delay);
};

export function notifyClient(ws: WebSocket, message: object, consoleLog: boolean = false) {

    if (!ws || !message) {
        console.error("Missing Parameter in Function");
        return;
    };

    if (consoleLog) {console.log("Client Notification:", message);};

    ws.send(JSON.stringify(message));
}

// ────────── Colsole Coloring ──────────
type Color = 'red' | 'green' | 'blue' | 'orange' | 'gold' | 'white';
type Weight = 'normal' | 'bold';

interface ColorOptions {
    color?: Color;
    weight?: Weight;
};

const colorCodes: Record<Color, number> = {
    red: 196,
    green: 46,
    blue: 75,
    orange: 208,
    gold: 220,
    white: 37,
};
const weightCodes: Record<Weight, number> = {
    normal: 22, // Normal intensity
    bold: 1,    // Bold
};

export function colorizeANSI(
    text: string,
    options: ColorOptions = {}
): string {

    const colorCode = colorCodes[options.color ?? 'white'] ?? colorCodes.white;
    const weightCode = weightCodes[options.weight ?? 'normal'] ?? weightCodes.normal;

    return `\x1b[${weightCode};38;5;${colorCode}m${text}\x1b[0m`;
};