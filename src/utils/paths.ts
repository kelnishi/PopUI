import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let userDataPath: string;

// Lazy-init or export a function that gets the path
export function getInterfacesDir() {
    if (!userDataPath) {
        userDataPath = app.getPath('userData');
    }
    const interfacesDir = path.join(userDataPath, 'interfaces');

    // Make sure the directory exists
    if (!fs.existsSync(interfacesDir)) {
        fs.mkdirSync(interfacesDir, { recursive: true });
    }
    return interfacesDir;
}