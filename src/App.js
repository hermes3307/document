import React, { useState, useEffect } from 'react';
import './App.css';
import FolderList from './components/FolderList';
import DocumentList from './components/DocumentList';
import UploadForm from './components/UploadForm';
import FileSystemPage from './FileSystemPage';

function App() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [menu, setMenu] = useState('documents');

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    // Automatically select the first folder if available and none is selected
    if (folders.length > 0 && !selectedFolder) {
      setSelectedFolder(folders[0]);
    }
  }, [folders, selectedFolder]);

  const fetchFolders = async () => {
    const response = await fetch('http://localhost:5000/api/folders');
    const data = await response.json();
    setFolders(data);
  };

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
  };

  // Upload Folder handler
  const handleUploadFolder = () => {
    // Create a hidden input for folder selection
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (!selectedFolder) {
        alert('Please select a folder before uploading.');
        return;
      }
      // Only allow office, pdf, hwp files recursively
      const allowed = ['pdf','doc','docx','xls','xlsx','ppt','pptx','hwp'];
      const validFiles = files.filter(f => allowed.includes(f.name.split('.').pop().toLowerCase()));
      if (validFiles.length === 0) return;
      // Show progress UI
      setBatchProgress({ total: validFiles.length, current: 0, uploading: true });
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', selectedFolder.id);
        await fetch('http://localhost:5000/api/documents', {
          method: 'POST',
          body: formData
        });
        setBatchProgress({ total: validFiles.length, current: i + 1, uploading: true });
      }
      setBatchProgress({ total: validFiles.length, current: validFiles.length, uploading: false });
      setTimeout(() => setBatchProgress(null), 2000);
      fetchDocuments(selectedFolder.id);
      document.body.removeChild(input);
    };
    input.click();
  };

  const fetchDocuments = async (folderId) => {
    const response = await fetch(`http://localhost:5000/api/documents?folderId=${folderId}`);
    const data = await response.json();
    setDocuments(data);
  };

  return (
    <div className="App">
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 16 }}>
        <button className={`menu-btn${menu === 'documents' ? ' active' : ''}`} onClick={() => setMenu('documents')}>Documents</button>
        <button className={`menu-btn${menu === 'filesystem' ? ' active' : ''}`} onClick={() => setMenu('filesystem')}>File system</button>
        <button className={`menu-btn${menu === 'setting' ? ' active' : ''}`} onClick={() => setMenu('setting')}>Setting</button>
      </div>
      {menu === 'documents' && (
        <>
          {batchProgress && (
            <div style={{ position: 'fixed', top: 10, right: 10, background: '#fff3e0', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 2000, minWidth: 240 }}>
              <b>Uploading files...</b>
              <div style={{ margin: '8px 0' }}>
                <div style={{ background: '#eee', height: 8, borderRadius: 4 }}>
                  <div style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%`, background: '#1976d2', height: 8, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>
                  {batchProgress.current} / {batchProgress.total} 문서 업로드
                </div>
              </div>
              {!batchProgress.uploading && <span style={{ color: '#388e3c' }}>Upload complete!</span>}
            </div>
          )}
          <div className="container">
            <FolderList 
              folders={folders} 
              onFolderSelect={handleFolderSelect}
              selectedFolder={selectedFolder}
              onUploadFolder={handleUploadFolder}
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
                  onUploadComplete={() => fetchDocuments(selectedFolder.id)}
                />
              </div>
            )}
          </div>
        </>
      )}
      {menu === 'filesystem' && <FileSystemPage />}
      {menu === 'setting' && <div style={{ padding: 40 }}><h2>Settings</h2><p>Settings page coming soon.</p></div>}
    </div>
  );
}

export default App;