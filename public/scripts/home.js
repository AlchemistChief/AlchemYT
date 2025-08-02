// ────────── Module Importing ──────────
import { toggleLogVisibility, hideDebug, hideError, hideValid, hideTimestamp } from '../functions/logHandler.js';
import { bindDownloadHandler } from '../functions/downloadHandler.js';

document.addEventListener("headerFooterLoaded", () => {
    // ────────── Initialization: Bind events after DOM is loaded ──────────
    bindDownloadHandler();
    window.toggleLogVisibility = toggleLogVisibility
    window.hideTimestamp = hideTimestamp
    window.hideDebug = hideDebug
    window.hideError = hideError
    window.hideValid = hideValid
});