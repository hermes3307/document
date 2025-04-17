import React, { useState, useEffect } from 'react';
import './App.css';
import DocumentList from './components/DocumentList';
import FolderList from './components/FolderList';
import UploadForm from './components/UploadForm';

function App() {
  const [selectedFolder, setSelectedFolder] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Document Management System</h1>
      </header>
      <div className="container">
        <div className="sidebar">
          <FolderList onFolderSelect={setSelectedFolder} />
        </div>
        <div className="main-content">
          <UploadForm selectedFolder={selectedFolder} />
          <DocumentList selectedFolder={selectedFolder} />
        </div>
      </div>
    </div>
  );
}

export default App;