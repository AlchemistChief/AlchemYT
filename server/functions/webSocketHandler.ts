// ────────── Module Importing ──────────
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'https';
import type { IncomingMessage } from 'http';

// ────────── Custom Modules ──────────
import { notifyClient, normalizeYoutubeLink } from './utils.ts';
import { downloadFile } from './downloadFile.ts';
import { downloadPlaylist } from './downloadPlaylist.ts';

// ────────── Client Session Management ──────────
interface Session {
    sessionId: string;
    ip: string;
    socket: WebSocket;
}

const sessions: Map<string, Session> = new Map(); // key: sessionId

// ────────── Generate Session ID (Native) ──────────
function generateSessionId(): string {
    return `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ────────── Extract IP Address ──────────
function getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    return ip ?? 'unknown';
}

// ────────── Format Log Line ──────────
function logSessionEvent(event: string, ip: string, sessionId: string) {
    const prefix = '[WS]';
    // Fixed-width columns for nice alignment
    const ipCol = ip.padEnd(15, ' ');
    const sessionCol = sessionId.padEnd(20, ' ');
    console.log(`${prefix} | IP: ${ipCol} | Session: ${sessionCol} | ${event}`);
    console.log(`${prefix} | Current Sessions: ${sessions.size}`);
}

// ────────── Initialize WebSocket Server ──────────
export function initializeWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, request) => {
        if (request.url !== '/ws/download') {
            console.warn('[WS] Invalid WebSocket path:', request.url);
            ws.close();
            return;
        }

        const clientIp = getClientIp(request);

        // ─── Prevent Duplicate Session per IP ───
        const existingSession = [...sessions.values()].find(s => s.ip === clientIp);
        if (existingSession) {
            console.warn(`[WS] Duplicate session attempt from IP: ${clientIp}`);
            notifyClient(ws, { error: 'Session already exists for this IP' });
            ws.close();
            return;
        }

        // ─── Create New Session ───
        const sessionId = generateSessionId();
        sessions.set(sessionId, { sessionId, ip: clientIp, socket: ws });

        logSessionEvent('New session started', clientIp, sessionId);

        // ─── Send Session Info Immediately ───
        notifyClient(ws, {
            type: 'session',
            sessionId,
            message: 'Session initialized. Use this session ID in all messages.'
        }, true);

        // ─── Handle Messages ───
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (!data.sessionId || !sessions.has(data.sessionId)) {
                    console.warn('[WS] Missing or invalid sessionId in message');
                    notifyClient(ws, { error: 'Invalid or missing sessionId' });
                    ws.close();
                    return;
                }

                const session = sessions.get(data.sessionId)!;

                if (session.ip !== clientIp || session.socket !== ws) {
                    console.warn('[WS] Session spoof attempt:', data.sessionId);
                    ws.close();
                    return;
                }

                // ─── Validate Payload ───
                if (!data.url) {
                    notifyClient(ws, { error: 'Missing URL in message' });
                    return;
                }

                const { normalizedUrl, type } = normalizeYoutubeLink(data.url);

                if (type === 'file') {
                    await downloadFile(ws, normalizedUrl);
                } else if (type === 'playlist') {
                    await downloadPlaylist(ws, normalizedUrl);
                }

            } catch (err) {
                console.error('[WS] Error processing message:', err);
                notifyClient(ws, { error: 'Malformed message' });
                ws.close();
            }
        });

        ws.on('close', () => {
            sessions.delete(sessionId);
            logSessionEvent('Session closed and removed', clientIp, sessionId);
        });
    });
    console.log('[WS] WebSocket server initialized');
}
