# PopUI - Collaborative UX for Claude Desktop

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Claude Desktop](https://img.shields.io/badge/Claude-Desktop-blueviolet)
[![GitHub release](https://img.shields.io/github/v/release/kelnishi/PopUI?label=release)](https://github.com/kelnishi/PopUI/releases/latest)

<img width="400" alt="Screenshot 2025-04-09 at 8 09 01 PM" src="https://github.com/user-attachments/assets/73a5ee83-db9d-40b4-9f3b-b64a5ac901fc" />

## Overview
PopUI is a companion desktop app for macOS that gives [Claude Desktop](https://claude.ai/download) new tools.

Leveraging Claude's ability to create user interfaces, PopUI creates a bi-directional bridge to a visual context.
- Claude creates and automatically displays a user interface (similar to artifacts)
- Claude can read changes done in the UI and use the UI as a visual context
- Claude can also push changes to the UI, visually updating it for the user
- The UI can send events and text back to chat, obviating the need for  keyboard input in the loop

## Collaborative UX
### How is this different from Artifacts?
PopUI closes the interaction loop. While Claude Artifacts can generate interactive UI elements, any events or changes that happen in them are trapped outside of the chat conversation. With PopUI, Claude has tools to interrogate and manipulate the external state, allowing Claude to build further conversation on top of that shared context.

### Realtime visual context
PopUI also gives the Claude and the user the ability to receive and manipulate visual context. 

Some examples:
- Instantly build control panels for tweaking and refining values in the chat
- Talk to Claude about colors with a color picker with swatches.
- Talk to Claude about a physical layout
- Play turn-based games with Claude on a shared gameboard
- Give Claude a sense of time with a real-time wall clock
- Give Claude a literal face to express its emotions during the chat

## Installation
Just download the [latest release](https://github.com/kelnishi/PopUI/releases/latest/) and launch the app.

### Automatic SSE Proxy to Claude Desktop
PopUI provides all its dependencies to function, even the MCP gateway for Claude!
The first time you launch PopUI, you'll be asked to install into Claude Desktop. After this, PopUI will be launched by Claude Desktop and automatically connected as an MCP server.

You can access all the created user interfaces from the settings window or from the menubar icon.
<img width="724" alt="Screenshot PopUI 0 1 0" src="https://github.com/user-attachments/assets/4ab95806-4a42-4768-9354-a95399045efb" />

## Sponsorship & Collaboration

PopUI was my [MCP](https://modelcontextprotocol.io/introduction) hackathon entry.

If you like it, please consider supporting me through sponsorship or work opportunities.

_My Apple Developer membership cost $100/year 💸 Oh for codesign..._ 

[Sponsor me](https://github.com/sponsors/kelnishi) or [connect with me on LinkedIn](https://www.linkedin.com/in/kelnishi) if you're interested in collaborating!

[⭐Stars⭐](https://github.com/kelnishi/PopUI/stargazers) are always appreciated!
