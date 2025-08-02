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
  document.querySelector(".fetch-cert").addEventListener("click", requestCertificate);

  if (document.querySelector('script[src="scripts/home.js"]')) {
    document.dispatchEvent(new Event("headerFooterLoaded"));
  }
});