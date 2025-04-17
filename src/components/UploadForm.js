import React, { useState } from 'react';

function UploadForm({ selectedFolder }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Store the original file without any encoding manipulation
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedFolder) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', selectedFolder.id);

    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded successfully:', result);
        setFile(null);
        // Trigger document list refresh in parent component
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload file');
        console.error('Upload failed:', errorData);
      }
    } catch (error) {
      setError('Error uploading document: ' + error.message);
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!selectedFolder) {
    return null;
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="upload-form">
        <h3>Upload Document to {selectedFolder.name}</h3>
        <input
          type="file"
          onChange={handleFileChange}
          className="input-field"
          accept=".pdf,.doc,.docx,.hwp,.jpg,.jpeg,.png"
          disabled={uploading}
        />
        {file && (
          <div className="file-info">
            <strong>Selected file:</strong> {file.name}
          </div>
        )}
        <button type="submit" className="button" disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default UploadForm;