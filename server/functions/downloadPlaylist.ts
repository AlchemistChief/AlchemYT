import dotenv from 'dotenv'; dotenv.config();
import fs from 'fs';
import path from 'path';
import { Temp_Folder, getGlobalOptions } from '../assets/globals.ts';
import { logDownloadProgress } from './downloadProgress.ts';
import { sendDownloadedFile } from './sendFile.ts';
import { create as createYoutubeDl } from 'youtube-dl-exec';

const youtubedl = createYoutubeDl(path.join(__dirname, '..', 'bin', 'yt-dlp.exe'));

export const downloadPlaylist = async function (ws:WebSocket, url: string) {
    try {
        // Ensure the temporary folder exists
        if (!fs.existsSync(Temp_Folder)) {
            fs.mkdirSync(Temp_Folder, { recursive: true });
        }

        // Define temporary output file for a single audio download
        const Output_File = path.join(Temp_Folder, `download_${Date.now()}.m4a`); // Date.now() = Temporary download ID to avoid filename conflicts

        // Notify client the download is starting
        ws.send(JSON.stringify({ message: "Download started." }));

        // Enable spawning, which returns a ChildProcess allowing to attach event listeners.
        const proc = youtubedl.exec(url, getGlobalOptions(Output_File));

        // Listen for progress logs from STDOUT.
        logDownloadProgress(ws, proc);

        // When the process closes, pipe the resulting file as binary chunks via the WebSocket.
        sendDownloadedFile(ws, proc, Output_File);

    } catch (error:any) {
        ws.send(JSON.stringify({ error: error.message }));
        ws.close();
    }
};