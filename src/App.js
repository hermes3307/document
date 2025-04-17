import React, { useState, useEffect } from 'react';
import './App.css';
import FolderList from './components/FolderList';
import DocumentList from './components/DocumentList';
import UploadForm from './components/UploadForm';

function App() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    const response = await fetch('http://localhost:5000/api/folders');
    const data = await response.json();
    setFolders(data);
  };

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
  };

  return (
    <div className="App">
      <h1>Document Management System</h1>
      <div className="container">
        <FolderList 
          folders={folders} 
          onFolderSelect={handleFolderSelect}
          selectedFolder={selectedFolder}
        />
        {selectedFolder && (
          <div className="document-section">
            <DocumentList 
              folderId={selectedFolder.id}
              documents={documents}
              setDocuments={setDocuments}
            />
            <UploadForm 
              folderId={selectedFolder.id}
              onUploadComplete={() => {
                // Refresh document list after upload
                fetchDocuments(selectedFolder.id);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;