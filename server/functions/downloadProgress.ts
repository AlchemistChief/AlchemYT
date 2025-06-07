// ────────── Module Importing ──────────
import { TinyspawnPromise } from 'tinyspawn';
import type WebSocket from 'ws';

// ────────── Custom Modules ──────────
import { parseSize, formatSize } from './formatByteSize.ts';
import { notifyClient } from './utils.ts';

// ────────── Log Download Progress Function ──────────
export const logDownloadProgress = function (ws: WebSocket, proc: TinyspawnPromise) {
    proc.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split(/[\r\n]+/).filter(line => line.trim() !== '');
        lines.forEach(line => {
            // Look for progress logs that start with [download]
            if (line.includes('[download]')) {
                // Regex to capture percentage and total size
                const progressRegex = /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+([\d.]+\s*[KMG]i?B)/;
                const match = line.match(progressRegex);
                if (match) {
                    const percent = parseFloat(match[1]);
                    const totalStr = match[2].trim();
                    const totalBytes = parseSize(totalStr);
                    const downloadedBytes = totalBytes * (percent / 100);
                    notifyClient(ws, {
                        status: "download-progress",
                        downloaded: formatSize(downloadedBytes),
                        total: formatSize(totalBytes),
                        percent: match[1]
                    });
                } else {
                    notifyClient(ws, {
                        status: "download-progress",
                        progress: line.replace('[download]', '').trim()
                    });
                }
            }
        });
    });
};