// ────────── Helper Functions to Convert Sizes ──────────

// Parse size string (e.g., "10 MiB") into bytes
export function parseSize(sizeStr: string): number {
    const match = sizeStr.trim().match(/^([\d.]+)\s*([KMG])B$/);
    if (!match) return NaN;

    const num = parseFloat(match[1]);
    const unit = match[2];

    const factor = {
        K: 1000,
        M: 1000 ** 2,
        G: 1000 ** 3
    }[unit];

    return num * factor;
}


// Format bytes into human-readable size string
export function formatSize(bytes: number): string {
    if (bytes >= 1000 ** 3) return (bytes / (1000 ** 3)).toFixed(1) + ' GB';
    if (bytes >= 1000 ** 2) return (bytes / (1000 ** 2)).toFixed(1) + ' MB';
    if (bytes >= 1000) return (bytes / 1000).toFixed(1) + ' KB';
    return bytes + ' B';
}
