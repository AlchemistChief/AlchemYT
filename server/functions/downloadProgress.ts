import { TinyspawnPromise } from 'tinyspawn';
import { parseSize, formatSize } from './formatByteSize.ts';

export const logDownloadProgress = function (ws:WebSocket, proc:TinyspawnPromise) {
    proc.stdout.on('data', (data:Buffer) => {
        const lines = data.toString().split(/[\r\n]+/).filter(line => line.trim() !== '');
        lines.forEach(line => {
            // Look for progress logs that start with [download]
            if (line.includes('[download]')) {
                // Regex to capture percentage and total size.
                const progressRegex = /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+([\d.]+\s*[KMG]i?B)/;
                const match = line.match(progressRegex);
                if (match) {
                    const percent = parseFloat(match[1]);
                    const totalStr = match[2].trim();
                    const totalBytes = parseSize(totalStr);
                    const downloadedBytes = totalBytes * (percent / 100);
                    ws.send(JSON.stringify({
                        status: "progress",
                        downloaded: formatSize(downloadedBytes),
                        total: totalStr,
                        percent: match[1]
                    }));
                } else {
                    ws.send(JSON.stringify({
                        status: "progress",
                        progress: line
                    }));
                };
            };
        });
    });
};