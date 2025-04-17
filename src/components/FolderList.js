import React, { useState } from 'react';

function FolderList({ folders, onFolderSelect, selectedFolder }) {
  const [newFolderName, setNewFolderName] = useState('');

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newFolderName }),
      });

      if (response.ok) {
        setNewFolderName('');
        // Refresh folders list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <div className="folder-list">
      <h2>Folders</h2>
      <div className="form-group">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder name"
        />
        <button className="button button-primary" onClick={createFolder}>
          Create Folder
        </button>
      </div>
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={`folder-item ${selectedFolder?.id === folder.id ? 'selected' : ''}`}
          onClick={() => onFolderSelect(folder)}
        >
          {folder.name}
        </div>
      ))}
    </div>
  );
}

export default FolderList;