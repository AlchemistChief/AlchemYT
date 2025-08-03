// ────────── Module Importing ──────────
import { toggleSideMenuVisibility } from '../functions/interfaceHandler.js';
import { requestCertificate } from '../functions/utils.js';

document.addEventListener("DOMContentLoaded", async () => {
  // ────────── Initialization: Bind events after DOM is loaded ──────────
  const [headerHtml, footerHtml] = await Promise.all([
    fetch("partials/header.html").then(response => response.text()).catch(console.error),
    fetch("partials/footer.html").then(response => response.text()).catch(console.error)
  ]);

  if (headerHtml) document.getElementById("header-container").innerHTML = headerHtml;
  if (footerHtml) document.getElementById("footer-container").innerHTML = footerHtml;

  document.querySelector(".menu-toggle").addEventListener("click", toggleSideMenuVisibility);

  if (document.querySelector('script[src="scripts/home.js"]')) {
    document.dispatchEvent(new Event("headerFooterLoaded"));
  }
});

// ────────── Service Worker Registration ──────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(registration => {
        console.log("✅ Service Worker registered at:", registration.scope);
      })
      .catch(error => {
        console.error("❌ Service Worker registration failed:", error);
      });
  });
}