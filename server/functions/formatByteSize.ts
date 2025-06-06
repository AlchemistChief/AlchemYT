// ────────── Helper Functions to Convert Sizes ──────────

// Parse size string (e.g., "10 MiB") into bytes (base 1024)
export function parseSize(sizeStr: string): number {
    const match = sizeStr.trim().match(/^([\d.]+)\s*([KMG])i?B$/i);
    if (!match) return NaN;

    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const factor = {
        K: 1024,
        M: 1024 ** 2,
        G: 1024 ** 3
    }[unit];

    return num * factor;
}

// Format bytes into human-readable SI size string (base 1000)
export function formatSize(bytes: number): string {
    if (bytes >= 1000 ** 3) return (bytes / (1000 ** 3)).toFixed(2) + ' GB';
    if (bytes >= 1000 ** 2) return (bytes / (1000 ** 2)).toFixed(2) + ' MB';
    if (bytes >= 1000) return (bytes / 1000).toFixed(2) + ' KB';
    return bytes + ' B';
}
