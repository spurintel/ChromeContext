# Context API Chrome Extension

A first attempt at adding Spur Context API IP enrichment data inline to web pages via a Chrome Extension


## Install

1) Pull this repo
2) In the Chrome settings dropdown, go to More Tools --> Extensions
3) Enable "Developer mode" in the top right corner of the page
4) Click "Load unpacked" in the top left corner and select the `extension` directory in this repo
5) Right click on the extension icon in the browser, go to options, and put in your API key

## Usage

This extension can be triggered in two ways:

1) Highlight an IP address and click the extension icon
2) Highlight an IP address and press `ctrl+shift+f`
    - note that this shortcut is the default and can be changed by going to chrome://extensions/shortcuts


## Roadmap

Just a couple things that could be improved:

- add a refresh button for cached queries
- add an option to toggle default results view between parsed and raw
- add context menu option to query highlighted IP
    - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/openPopup
    - this is not yet supported in Chrome
