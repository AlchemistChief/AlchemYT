// ────────── Module Importing ──────────
import path from 'path';
import fs from 'fs';
import type WebSocket from 'ws';
import { TinyspawnPromise } from 'tinyspawn';

// ────────── Custom Modules ──────────
import { notifyClient } from './utils.ts';

// ────────── Send Downloaded File Function ──────────
export const sendDownloadedFile = function (ws: WebSocket, Output_File: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(Output_File);
        readStream.on('data', (chunk) => {
            if (process.env.output_ChunkData === 'true') {
                console.log(`Sending chunk of ${chunk.length} bytes`);
            }
            ws.send(chunk);
        });
        readStream.on('end', () => {
            notifyClient(ws, { status: "done", extension: path.extname(Output_File) });
            resolve();
        });
        readStream.on('error', (err) => {
            notifyClient(ws, { error: err.message }, true);
            ws.close();
            reject(err);
        });
    });
};

