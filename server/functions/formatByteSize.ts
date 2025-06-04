// Helper functions to convert sizes
export function parseSize(sizeStr) {
    const match = sizeStr.trim().match(/^([\d.]+)\s*([KMG])i?B$/);
    if (!match) return NaN;
    const num = parseFloat(match[1]);
    switch (match[2]) {
        case 'K': return num * 1024;
        case 'M': return num * 1024 * 1024;
        case 'G': return num * 1024 * 1024 * 1024;
        default: return num;
    }
}

export function formatSize(bytes) {
    if (bytes >= 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
    } else if (bytes >= 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    } else if (bytes >= 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }
    return bytes + " B";
}