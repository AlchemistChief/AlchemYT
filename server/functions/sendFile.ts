import path from 'path';
import fs from 'fs';
import { TinyspawnPromise } from 'tinyspawn';

export const sendDownloadedFile = function (ws:WebSocket, proc:TinyspawnPromise, Output_File:string) {
    proc.on('close', (code) => {
        console.log(`Process closed with code ${code}`);
        // Send filename to the client:
        ws.send(JSON.stringify({ filename: path.basename(Output_File) }));

        const readStream = fs.createReadStream(Output_File);
        readStream.on('data', (chunk) => {
            if (process.env.output_ChunkData === 'true') {
                console.log(`Sending chunk of ${chunk.length} bytes`);
            }
            ws.send(chunk);
        });
        readStream.on('end', () => {
            console.log('Finished sending file');
            ws.send(JSON.stringify({ status: "done" }));
            fs.unlink(Output_File, (err) => {
                if (err) console.error("Error deleting temp file", err);
            });
        });
        readStream.on('error', (err) => {
            console.error(`Error reading file: ${err.message}`);
            ws.send(JSON.stringify({ error: err.message }));
            ws.close();
        });
    });
};