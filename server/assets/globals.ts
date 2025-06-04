import path from 'path';

export const
    Cookie_File = path.join(__dirname, '..', 'cookies.txt'),
    FFmpeg_Location = path.join(__dirname, '..', 'bin', 'ffmpeg.exe'),
    Temp_Folder = path.join(__dirname, '..', 'temp')
    ;

export function getGlobalOptions(Output_File:string) {
    return {
        //verbose: true, //Default: OFF || Prints Debug Information
        format: 'm4a/bestaudio[ext=m4a]/bestaudio',
        ffmpegLocation: FFmpeg_Location,
        cookies: Cookie_File,
        output: Output_File,
        embedMetadata: true,//Default: false
        embedThumbnail: true,//Default: false
        noEmbedChapters: true,//Default: true
        noEmbedSubs: true,//Default: true
        noUpdate: true,//Default: true
        ignoreErrors: true,
        forceIpv6: true,
        progress: true,
        newline: true,//Default: true
        quiet: false,
        addHeader: [
            'referer: https://youtube.com',
            'user-agent: googlebot'
        ]
    };
}