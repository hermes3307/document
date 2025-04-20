import React, { useEffect, useState } from 'react';

function DocumentList({ folderId, documents, setDocuments }) {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalFileType, setModalFileType] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

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

  // Fetch file content and show modal
  const handleShowFile = async (doc) => {
    setShowModal(true);
    setModalTitle(doc.filename);
    setLoadingContent(true);
    setModalFileType(doc.file_type);
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${doc.id}/content`);
      if (response.ok) {
        if (doc.file_type === '.pdf') {
          const blob = await response.blob();
          setModalContent(URL.createObjectURL(blob));
        } else {
          const data = await response.text();
          setModalContent(data);
        }
      } else {
        setModalContent('Preview not supported for this file type.');
      }
    } catch (err) {
      setModalContent('Error loading file content.');
    }
    setLoadingContent(false);
  };

  return (
    <div className="document-list">
      <h2>Documents</h2>
      {documents.map((doc) => (
        <div key={doc.id} className="document-item file-hover" onClick={() => handleShowFile(doc)}>
          <span>{doc.filename}</span>
          <div className="document-actions" onClick={e => e.stopPropagation()}>
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
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{modalTitle}</h3>
            <div className="modal-body" style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxHeight: 400, overflowY: 'auto' }}>
              {loadingContent ? 'Loading...' : (
                modalFileType === '.pdf' ? (
                  <iframe src={modalContent} title="PDF Preview" width="100%" height="400px" style={{ border: 'none' }} />
                ) : modalFileType === '.docx' ? (
                  <span>Preview not supported for DOCX files. Please download to view.</span>
                ) : (
                  modalContent
                )
              )}
            </div>
            <button className="button button-primary" onClick={() => setShowModal(false)} style={{ marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;