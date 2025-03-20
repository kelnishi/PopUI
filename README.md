# popui

## Overview
popui is an Electron application that enables an MCP-enabled host to create a user interface to be used as a data source.

## Features
- Managed MCP server on port 3002
- Automatically instantiates and renders a React user interface
- Enables the host to get the updated state of the user interface

## Prerequisites
- Node.js
- Electron
- MCP host environment (like claude)

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