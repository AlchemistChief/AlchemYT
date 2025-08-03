// ────────── Module Importing ──────────
import { logMessage } from './logHandler.js';

// ────────── Custom Modules ──────────
// ────────── Utils Module (Frontend) ──────────

// ────────── Youtube Link Normalization ──────────
export function normalizeYoutubeLink(link) {
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
};
