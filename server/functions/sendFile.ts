// ────────── Module Importing ──────────
import path from 'path';
import fs from 'fs';
import type WebSocket from 'ws';
import { TinyspawnPromise } from 'tinyspawn';

// ────────── Custom Modules ──────────
import { notifyClient } from './utils.ts';

// ────────── Send Downloaded File Function ──────────
export const sendDownloadedFile = function (ws: WebSocket, Output_File: string) {



        const readStream = fs.createReadStream(Output_File);
        readStream.on('data', (chunk) => {
            if (process.env.output_ChunkData === 'true') {
                console.log(`Sending chunk of ${chunk.length} bytes`);
            }
            ws.send(chunk);
        });
        readStream.on('end', () => {
            // Send file extension to the client
            notifyClient(ws, { status: "done", extension: path.extname(Output_File) });
            fs.unlink(Output_File, (err) => {
                if (err) console.error("Error deleting temp file", err);
            });
        });
        readStream.on('error', (err) => {
            notifyClient(ws, { error: err.message }, true);
            ws.close();
        });
};