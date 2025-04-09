import React, {useEffect, useState} from 'react';
import { SettingsPanel } from "./components/settings-panel"
import { Github } from "lucide-react"

// Declare the API interface available from preload script
declare global {
    interface Window {
        api: {
            serverRequest: (endpoint: string, data?: any) => Promise<any>;
            linkExternal: (windowName: string) => Promise<any>;
            listFiles: () => Promise<any>;
            openFile: (windowName: string) => Promise<any>;
            showFile: (windowName: string) => Promise<any>;
            deleteFile: (windowName: string) => Promise<any>;
            sendToHost: (message: string) => Promise<any>;
            getPreference: (key: string) => Promise<string>;
            setPreference: (key: string, value: string) => Promise<any>;
        };
    }
}

interface FileItem {
    name: string;
    path: string;
    size: number;
}

const App: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    useEffect(() => {

        const fetchFiles = async () => {
            try {
                const response = await window.api.serverRequest('/api/files');
                setFiles(response.files);
            } catch (error) {
                console.error('Error fetching files:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchFiles();
    }, []);

    const handleOpenFile = async (selectedFile: string) => {
        const filePath = await window.api.openFile(selectedFile);
        if (filePath) {
            console.log('Opened file:', filePath);
        }
    };

    const handleShowFile = async (selectedFile: string) => {
        const filePath = await window.api.showFile(selectedFile);
        if (filePath) {
            console.log('Shown file:', filePath);
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <SettingsPanel />
            <footer className="fixed bottom-4 right-4">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        window.api.linkExternal("https://github.com/kelnishi/PopUI");
                    }}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                    Support PopUI on Github &nbsp;
                    <Github className="mr-2 h-4 w-4" />
                </a>
            </footer>
        </div>
    );
};

export default App;