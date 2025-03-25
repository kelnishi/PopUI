import React, {useEffect, useState} from 'react';


// Declare the API interface available from preload script
declare global {
    interface Window {
        api: {
            serverRequest: (endpoint: string, data?: any) => Promise<any>;
            openFile: (windowName: string) => Promise<any>;
            showFile: (windowName: string) => Promise<any>;
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
        <div style={{padding: '20px'}}>
            <h1>Settings</h1>

            <div style={{marginBottom: '20px'}}>
                <h3>Files:</h3>
                {loading ? (
                    <p>Loading files...</p>
                ) : (
                    <ul>
                        {files.map(file => (
                            <li key={file.name}>
                                {file.name}
                                <button onClick={() => handleOpenFile(file.path)} style={{ marginLeft: '10px' }}>
                                    Load File
                                </button>
                                <button onClick={() => handleShowFile(file.path)} style={{ marginLeft: '10px' }}>
                                    Show File
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div>
    );
};

export default App;