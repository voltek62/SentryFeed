# cringe-guard

Control your LinkedIn feed with an LLM of your choice. A chrome extension that filters out cringe content (engagement click-bait, overly emotional, low-value off-topic posts etc) on your LinkedIn feed using AI.

## Demo

![Cringe Guard Demo Video](./images/demo-cringe-guard.gif)

## How it works?

The cringe-guard Chrome extension filters out cringe content from your LinkedIn feed using an AI model. When you browse LinkedIn:

1. **Detects New Posts**: As new posts appear in your feed, the extension detects them in real time.
2. **Sends for Analysis**: The post content is sent to an AI model (via an API) that classifies it based on predefined "cringe" criteria (e.g., engagement bait, overly promotional content, etc.).
3. **Applies Blur**: Posts identified as cringe are blurred to keep your feed cleaner and more relevant.
4. **User Control**: Users can customize the types of posts they want to see and hide, and control their settings (like 
API keys) via modifying `content.js`.

## Running Cringe-Guard Locally

To run the Cringe-Guard Chrome extension on your local machine, follow these steps:

- Clone the repository.
- Update your [groq](https://groq.com) API key in `content.js`.
- Open Chrome browser and navigate to the Extensions page by typing `chrome://extensions/` in the URL bar.
- Enable Developer Mode in the top-right corner.
- Click on the Load unpacked button.
- Select the folder where the extension files are located (`cringe-guard` folder).

## TODO
- Refactor the codebase a bit
- Allow users to input API key through a simple interface in popup.html.
- Enable custom post filters, letting users choose which posts to show or hide via UI
- Persist user settings (API key and filters) using Chrome Storage API.
- Test cross-browser compatibility

## Built with ❤️ by

[Pankaj Tanwar](https://twitter.com/the2ndfloorguy)

## Contributing

I welcome contributions to the `cringe-guard` project! Whether it's a bug fix, a feature request, or improving documentation, your contributions are appreciated.

> Thanks to [Unbaited](https://github.com/danielpetho/unbaited) for the inspiration.