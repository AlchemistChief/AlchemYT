// ────────── Module Importing ──────────
import fs from 'fs';
import path from 'path';
import type WebSocket from 'ws';
import { create } from 'youtube-dl-exec';

// ────────── Custom Modules ──────────
import { Temp_Folder, getGlobalOptions } from '../assets/globals.ts';
import { logDownloadProgress } from './downloadProgress.ts';
import { sendDownloadedFile } from './sendFile.ts';
import { notifyClient, deleteDirectory } from './utils.ts';

// ────────── YouTube-DL Setup ──────────
const youtubedl = create(path.join(__dirname, '..', 'bin', 'yt-dlp.exe'));

// ────────── Download File Function ──────────
export const downloadFile = async function (ws: WebSocket, url: string) {
    try {
        // Ensure the temporary folder exists
        if (!fs.existsSync(Temp_Folder)) {
            fs.mkdirSync(Temp_Folder, { recursive: true });
        }

        // Define temporary output file with unique ID to avoid filename conflicts
        const Output_File = path.join(Temp_Folder, `download_${Date.now()}.m4a`);

        // Notify client the download is starting
        notifyClient(ws, { message: "File Download started." });

        // Spawn the download process
        const proc = youtubedl.exec(url, getGlobalOptions(Output_File));

        // Listen for progress logs from STDOUT
        logDownloadProgress(ws, proc);

        // When the process closes, send the resulting file via WebSocket
        proc.on('close', async () => {
            await sendDownloadedFile(ws, Output_File);
            deleteDirectory(Output_File);
        });

    } catch (error: any) {
        notifyClient(ws, { error: error.message }, true);
        ws.close();
    }
};