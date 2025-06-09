// ────────── Module Importing ──────────
import fs from 'fs';
import path from 'path';
import type WebSocket from 'ws';
import { create } from 'youtube-dl-exec';

// ────────── Custom Modules ──────────
import { Temp_Folder, ytdlp_Binary, getGlobalOptions } from '../assets/globals.ts';
import { logDownloadProgress } from './downloadProgress.ts';
import { sendDownloadedFile } from './sendFile.ts';
import { notifyClient, deleteDirectory } from './utils.ts';

// ────────── YouTube-DL Setup ──────────
const youtubedl = create(ytdlp_Binary);

// ────────── Download File Function ──────────
export const downloadFile = async function (ws: WebSocket, url: string) {
    try {
        if (!fs.existsSync(Temp_Folder)) {
            fs.mkdirSync(Temp_Folder, { recursive: true });
        }

        const baseName = `download_${Date.now()}`;
        const outputExt = '.m4a';
        const Output_File = path.join(Temp_Folder, baseName + outputExt);

        const cachedFiles = fs.readdirSync(Temp_Folder).filter(f => f.startsWith(baseName) && f.endsWith(outputExt));
        if (cachedFiles.length > 0) {
            const cachedFile = path.join(Temp_Folder, cachedFiles[0]);
            notifyClient(ws, { message: "Cached file found. Sending file." });
            await sendDownloadedFile(ws, cachedFile);
            return;
        }

        notifyClient(ws, { message: "File Download started." });

        const proc = youtubedl.exec(url, getGlobalOptions(Output_File));

        logDownloadProgress(ws, proc);

        proc.on('close', async () => {
            await sendDownloadedFile(ws, Output_File);
        });
    } catch (error: any) {
        notifyClient(ws, { error: error.message }, true);
        ws.close();
    }
};
