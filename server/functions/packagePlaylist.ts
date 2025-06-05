// ────────── Module Importing ──────────
import fs from 'fs';
import archiver from 'archiver';
import type WebSocket from 'ws';

// ────────── Custom Modules ──────────
import { logPackageProgress } from './packageProgress.ts';
import { notifyClient } from './utils.ts';

// ────────── Package Playlist Function ──────────
export const packagePlaylist = function (ws: WebSocket, playlistFolder: string) {
    return new Promise<void>((resolve, reject) => {
        const zipPath = playlistFolder + '.zip';
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Zipped ${archive.pointer()} total bytes`);
            resolve();
        });
        output.on('error', err => reject(err));
        archive.on('error', err => {
            notifyClient(ws, { error: err.message }, true);
            reject(err);
        });

        logPackageProgress(ws, archive);

        archive.pipe(output);
        archive.directory(playlistFolder, false);
        archive.finalize();
    });
};
