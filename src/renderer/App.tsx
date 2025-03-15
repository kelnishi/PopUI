import React, {useEffect, useState} from 'react';


// Declare the API interface available from preload script
declare global {
    interface Window {
        api: {
            serverRequest: (endpoint: string, data?: any) => Promise<any>;
            openFile: (windowName: string) => Promise<any>;
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

    // Handle file upload
    const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploadStatus('Uploading...');

        const fileInput = e.currentTarget.elements.namedItem('file') as HTMLInputElement;

        if (!fileInput.files || fileInput.files.length === 0) {
            setUploadStatus('Error: No file selected');
            return;
        }

        const file = fileInput.files[0];

        try {
            // Read file as ArrayBuffer
            const fileBuffer = await file.arrayBuffer();
            const fileArray = Array.from(new Uint8Array(fileBuffer));

            // Send file to the server
            const response = await window.api.serverRequest('/upload', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileData: fileArray
            });

            console.log('Upload response:', response);
            setUploadStatus(`File "${file.name}" uploaded successfully!`);

            // Reset file input
            fileInput.value = '';
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus('Error: File upload failed');
        }
    };

    return (
        <div style={{padding: '20px'}}>
            <h1>Electron Server with MCP</h1>

            <div style={{marginBottom: '20px'}}>
                <h3>Files:</h3>
                {loading ? (
                    <p>Loading files...</p>
                ) : (
                    <ul>
                        {files.map(file => (
                            <li key={file.name}>
                                {file.name} - {file.path}
                                <button onClick={() => handleOpenFile(file.path)} style={{ marginLeft: '10px' }}>
                                    Load File
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* File upload UI */}
            <div style={{marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px'}}>
                <h2>File Upload</h2>
                <form onSubmit={handleFileUpload}>
                    <div style={{marginBottom: '10px'}}>
                        <input
                            type="file"
                            name="file"
                            required
                            accept=".tsx"
                            style={{marginRight: '10px'}}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: '5px 15px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Upload
                        </button>
                    </div>
                    {uploadStatus && (
                        <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            backgroundColor: uploadStatus.includes('Error') ? '#ffebee' : '#e8f5e9',
                            borderRadius: '4px'
                        }}>
                            {uploadStatus}
                        </div>
                    )}
                </form>
            </div>

        </div>
    );
};

export default App;