require('dotenv').config()
const fs = require('fs');
const path = require('path');
const { create: createYoutubeDl } = require('youtube-dl-exec');

const ytDlpPath = path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const youtubedl = createYoutubeDl(ytDlpPath);

const Cookie_File = path.join(__dirname, '..', 'cookies.txt');
const FFmpeg_Location = path.join(__dirname, '..', 'bin', 'ffmpeg.exe');
const Temp_Folder = path.join(__dirname, '..', 'temp');

module.exports = async (ws, url, type) => {
    try {
        // Ensure the temporary folder exists
        if (!fs.existsSync(Temp_Folder)) {
            fs.mkdirSync(Temp_Folder, { recursive: true });
        }

        const downloadId = Date.now();

        if (type === 'file') {
            // Define temporary output file for a single audio download
            const Output_File = path.join(Temp_Folder, `download_${downloadId}.m4a`);
            //const Output_File = path.join(Temp_Folder, `%(title)s.%(ext)s`);
            let options = {
                //verbose: true, //Default: OFF || Prints Debug Information
                format: 'm4a/bestaudio[ext=m4a]/bestaudio',
                ffmpegLocation: FFmpeg_Location,
                cookies: Cookie_File,
                output: Output_File,
                embedMetadata: true,  //Default: false
                embedThumbnail: true,  //Default: false
                noEmbedChapters: true, //Default: true
                noEmbedSubs: true, //Default: true
                noUpdate: true, //Default: true
                ignoreErrors: true,
                forceIpv6: true,
                progress: true,
                newline: true, //Default: true
                quiet: false,
                addHeader: [
                    'referer: https://youtube.com',
                    'user-agent: googlebot'
                ],
            };

            // Notify client the download is starting
            ws.send(JSON.stringify({ message: "Download started." }));


            // Enable spawning, which returns a ChildProcess allowing you to attach event listeners.
            const proc = youtubedl.exec(url, options);

            // Listen for progress logs from stderr and forward progress messages to the client.
            // Helper functions to convert sizes
            function parseSize(sizeStr) {
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

            function formatSize(bytes) {
                if (bytes >= 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
                } else if (bytes >= 1024 * 1024) {
                    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
                } else if (bytes >= 1024) {
                    return (bytes / 1024).toFixed(1) + " KB";
                }
                return bytes + " B";
            }

            // Listen for progress logs from STDOUT instead of STDERR.
            proc.stdout.on('data', (data) => {
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
                        }
                    }
                });
            });

            // When the process closes, pipe the resulting file as binary chunks via the WebSocket.
            proc.on('close', (code) => {
                console.log(`Process closed with code ${code}`);
                // Send filename to the client:
                ws.send(JSON.stringify({ filename: path.basename(Output_File) }));

                const readStream = fs.createReadStream(Output_File);
                readStream.on('data', (chunk) => {
                    if (process.env.output_ChunkData === 'true') {
                        console.log(`Sending chunk of ${chunk.length} bytes`);
                    }
                    ws.send(chunk);
                });
                readStream.on('end', () => {
                    console.log('Finished sending file');
                    ws.send(JSON.stringify({ status: "done" }));
                    fs.unlink(Output_File, (err) => {
                        if (err) console.error("Error deleting temp file", err);
                    });
                });
                readStream.on('error', (err) => {
                    console.error(`Error reading file: ${err.message}`);
                    ws.send(JSON.stringify({ error: err.message }));
                    ws.close();
                });
            });

        } else if (type === 'playlist') {
            // Implementing streaming for playlists (e.g. downloading and zipping multiple files)
            // requires additional handling. For now, return a not-implemented error.
            ws.send(JSON.stringify({ error: 'Playlist download streaming not implemented.' }));
            ws.close();
        }
    } catch (error) {
        ws.send(JSON.stringify({ error: error.message }));
        ws.close();
    }
};