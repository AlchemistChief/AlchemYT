// ────────── Module Importing ──────────
import { toggleLogVisibility } from '../modules/logHandler.js';
import { bindDownloadHandler } from '../modules/downloadHandler.js';

// ──────────  ──────────  ──────────  ──────────  ──────────  ──────────

document.addEventListener("headerFooterLoaded", () => {
    // ────────── Initialization: Bind events after DOM is loaded ──────────
    bindDownloadHandler();
    document.querySelector(".close-log").addEventListener("click", toggleLogVisibility);
});