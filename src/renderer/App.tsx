import React, {useEffect, useState} from 'react';

// Declare the API interface available from preload script
declare global {
    interface Window {
        api: {
            serverRequest: (endpoint: string, data?: any) => Promise<any>;
            mcpRequest: (message: any) => Promise<any>;
        };
    }
}

interface DataItem {
    id: number;
    name: string;
}

interface ServerData {
    items: DataItem[];
}

const App: React.FC = () => {
    const [message, setMessage] = useState<string>('');
    const [items, setItems] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [mcpResult, setMcpResult] = useState<string>('');
    const [mcpLoading, setMcpLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [num1, setNum1] = useState<number>(0);
    const [num2, setNum2] = useState<number>(0);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    useEffect(() => {
        // Fetch hello message from server
        const fetchMessage = async () => {
            try {
                const response = await window.api.serverRequest('/api/hello');
                setMessage(response.message);
            } catch (error) {
                console.error('Error fetching message:', error);
                setMessage('Failed to connect to server');
            }
        };

        // Fetch data from server
        const fetchData = async () => {
            try {
                const response: ServerData = await window.api.serverRequest('/api/data');
                setItems(response.items);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessage();
        fetchData();
    }, []);

    // MCP greeting handler
    const handleGreeting = async () => {
        if (!name) return;

        setMcpLoading(true);
        try {
            // Format the MCP request for the greeting resource
            const message = {
                jsonrpc: "2.0",
                method: "getResource",
                params: {
                    uri: `greeting://${name}`
                },
                id: 1
            };

            const response = await window.api.mcpRequest(message);
            if (response.result && response.result.contents && response.result.contents[0]) {
                setMcpResult(response.result.contents[0].text);
            } else {
                setMcpResult('No greeting received');
            }
        } catch (error) {
            console.error('Error with MCP greeting:', error);
            setMcpResult('Error communicating with MCP server');
        } finally {
            setMcpLoading(false);
        }
    };

    // MCP add handler
    const handleAdd = async () => {
        setMcpLoading(true);
        try {
            // Format the MCP request for the add tool
            const message = {
                jsonrpc: "2.0",
                method: "executeTool",
                params: {
                    name: "add",
                    parameters: {a: num1, b: num2}
                },
                id: 2
            };

            const response = await window.api.mcpRequest(message);
            if (response.result && response.result.content && response.result.content[0]) {
                setMcpResult(response.result.content[0].text);
            } else {
                setMcpResult('No result received');
            }
        } catch (error) {
            console.error('Error with MCP add:', error);
            setMcpResult('Error communicating with MCP server');
        } finally {
            setMcpLoading(false);
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
                <h2>Express Server Data</h2>
                <p>Server message: {message}</p>

                <h3>Data from Server:</h3>
                {loading ? (
                    <p>Loading data...</p>
                ) : (
                    <ul>
                        {items.map(item => (
                            <li key={item.id}>{item.name}</li>
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