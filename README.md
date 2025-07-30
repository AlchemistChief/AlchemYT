
![Logo](https://iili.io/FUfTL67.gif)

[![License](https://img.shields.io/github/license/AlchemistChief/AlchemYT?color=green&style=flat&label=📄%20License)](https://github.com/AlchemistChief/AlchemYT/blob/main/LICENSE.md)
[![Last Commit](https://img.shields.io/github/last-commit/AlchemistChief/AlchemYT?color=blue&style=flat&label=🕒%20Last%20Commit)](https://github.com/AlchemistChief/AlchemYT/commits/master)
[![Issues](https://img.shields.io/github/issues/AlchemistChief/AlchemYT?color=orange&logo=github&logoColor=white&style=flat)](https://github.com/AlchemistChief/AlchemYT/issues)

AlchemYT is a self-hosted YouTube downloader built with TypeScript. It runs on Windows and utilizes Node.js. The project includes certificate for secure connections.

---

- ## ⚙ Requirements

  - **Operating System:** Windows
  - **Permissions:** Elevated
  - **Node.js:** v22.12.0+ (Use **[INSTALL.bat](INSTALL.bat)**)

---

- ## 📦 Installation

### Via. File:
**[INSTALL.bat](INSTALL.bat)** *(Can Install Node & Dependencies)*

### Via. Command:
```bash
npm install --include=dev
```

---

- ## 🚀 Run the App

### Via. File:
**[START.bat](START.bat)**

### Via. Command:
```bash
npm start
```

---

- ## 🔐 Certificate & Key Generation

This project uses a default selfsigned certificate & key, please generate your own certficate & key, for safety. To generate OpenSSL certificates for HTTPS support, you can use the following tool:

### 🔗 [CrypTool OpenSSL Generator](https://www.cryptool.org/de/cto/openssl/)

Use this to generate your `selfsigned.key` and `selfsigned.crt` files, and place them where your server expects them. Place them in [server/assets](server/assets).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).