// ────────── Module Importing ──────────
import { logMessage } from './logHandler.js';
import { serverApiUrl } from './downloadHelper.js';

// ────────── WebSocket State ──────────
let socket = null;
let sessionId = null;
let messageHandler = null;
let readyCallbacks = [];

// ────────── Initialize WebSocket ──────────
export function initializeWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${protocol}${serverApiUrl}/ws/download`;

    socket = new WebSocket(wsUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
        logMessage('[WS] Connected', 'DEBUG');
    };

    socket.onmessage = (event) => {
        if (typeof event.data === 'string') {
            let msg;
            try {
                msg = JSON.parse(event.data);
            } catch (e) {
                logMessage('[WS] Invalid JSON from server', 'ERROR');
                return;
            }

            if (msg.type === 'session' && msg.sessionId) {
                sessionId = msg.sessionId;
                logMessage(`[WS] Session established: ${sessionId}`, 'VALID');

                // Run all queued callbacks
                readyCallbacks.forEach(cb => cb());
                readyCallbacks = [];
            }

            if (messageHandler) messageHandler(msg, event);
        } else {
            // Binary data (ArrayBuffer)
            if (messageHandler) messageHandler(event.data, event);
        }
    };

    socket.onerror = () => {
        logMessage('[WS] Error occurred', 'ERROR');
    };

    socket.onclose = () => {
        logMessage('[WS] Connection closed', 'DEBUG');
        socket = null;
        sessionId = null;
    };
}

// ────────── Send message with sessionId attached ──────────
export function sendMessage(data) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        logMessage('[WS] Cannot send message, socket not open.', 'ERROR');
        return;
    }
    if (!sessionId) {
        logMessage('[WS] No session ID yet.', 'ERROR');
        return;
    }
    socket.send(JSON.stringify({ ...data, sessionId }));
}

// ────────── Wait until connected and session established ──────────
export function withSession(callback) {
    if (sessionId && socket && socket.readyState === WebSocket.OPEN) {
        callback();
    } else {
        readyCallbacks.push(callback);
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            initializeWebSocket();
        }
    }
}

// ────────── Register external message handler ──────────
export function setMessageHandler(fn) {
    messageHandler = fn;
}
