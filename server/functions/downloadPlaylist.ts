// ────────── Module Importing ──────────
import fs from 'fs';
import path from 'path';
import type WebSocket from 'ws';
import { create } from 'youtube-dl-exec';

// ────────── Custom Modules ──────────
import { Temp_Folder, getGlobalOptions } from '../assets/globals.ts';
import { logDownloadProgress } from './downloadProgress.ts';
import { sendDownloadedFile } from './sendFile.ts';
import { packagePlaylist } from './packagePlaylist.ts';
import { notifyClient, extractPlaylistID } from './utils.ts';


// ────────── YouTube-DL Setup ──────────
const youtubedl = create(path.join(__dirname, '..', 'bin', 'yt-dlp.exe'));

// ────────── Download Playlist Function ──────────
export const downloadPlaylist = async function (ws: WebSocket, url: string) {
    try {
        // Ensure the temporary folder exists
        if (!fs.existsSync(Temp_Folder)) fs.mkdirSync(Temp_Folder, { recursive: true });

        // Extract playlist ID from URL query param `list`
        const playlistID = extractPlaylistID(url);

        // Create playlist folder inside temp using playlist ID
        const playlistFolder = path.join(Temp_Folder, playlistID);
        if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder, { recursive: true });

        // Output template inside the playlist folder
        const Output_File = path.join(playlistFolder, `%(title)s.%(ext)s`);

        // Notify client the download is starting
        notifyClient(ws, { message: "Playlist Download started." });

        // Spawn the download process
        const proc = youtubedl.exec(url, getGlobalOptions(Output_File));

        // Listen for progress logs from STDOUT
        logDownloadProgress(ws, proc);

        // When the process closes, send the resulting file via WebSocket
        proc.on('close', async () => {
            // Package the playlist after download
            await packagePlaylist(ws, playlistFolder);
            // Send the packaged playlist file
            sendDownloadedFile(ws, playlistFolder + '.zip');
        });

    } catch (error: any) {
        notifyClient(ws, { error: error.message }, true);
        ws.close();
    }
};