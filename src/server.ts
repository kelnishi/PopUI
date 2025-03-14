import express from 'express';
import { Server } from 'http';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

import multer from 'multer';
import { getUploadsDir } from './utils/paths';
import path from 'path';
import * as fs from "node:fs";

let serverInstance: Server | null = null;

export function startServer(port: number): Server {
  
  const app = express();

  // Middleware to parse JSON
  app.use(express.json({ limit: '50mb' })); // Increased limit for larger files

  // Basic route
  app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the server!' });
  });

  // Another sample route
  app.get('/api/data', (req, res) => {
    res.json({
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ]
    });
  });

  const mcpServer = new McpServer({
    name: "PopToggle",
    version: "1.0.0"
  });

  mcpServer.tool(
      "calculate-bmi",
      {
        weightKg: z.number(),
        heightM: z.number()
      },
      async ({ weightKg, heightM }) => ({
        content: [{
          type: "text",
          text: String(weightKg / (heightM * heightM))
        }]
      })
  );
  
  let transport: SSEServerTransport | null = null;

  app.get("/sse", async (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    await mcpServer.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(500).json({ error: "SSE transport not initialized" });
    }
  });

  // Set up uploads directory
  const uploadsDir = getUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // File upload endpoint that handles direct file data instead of using multer
  app.post('/upload', async (req, res) => {
    try {
      // Check if we have the required data
      if (!req.body.fileName || !req.body.fileData) {
        return res.status(400).json({ error: 'Missing file data or file name' });
      }

      const { fileName, fileType, fileSize, fileData } = req.body;
      
      // Create a safe filename
      const sanitizedFileName = path.basename(fileName);
      const filePath = path.join(uploadsDir, sanitizedFileName);
      
      // Convert array back to Buffer
      const fileBuffer = Buffer.from(fileData);
      
      // Write file to disk
      fs.writeFileSync(filePath, fileBuffer);
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          originalName: fileName,
          size: fileSize,
          type: fileType,
          path: filePath
        }
      });
    } catch (error) {
      console.error('Error handling file upload:', error);
      res.status(500).json({ error: 'Failed to process file upload', details: String(error) });
    }
  });

  // For traditional multipart form uploads, keep multer as an option
  const upload = multer({ dest: uploadsDir });
  app.post('/upload-form', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  });

  // Start the server
  serverInstance = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  return serverInstance;
}