// ────────── Module Importing ──────────
import dotenv from 'dotenv'; dotenv.config({ path: import.meta.dirname + '/.env' });
import express, { Request, Response, NextFunction } from 'express';
import https from 'https';
import dnssd from 'dnssd';
import path from 'path';
import fs from 'fs';

// ────────── Custom Modules ──────────
import { initializeWebSocketServer } from './functions/webSocketHandler.ts';

// ────────── Application Setup ──────────
const app = express();

const settings = {
    PORT: Number(process.env.PORT) || 3000,
    DOMAIN: process.env.DOMAIN || 'localhost',
    YT_APIKey: process.env.YT_APIKey,
    Server_APIURL: process.env.Server_APIURL,
    output_ChunkData: process.env.output_ChunkData === 'true',
};

// ────────── HTTPS Server Setup ──────────
const server = https.createServer({
    key: fs.readFileSync(path.join(import.meta.dirname, 'assets/selfsigned.key')),
    cert: fs.readFileSync(path.join(import.meta.dirname, 'assets/selfsigned.crt'))
}, app);

// ────────── Middleware Configuration ──────────
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, '../public')));

// ────────── Routes ──────────
app.get('/selfsigned.crt', (req, res) => {
    res.sendFile(path.join(import.meta.dirname, 'assets/selfsigned.crt'));
});

app.get('/settings', (req, res) => {
    res.json({
        "YT-APIKey": settings.YT_APIKey,
        "Server-APIURL": settings.Server_APIURL
    });
});

// ────────── Clear /Temp ──────────
const cleanTempFolderOnExit = (Shutdown:boolean = true) => {
    const tempDir = path.join(import.meta.dirname, 'temp');
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

// ────────── Error-handling middleware ──────────

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(import.meta.dirname, '../public/404.html'));
});

// General error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    const status = err.status || 500;
    let filePath = '';

    switch (status) {
        case 401:
            filePath = path.join(import.meta.dirname, '../public/errors/401.html');
            break;
        case 403:
            filePath = path.join(import.meta.dirname, '../public/errors/403.html');
            break;
        case 404:
            filePath = path.join(import.meta.dirname, '../public/errors/404.html');
            break;
        case 408:
            filePath = path.join(import.meta.dirname, '../public/errors/408.html');
            break;
        case 429:
            filePath = path.join(import.meta.dirname, '../public/errors/429.html');
            break;
        case 500:
        default:
            filePath = path.join(import.meta.dirname, '../public/errors/500.html');
            break;
    }

    if (filePath && fs.existsSync(filePath)) {
        res.status(status).sendFile(filePath);
    } else {
        res.status(status).type('text').send(`Error ${status}`);
    }
});

// ────────── Server Startup ──────────
server.listen(settings.PORT, '0.0.0.0', () => {
    new dnssd.Advertisement(dnssd.tcp('https'), settings.PORT, {
        name: `${settings.DOMAIN}`,
        host: `${settings.DOMAIN}`,
        type: "_http._tcp",
    }).start();

    console.log(`HTTPS Server running on port ${settings.PORT}`);
    console.log(`Server: https://${settings.DOMAIN}:${settings.PORT}`);
});

// ────────── WebSocket Handler ──────────
initializeWebSocketServer(server);
