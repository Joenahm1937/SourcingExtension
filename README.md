# Sourcing Assistant

Sourcing Assistant is a Chrome extension built using Vite. Below is the file structure and a guide to get started with development and testing.

## File Structure

```plaintext
SourcingExtension/
├── dist/
│   ├── contentScript.js
│   ├── index.html
│   ├── manifest.json
│   ├── popup.css
│   ├── popup.js
│   ├── serviceWorker.js
├── node_modules/
│   └── ...
├── public/                        # Static assets for the extension
│   ├── manifest.json              # Source manifest for the extension
│   └── logo.svg
├── src/                           # Source code for the extension
│   ├── background/                # Background service worker logic
│   │   └── serviceWorker.ts       # TypeScript file for the service worker
│   ├── content/                   # Content scripts interacting with the browser
│   │   └── contentScript.ts       # TypeScript content script file
│   ├── popup/                     # Popup UI logic and styles
│   │   ├── counter.ts
│   │   ├── main.ts                # Main entry script for the popup
│   │   ├── style.css              # Styles for the popup window
│   └── vite-env.d.ts
├── .gitignore
├── index.html                     # HTML for the popup
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json                  # TypeScript compiler configuration
└── vite.config.ts                 # Vite build and serve configuration
```

## Getting Started

To set up the Sourcing Assistant for development:

1. Install the necessary dependencies using `npm install`.
2. Start the development server using `npm run watch`.
   This will allow you to open the popup UI in both the browser and the extension for quick debugging.
3. To build the extension for production, run `npm run build`.
   This will compile all necessary files into the `dist/` directory.
4. Load the `dist/` folder into Chrome Extensions. For guidance on loading unpacked extensions,
   refer to the [Chrome Extension Getting Started Tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
