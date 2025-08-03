// ────────── Module Importing ──────────
import { toggleSideMenuVisibility } from './functions/interfaceHandler.js';

// ────────── DOM Ready Handler ──────────
document.addEventListener("DOMContentLoaded", async () => {
  // ────────── Load Header & Footer ──────────
  const [headerHtml, footerHtml] = await Promise.all([
    fetch("partials/header.html").then(res => res.text()).catch(console.error),
    fetch("partials/footer.html").then(res => res.text()).catch(console.error)
  ]);

  if (headerHtml) document.getElementById("header-container").innerHTML = headerHtml;
  if (footerHtml) document.getElementById("footer-container").innerHTML = footerHtml;

  document.querySelector(".menu-toggle")?.addEventListener("click", toggleSideMenuVisibility);

  // ────────── Conditional Home Page Logic ──────────
  if (document.querySelector(".log-container") && document.querySelector(".fetch-button")) {
    Promise.all([
      import('./functions/logHandler.js'),
      import('./functions/downloadHandler.js')
    ]).then(([logHandler, downloadHandler]) => {
      downloadHandler.bindDownloadHandler();
      window.toggleLogVisibility = logHandler.toggleLogVisibility;
      window.hideTimestamp = logHandler.hideTimestamp;
      window.hideDebug = logHandler.hideDebug;
      window.hideError = logHandler.hideError;
      window.hideValid = logHandler.hideValid;
    });
  }
});


// ────────── Service Worker Registration ──────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered at:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}