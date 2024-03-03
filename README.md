# SourcingExtension

SourcingExtension is a Chrome extension built using Vite. Below is the file structure and a guide to get started with development and testing.

## File Structure

SourcingExtension/
├── dist/
│ ├── contentScript.js
│ ├── index.html
│ ├── manifest.json
│ ├── popup.css
│ ├── popup.js
│ ├── serviceWorker.js
│ └── vite.svg
├── node_modules/
│ └── ...
├── public/
│ ├── manifest.json
│ └── vite.svg
├── src/
│ ├── background/
│ │ └── serviceWorker.ts # TypeScript file for the background service worker logic of the extension.
│ ├── content/
│ │ └── contentScript.ts # TypeScript file for the content script that interacts with webpages opened in the browser.
│ ├── popup/
│ │ ├── main.ts # Main TypeScript entry file that initializes and controls the popup's behavior.
│ │ ├── style.css # CSS file for styling the popup window of the extension.
│ └── vite-env.d.ts # TypeScript declaration file that includes types for Vite-specific environment variables.
├── .gitignore
├── index.html # HTML file for the popup window
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts

## Getting Started

To set up the SourcingExtension for development:

1. Install the necessary dependencies using `npm install`.
2. Start the development server using `npm run dev`.
   This will serve the popup HTML file for testing, which can be opened directly in the browser.
3. To build the extension for production, run `npm run build`.
   This will compile all necessary files into the `dist/` directory.
4. Load the `dist/` folder into Chrome Extensions. For guidance on loading unpacked extensions,
   refer to the [Chrome Extension Getting Started Tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
