import React, { useState } from 'react';

function UploadForm({ folderId, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);

    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('File uploaded successfully');
        setFile(null);
        setError('');
        onUploadComplete();
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        const data = await response.json();
        setError(data.error || 'Upload failed');
        setSuccess('');
      }
    } catch (error) {
      setError('Error uploading file');
      setSuccess('');
      console.error('Error:', error);
    }
  };

  return (
    <div className="upload-form">
      <h3>Upload Document</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <input
            type="file"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setError('');
              setSuccess('');
            }}
          />
        </div>
        <button type="submit" className="button button-primary">
          Upload
        </button>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </form>
    </div>
  );
}

export default UploadForm;