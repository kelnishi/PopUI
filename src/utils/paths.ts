import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let userDataPath: string;

// Lazy-init or export a function that gets the path
export function getUploadsDir() {
    if (!userDataPath) {
        userDataPath = app.getPath('userData');
    }
    const uploadsDir = path.join(userDataPath, 'uploads');

    // Make sure the directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    return uploadsDir;
}