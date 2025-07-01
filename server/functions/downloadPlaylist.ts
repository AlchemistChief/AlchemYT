// ────────── Module Importing ──────────
import fs from 'fs';
import path from 'path';
import type WebSocket from 'ws';
import { create } from 'youtube-dl-exec';

// ────────── Custom Modules ──────────
import { Temp_Folder, ytdlp_Binary, getGlobalOptions } from '../assets/globals.ts';
import { logDownloadProgress } from './downloadProgress.ts';
import { sendDownloadedFile } from './sendFile.ts';
import { packagePlaylist } from './packagePlaylist.ts';
import { notifyClient, deleteDirectory, extractPlaylistID } from './utils.ts';


// ────────── YouTube-DL Setup ──────────
const youtubedl = create(ytdlp_Binary);

// ────────── Download Playlist Function ──────────
export const downloadPlaylist = async function (ws: WebSocket, url: string) {
    try {
        if (!fs.existsSync(Temp_Folder)) fs.mkdirSync(Temp_Folder, { recursive: true });

        const playlistID = extractPlaylistID(url);
        const playlistFolder = path.join(Temp_Folder, playlistID);
        const zipFile = playlistFolder + '.zip';

        if (fs.existsSync(zipFile)) {
            notifyClient(ws, { message: "Cached playlist found. Sending file." });
            await sendDownloadedFile(ws, zipFile);
            return;
        }

        if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder, { recursive: true });

        const Output_File = path.join(playlistFolder, `%(title)s.m4a`);

        notifyClient(ws, { message: "Playlist Download started." });

        const proc = youtubedl.exec(url, getGlobalOptions(Output_File));

        logDownloadProgress(ws, proc);

        proc.on('close', async () => {
            await packagePlaylist(ws, playlistFolder);
            await sendDownloadedFile(ws, zipFile);
            deleteDirectory(playlistFolder);
            deleteDirectory(zipFile);
        });
    } catch (error: any) {
        notifyClient(ws, { error: error.message }, true);
        ws.close();
    }
};