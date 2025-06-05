// ────────── Module Importing ──────────
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import type WebSocket from 'ws';

// ────────── Custom Modules ──────────
import { formatSize } from './formatByteSize.ts';
import { notifyClient } from './utils.ts';

// ────────── Log Package Progress Function ──────────
export const logPackageProgress = function (ws: WebSocket, archive: archiver.Archiver) {
    let totalBytes = 0;
    let lastPercent = 0;

    archive.on('progress', (progress) => {
        if (!progress || !progress.fs) return;

        totalBytes = progress.fs.totalBytes || 0;
        const processedBytes = progress.fs.processedBytes || 0;
        if (totalBytes === 0) return;

        const percent = (processedBytes / totalBytes) * 100;
        const rounded = Math.round(percent);

        if (rounded > lastPercent || rounded === 100) {
            lastPercent = rounded;
            notifyClient(ws, {
                status: "package-progress",
                percent: rounded,
                packaged: formatSize(processedBytes),
                total: formatSize(totalBytes)
            });
        }
    });
};
