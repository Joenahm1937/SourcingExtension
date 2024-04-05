# Sourcing Assistant

Sourcing Assistant is a Chrome extension designed to streamline the process of collecting profiles related to a specific account for marketing purposes.
By automating manual browsing activities, it enables users to efficiently build a network of similar accounts starting from a given account.

![](https://github.com/Joenahm1937/SourcingExtension/assets/41309544/933a4fc6-64b3-4ce5-b13f-886a3fa8bbae)

## Features

-   **Easy to Start**: Install the extension and begin the process with a simple click.
-   **Control Your Collection**: Stop collecting profiles at any time and reset to clear your cache.
-   **User-Created Content Scripts**: Version 2 offers the ability for users to create their own content scripts, providing flexibility for various use cases.
-   **Advanced Configuration**: Customize settings such as the number of tabs to open in parallel and enable debug logging for more granular control.

_Note_: Due to frequent UI updates by Instagram, the extension's content script may occasionally fail.
Instagram's recent changes also require users to actively click into a newly created tab to initiate the script.

## How It Works

1. **Installation**: Add the extension to your Chrome browser.
2. **Activation**: Click the 'Start' button to begin collecting profiles. You can stop at any time and reset to clear the collected profiles cache.
3. **Configuration**: For more detailed settings, access the advanced configuration through the settings icon.

## Development Setup

1. **Install Dependencies**: Run `npm install` to install required dependencies.
2. **Load Extension**: Navigate to Chrome Extensions and load the `dist/` folder as an unpacked extension. For detailed instructions, see the [Chrome Extension Getting Started Tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
3. **Start Development Server**: Execute `npm run watch` to start the server in watch mode, enabling live refreshes for immediate feedback on changes.
4. **Build for Production**: Use `npm run build` to compile all necessary files into the `dist/` directory for production deployment.
