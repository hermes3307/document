import React, { useState, useEffect } from 'react';
import '../styles/DocumentList.css';

function DocumentList({ selectedFolder }) {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFilename, setNewFilename] = useState('');

  useEffect(() => {
    if (selectedFolder) {
      fetchDocuments();
    }
  }, [selectedFolder]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/documents?folderId=${selectedFolder.id}`);
      if (response.ok) {
        const data = await response.json();
        // No need for additional decoding as the server now handles it
        setDocuments(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch documents');
      }
    } catch (error) {
      setError('Error fetching documents: ' + error.message);
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRename = (document) => {
    setEditingId(document.id);
    setNewFilename(document.filename);
  };

  const cancelRename = () => {
    setEditingId(null);
    setNewFilename('');
  };

  const handleRename = async (documentId) => {
    if (!newFilename.trim()) {
      alert('Filename cannot be empty');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newFilename: newFilename }),
      });

      if (response.ok) {
        fetchDocuments();
        setEditingId(null);
        setNewFilename('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to rename document');
      }
    } catch (error) {
      console.error('Error renaming document:', error);
      alert('Error renaming document: ' + error.message);
    }
  };

  const downloadDocument = async (documentId, filename) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Use the decoded filename
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document: ' + error.message);
    }
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDocuments();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  if (!selectedFolder) {
    return <div>Please select a folder to view documents</div>;
  }

  if (loading) {
    return <div>Loading documents...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h2>Documents in {selectedFolder.name}</h2>
      {documents.length === 0 ? (
        <p>No documents in this folder</p>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li key={document.id} className="document-item">
              <div>
                {editingId === document.id ? (
                  <div className="rename-form">
                    <input
                      type="text"
                      value={newFilename}
                      onChange={(e) => setNewFilename(e.target.value)}
                      className="rename-input"
                    />
                    <button
                      className="button"
                      onClick={() => handleRename(document.id)}
                      style={{ marginRight: '5px' }}
                    >
                      Save
                    </button>
                    <button
                      className="button"
                      onClick={cancelRename}
                      style={{ backgroundColor: '#6c757d' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <strong>{document.filename}</strong>
                    <br />
                    <small>
                      Type: {document.file_type} | Size: {formatFileSize(document.file_size)}
                    </small>
                  </>
                )}
              </div>
              <div className="document-actions">
                <button
                  className="button"
                  onClick={() => downloadDocument(document.id, document.filename)}
                  style={{ marginRight: '5px' }}
                >
                  Download
                </button>
                <button
                  className="button"
                  onClick={() => startRename(document)}
                  style={{ marginRight: '5px', backgroundColor: '#ffc107' }}
                >
                  Rename
                </button>
                <button
                  className="button"
                  onClick={() => deleteDocument(document.id)}
                  style={{ backgroundColor: '#dc3545' }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocumentList;