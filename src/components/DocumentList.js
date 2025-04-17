import React, { useEffect } from 'react';

function DocumentList({ folderId, documents, setDocuments }) {
  useEffect(() => {
    fetchDocuments();
  }, [folderId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents?folderId=${folderId}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const downloadDocument = async (id, filename) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${id}/download`);
      const blob = await response.blob();
      
      // Create a temporary link to download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const deleteDocument = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const renameDocument = async (id, currentFilename) => {
    const newFilename = prompt('Enter new filename:', currentFilename);
    
    if (!newFilename || newFilename === currentFilename) return;

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${id}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newFilename }),
      });

      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error renaming document:', error);
    }
  };

  return (
    <div className="document-list">
      <h2>Documents</h2>
      {documents.map((doc) => (
        <div key={doc.id} className="document-item">
          <span>{doc.filename}</span>
          <div className="document-actions">
            <button
              className="button button-secondary"
              onClick={() => downloadDocument(doc.id, doc.filename)}
            >
              Download
            </button>
            <button
              className="button button-secondary"
              onClick={() => renameDocument(doc.id, doc.filename)}
            >
              Rename
            </button>
            <button
              className="button button-danger"
              onClick={() => deleteDocument(doc.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DocumentList;