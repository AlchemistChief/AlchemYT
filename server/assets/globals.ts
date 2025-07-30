import path from 'path';
import os from 'os';

export const
    Temp_Folder = path.join(import.meta.dirname, '..', 'temp'),
    ytdlp_Binary = path.join(import.meta.dirname, '..', 'bin', os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp_-inux');



export function getGlobalOptions(Output_File: string) {
    //const ffmpegBinaryName = os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg_linux';

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
        ignoreErrors: false,
        forceIpv6: true,
        progress: true,
        newline: true,
        quiet: false,
        //addHeader: [
            //'referer: https://youtube.com',
            //'user-agent: googlebot'
        //],
    };
}
