import React, { useState, useEffect } from 'react';

function FolderList({ onFolderSelect }) {
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();
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
        fetchFolders();
      } else {
        const errorData = await response.json();
        console.error('Error creating folder:', errorData);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <div>
      <h2>Folders</h2>
      <form onSubmit={createFolder} className="upload-form">
        <input
          type="text"
          className="input-field"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New Folder Name"
        />
        <button type="submit" className="button">Create Folder</button>
      </form>
      <ul className="folder-list">
        {folders.map((folder) => (
          <li
            key={folder.id}
            className="folder-item"
            onClick={() => onFolderSelect(folder)}
          >
            {folder.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FolderList;