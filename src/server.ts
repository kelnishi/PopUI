import express from 'express';
import {Server} from 'http';

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {TextContent} from "@modelcontextprotocol/sdk/types.js";
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";

import {z} from "zod";

import {getInterfacesDir} from './utils/paths';
import path from 'path';
import fs from 'fs';

import {closeWindow, describeWindow, injectWindow, listFiles, openFile, readWindow} from './main';
import preferences from './preferences';

export interface SseServer {
    server: Server;
    transports: Map<string, SSEServerTransport> | null;
    mcp: McpServer;
}

// Set up uploads directory
const interfacesDir = getInterfacesDir();
if (!fs.existsSync(interfacesDir)) {
    fs.mkdirSync(interfacesDir, {recursive: true});
}

//Get an SSE McpServer
export function startMcp(port: number): SseServer {

    const app = express();

    // Middleware to parse JSON
    app.use(express.json({limit: '50mb'})); // Increased limit for larger files

    const mcpServer = new McpServer({
        name: "PopUI",
        version: "1.0.0"
    });

    mcpServer.tool(
        "pop-ui",
        "This tool allows the host to pop (create and display) a shared user interface that can serve as a visual context layer for the conversation.\n" +
        "This tool allows the host to move beyond text-only interactions to create, collaborative experiences like games, visualization tools, control panels, " +
        "and other interactive interfaces where both parties can manipulate a shared visual context.\n" +
        "Once a user interface is shown, subsequent pop-ui tool calls in 'get' mode should be used to update the context state.",
        {
            name: z.string().describe(
                "The name of the user interface.\n" +
                "This name will be used to reference the user interface in all modes.\n" +
                "This parameter is required."
            ),
            mode: z.enum(["show", "get", "set", "describe", "list"]).optional().describe(
                "The mode of operation for the user interface. Use:" +
                "'show' to show a user interface (create/update by passing tsx or show an existing)\n" +
                "'get' to read the current model state of a user interface\n" +
                "'set' to inject a model state into a user interface.\n" +
                "'describe' to get the json schema of the state model\n" +
                "'list' to list existing user interfaces\n"
            ),
            json: z.string().optional().describe(
                "The json model object to set the initial or updated state of the user interface. Valid for modes 'set' and 'show'."
            ),
            tsx: z.string().optional().describe(
                "A react component to display in the electron BrowserWindow.\n" +
                "This component is a single reference and must be entirely self contained.\n" +
                "The component should keep its state as a json model object and must have functions getState() and setState(json) to retrieve or inject (respectively) the visualized state.\n" +
                "The component should have a function describeState() to return the json schema of the state model.\n" +
                "The component should be a forwardRef so that useImperitiveHandle can expose getState, setState, and describeState.\n" +
                "This component may send chat messages to the host with 'window.api.sendToHost(message)'.\n" +
                "- Use this method with submit/confirm buttons and action elements to prompt the host on behalf of the user.\n" +
                "- Do not use this method for interactive elements within the user interface; it should only be used to send user intent.\n" +
                "- Example: A \"Confirm choice\" button should call 'window.api.sendToHost(\"*Selection made*.\")' to prompt the host to 'get' the user interface state.\n" +
                "This component should use tailwindcss for good styling and alignment.\n" +
                "This component container should have a preferred layout size, use tailwindcss w-number h-number.\n" +
                "This component should use unicode emoji and/or lucide-react for icons, including empty space icons.\n" +
                "This component should use appropriate widgets for ranges, enumerations, and other selectable data.\n" +
                "This component may be updated with subsequent calls to pop-ui in 'set' mode.\n" +
                "The host should *proactively* get the current state of the user interface with subsequent calls to pop-ui in 'get' mode."
            ),
        },
        async ({name, mode, json, tsx}) => {
            const fileName = `${name}.tsx`;
            const filePath = path.join(interfacesDir, fileName);

            const callCount = preferences.get('toolCalls') as number + 1;
            preferences.set('toolCalls', callCount);
            
            if (mode === "show") {
                let windowState = await readWindow(name as string);

                if (tsx === undefined && windowState === null) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `tsx is required when mode is show and window does not exist.`
                            } as TextContent
                        ],
                        isError: true
                    }
                }

                if (tsx !== undefined) {
                    //tsx content must include window.getState and window.setState
                    if (!tsx.includes('window.getState')) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `tsx React component must set window.getState() function to retrieve the json state.`
                                } as TextContent
                            ],
                            isError: true
                        }
                    }
                    if (!tsx.includes('window.setState')) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `tsx React component must set window.setState(json) function to inject the json state.`
                                } as TextContent
                            ],
                            isError: true
                        }
                    }
                    
                    await closeWindow(name as string);
                    //Save the tsx file to the uploads directory
                    await fs.promises.writeFile(filePath, tsx);

                    openFile(filePath);
                    // mcpServer.server.notification({
                    //     method: "notifications/resources/list_changed",
                    // });
                } else if (json !== undefined) {
                    windowState = await injectWindow(name as string, json as string);
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `${windowState}`
                        } as TextContent
                    ],
                    isError: false
                }
            }
            if (mode === "set") {
                const windowState = await injectWindow(name as string, json as string);

                if (windowState === null) {
                    //Error: window not found
                    return {
                        content: [
                            {
                                type: "text",
                                text: `User interface named "${name}" not found.`
                            } as TextContent
                        ],
                        isError: true
                    }
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `${windowState}`
                        } as TextContent
                    ],
                    isError: false
                }
            }
            if (mode === "get") {
                //Save the tsx file to the uploads directory
                const windowState = await readWindow(name as string);

                if (windowState === null) {
                    //Error: window not found
                    return {
                        content: [
                            {
                                type: "text",
                                text: `User interface named "${name}" not found.`
                            } as TextContent
                        ],
                        isError: true
                    }
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `${windowState}`
                        } as TextContent
                    ],
                    isError: false
                }
            }
            if (mode === "describe") {
                //Save the tsx file to the uploads directory
                const windowState = await describeWindow(name as string);

                if (windowState === null) {
                    //Error: window not found
                    return {
                        content: [
                            {
                                type: "text",
                                text: `User interface named "${name}" not found.`
                            } as TextContent
                        ],
                        isError: true
                    }
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `${windowState}`
                        } as TextContent
                    ],
                    isError: false
                }
            }
            if (mode === "list") {
                const files = await listFiles();
                //Convert to a json array of .tsx filenames without extensions
                const windowNames = files
                    .filter(fileName => path.extname(fileName) === '.tsx')
                    .map(fileName => path.basename(fileName, '.tsx'));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(windowNames, null, 2)
                        } as TextContent
                    ],
                    isError: false
                }
            }
            
            //Return invalid mode
            return {
                content: [
                    {
                        type: "text",
                        text: `Invalid mode "${mode}".`
                    } as TextContent
                ],
                isError: true
            }
        }
    );

    const transports = new Map();

    app.get("/sse", async (req, res) => {
        // Create new transport for this connection
        const transport = new SSEServerTransport("/messages", res);

        // Store it in the map using the session ID that's created in the constructor
        transports.set(transport.sessionId, transport);
        req.socket.setTimeout(0);

        const heartbeat = setInterval(() => {
            // A colon indicates a comment in SSE.
            res.write(":\n\n");
        }, 15000);

        req.on('close', () => {
            console.error(`Client Connection ${transport.sessionId} closed`);
            clearInterval(heartbeat);
            transport.close();
            transports.delete(transport.sessionId);
        });

        // Handle connection close
        res.on('close', () => {
            console.error(`Connection ${transport.sessionId} closed`);
            clearInterval(heartbeat);
            transports.delete(transport.sessionId);
        });
        res.cookie("x-session-id", transport.sessionId, {httpOnly: true, secure: true, sameSite: "strict"});

        // Connect to MCP server
        await mcpServer.connect(transport);

        // Log the session ID for debugging
        console.error(`New SSE connection established with session ID: ${transport.sessionId}`);
    });

    app.post("/messages", async (req, res) => {
        try {
            // Debug logging to see what's being received
            console.error("Received POST to /messages", req.body);

            // Check if we have any connections first
            if (transports.size === 0) {
                return res.status(503).json({error: "No active SSE connections"});
            }

            // Try to get sessionId from various possible locations
            let sessionId = null;

            // 1. Check if it's in the body
            if (req.body && req.body.sessionId) {
                sessionId = req.body.sessionId;
                console.error('Body sessionId:', sessionId);
            }
            // 2. Check if it's in a custom header
            else if (req.headers['x-session-id']) {
                sessionId = req.headers['x-session-id'];
                console.error('Header sessionId:', sessionId);
            }
            // 3. Check if it's in the URL query parameters
            else if (req.query.sessionId) {
                sessionId = req.query.sessionId;
                console.error('Query sessionId:', sessionId);
            }

            const parsedBody = req.body;

            // If we found a sessionId and it exists in our connections
            if (sessionId) {
                if (transports.has(sessionId)) {
                    console.error(`Using specified session ID: ${sessionId}`);
                    const transport: SSEServerTransport = transports.get(sessionId);
                    await transport.handlePostMessage(req, res, parsedBody);
                } else {
                    console.error(`Session ID ${sessionId} not found in active connections. Sending 400.`);
                    return res.status(400).send("SSE connection not active. Please reconnect.");
                }
            }
        } catch (error) {
            console.error("Error handling POST message:", error);
            res.status(500).json({error: error});
        }
    });

    app.get('/api/files', (req, res) => {
        try {
            const files = fs.readdirSync(interfacesDir)
                .filter(fileName => path.extname(fileName) === '.tsx')
                .map(fileName => ({
                    name: fileName,
                    path: path.join(interfacesDir, fileName),
                    size: fs.statSync(path.join(interfacesDir, fileName)).size
                }));
            res.json({files: files});
        } catch (error) {
            res.status(500).json({error: 'Could not read upload directory'});
        }
    });

    // Start the server
    const serverInstance: Server = app.listen(port, () => {
        console.error(`Server is running at http://localhost:${port}`);
    });

    return {
        server: serverInstance,
        transports: transports,
        mcp: mcpServer
    };
}