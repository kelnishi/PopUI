# PopUI - Collaborative UX for Claude Desktop

## Overview
PopUI is a companion desktop app that gives [Claude Desktop](https://claude.ai/download) new tools.

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

## Proxying the SSE MCP server to Claude Desktop
Add a supergateway proxy to your claude_desktop_config.json file.
```json
{
    "mcpServers": {
        "popui": {
            "command": "npx",
            "args": [
                "-y",
                "supergateway",
                "--sse",
                "http://localhost:3002/sse"
            ]
        }
    }
}
```
