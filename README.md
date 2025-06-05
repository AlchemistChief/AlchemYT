# AlchemYT

AlchemYT is a self-hosted YouTube downloader built with TypeScript. It runs on Windows and utilizes Node.js. The project includes certificate and key generation for secure connections.

---

## ⚙ Requirements

- **Operating System:** Windows
- **Node.js:** Must be installed, or a valid path must be provided
- **Package Manager:** `npm`
- **TypeScript:** Required

---

## 📦 Installation

Open your terminal and run the following:

```bash
npm install --include=dev
````

This installs all necessary dependencies.
(If you're unsure about `devDependencies`, this setup uses them since it's self-hosted and TypeScript-based.)

---

## 🚀 Run the App

You can run the server directly using:

```bash
ts-node-dev --respawn --transpile-only server/index.ts
```

### Or:

```bash
npm run app
```

---

## 🔐 Certificate & Key Generation

To generate OpenSSL certificates for HTTPS support, you can use the following tool:

🔗 [CrypTool OpenSSL Generator](https://www.cryptool.org/de/cto/openssl/)

Use this to generate your `.key` and `.crt` files, and place them where your server expects them. Place them in `server/assets`.

---

## 📋 Handy Commands

All of these can be copied directly into your terminal:

```
npm install
ts-node-dev --respawn --transpile-only server/index.ts
npm run app
```

---

## 📄 License

This project is licensed under the [MIT License](public\license.html).

---
