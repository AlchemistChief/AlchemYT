// ────────── Module Importing ──────────
import dotenv from 'dotenv';dotenv.config({ path: __dirname + '/.env' });
import express from 'express';
import WebSocket from 'ws';
import https from 'https';
import dnssd from 'dnssd';
import path from 'path';
import fs from 'fs';
import { IncomingMessage } from 'http';

// ────────── Custom Modules ──────────
import { downloadFile } from './functions/downloadFile.ts';
import { downloadPlaylist } from './functions/downloadPlaylist.ts';
import { notifyClient, normalizeYoutubeLink  } from './functions/utils.ts';

// ────────── Application Setup ──────────
const app = express();

const settings = {
    YT_APIKey: process.env.YT_APIKey,
    Server_APIURL: process.env.Server_APIURL,
    output_ChunkData: process.env.output_ChunkData === 'true',
    Port: Number(process.env.PORT) || 3000
};

// ────────── HTTPS Server Setup ──────────
const server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'assets/selfsigned.key')),
    cert: fs.readFileSync(path.join(__dirname, 'assets/selfsigned.crt'))
}, app);

// ────────── WebSocket Server Setup ──────────
const wss = new WebSocket.Server({ noServer: true });

// ────────── Middleware Configuration ──────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ────────── Routes ──────────
app.get('/selfsigned.crt', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets/selfsigned.crt'));
});

app.get('/settings', (req, res) => {
    res.json({
        "YT-APIKey": settings.YT_APIKey,
        "Server-APIURL": settings.Server_APIURL
    });
});

// ────────── WebSocket Upgrade Handling ──────────
server.on('upgrade', (request: IncomingMessage, socket, head) => {
    if (request.url === '/ws/download') {
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// ────────── WebSocket Connection Handling ──────────
wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (message: string) => {
        try {
            const msg = JSON.parse(message.toString());
            if (!msg.url) {
                notifyClient(ws, { error: 'Missing url or type in message' });
                ws.close();
                return;
            }

            const {normalizedUrl, type} = normalizeYoutubeLink(msg.url); //Validate Client Request to block Malicious URLs

            if (type === 'file') {
                await downloadFile(ws, normalizedUrl);
            } else if (type === 'playlist') {
                await downloadPlaylist(ws, normalizedUrl);
            }
        } catch (err) {
            notifyClient(ws, { error: 'Invalid message format' })
            ws.close();
        }
    });
});

// ────────── Clear /Temp ──────────
const cleanTempFolderOnExit = (Shutdown:boolean = true) => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log('Temp folder cleaned');
            fs.mkdirSync(tempDir, { recursive: true });
        } catch (err) {
            console.error('Failed to clean temp folder:', err);
        }
    }
    if (Shutdown === true) {
        process.exit();
    }
};

cleanTempFolderOnExit(false) // Initial Cleaning
process.on('SIGINT', cleanTempFolderOnExit);    // Ctrl+C
process.on('SIGTERM', cleanTempFolderOnExit);   // Kill command
process.on('exit', cleanTempFolderOnExit);      // General exit
// ────────── Server Startup ──────────
server.listen(settings.Port, () => {
    new dnssd.Advertisement(dnssd.tcp('https'), settings.Port, {
        name: 'AlchemYT',
        host: 'AlchemYT.local'
    }).start();

    console.log(`HTTPS Server running on port ${settings.Port}`);
    console.log(`Server: https://AlchemYT.local:${settings.Port}`);
});