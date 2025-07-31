<!-- Project Logo -->
<p align="center">
  <img src="https://iili.io/FUfTL67.gif" alt="AlchemYT Logo" style="max-width: 90vw; height: 20vw;">
</p>

<!-- Project Title -->
<h1 align="center"><b>AlchemYT</b></h1>
<p align="center">
  A self-hosted YouTube downloader for Windows
</p>

<!-- Shields -->
<div align="center">
  <a href="https://github.com/AlchemistChief/AlchemYT/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/AlchemistChief/AlchemYT?color=green&style=flat&label=License" alt="License Badge" />
  </a>
  <a href="https://github.com/AlchemistChief/AlchemYT/commits/main">
    <img src="https://img.shields.io/github/last-commit/AlchemistChief/AlchemYT?color=blue&style=flat&label=Last%20Commit" alt="Last Commit Badge" />
  </a>
  <a href="https://github.com/AlchemistChief/AlchemYT/issues">
    <img src="https://img.shields.io/github/issues/AlchemistChief/AlchemYT?color=orange&logo=github&logoColor=white&style=flat" alt="GitHub Issues Badge" />
  </a>
</div>

<hr>

<!-- Project Description -->
<p align="center">
  <b>AlchemYT</b> is a self-hosted YouTube downloader built with TypeScript.<br>
  It runs on Windows and utilizes Node.js. This project includes SSL certificates for secure connections.
</p>

<hr>

<!-- Requirements -->
<h2>⚙ Requirements</h2>
<ul>
  <li><b>Operating System:</b> Windows</li>
  <li><b>Permissions:</b> Admin (Elevated)</li>
  <li><b>Node.js:</b> v22.12.0+ (Use <a href="INSTALL.bat"><code>INSTALL.bat</code></a>)</li>
</ul>

<!-- Installation -->
<h2>📦 Installation</h2>
<h3>Via File:</h3>
<div style="margin-left: 2em;">
  <a href="INSTALL.bat"><code>INSTALL.bat</code></a>
  </br>– Installs Node & Dependencies
</div>

<h3>Via Command:</h3>
<div style="margin-left: 1em;">
  <pre><code><b>npm install --include=dev</b></code></pre>
</div>

<!-- Run the App -->
<h2>🚀 Run the App</h2>
<h3>Via File:</h3>
<div style="margin-left: 2em;">
  <a href="START.bat"><code>START.bat</code></a>
</div>

<h3>Via Command:</h3>
<div style="margin-left: 1em;">
  <pre><code><b>npm start</b></code></pre>
</div>

<!-- Certificate -->

<h2>🔐 Certificate & Key Generation</h2>

<p>
  This project uses a default self-signed certificate. For production, please generate your own.<br>
  Use the following tool to generate OpenSSL certs for HTTPS support:
</p>

<p>
   <a href="https://www.cryptool.org/de/cto/openssl/" target="_blank"><b>🔗 CrypTool OpenSSL Generator</b></a>
</p>

<p>Generate and place these in <a href="server/assets"><code>server/assets</code></a>:</p>
<ul>
  <li><code>selfsigned.key</code></li>
  <li><code>selfsigned.crt</code></li>
</ul>

<!-- License -->

<h2>📄 License</h2>
<p>This project is licensed under the <a href="LICENSE.md">MIT License</a>.</p>