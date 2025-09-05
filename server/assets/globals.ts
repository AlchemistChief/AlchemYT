import path from 'path';
import os from 'os';

export const
    Temp_Folder = path.join(import.meta.dirname, '..', 'temp'),
    ytdlp_Binary = path.join(import.meta.dirname, '..', 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp_-inux');



export function getGlobalOptions(Output_File: string) {
    return {
        //dumpSingleJson: true,
        //verbose: true,
        format: 'm4a/bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio',
        ffmpegLocation: path.join(import.meta.dirname, '..', 'bin', 'ffmpeg.exe'),
        cookies: path.join(import.meta.dirname, 'cookies.txt'),
        output: Output_File,
        embedMetadata: true,
        embedThumbnail: true,
        noEmbedChapters: true,
        noEmbedSubs: true,
        noUpdate: true,
        t: "sleep",
        //'verbose': True,
        ignoreErrors: false, // Stop on download errors instead of skipping
        forceIpv6: true, // Force use of IPv6 for all connections (safer if your ISP supports it)
        progress: true, // Show download progress
        newline: true, // Ensure progress output always ends with a newline
        quiet: false, // Show log messages (set true for silent mode)
        addHeader: [
            'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        ]
    };
}
