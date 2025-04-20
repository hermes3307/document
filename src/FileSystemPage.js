import React, { useState, useEffect } from 'react';

function FileSystemPage() {
  const [leftPanelItems, setLeftPanelItems] = useState([]); // drives or directories in left panel
  const [rightPanelItems, setRightPanelItems] = useState([]); // files and directories in right panel
  const [selectedItem, setSelectedItem] = useState(null); // currently selected item
  const [currentPath, setCurrentPath] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initially load drives
    loadDrives();
  }, []);

  const handleError = (error) => {
    console.error('File system error:', error);
    setError(error.message || 'An error occurred while accessing the file system');
    setIsLoading(false);
  };

  const loadDrives = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/filesystem/root');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const drives = await response.json();
      setLeftPanelItems(drives);
      setRightPanelItems([]);
      setCurrentPath('');
      setHistory([]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContents = async (path) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/filesystem/list?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const contents = await response.json();
      return contents;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeftPanelClick = async (item) => {
    setSelectedItem(item);
    const contents = await loadContents(item.path);
    if (contents) {
      setRightPanelItems(contents);
      setCurrentPath(item.path);
      setHistory(prev => [...prev, item.path]);
    }
  };

  const handleRightPanelClick = async (item) => {
    if (item.type === 'directory') {
      setSelectedItem(item);
      const contents = await loadContents(item.path);
      if (contents) {
        const directories = contents.filter(entry => entry.type === 'directory');
        setLeftPanelItems(directories);
        setRightPanelItems(contents);
        setCurrentPath(item.path);
        setHistory(prev => [...prev, item.path]);
      }
    }
  };

  const handleBack = async () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current path
      const previousPath = newHistory[newHistory.length - 1];
      
      const contents = await loadContents(previousPath);
      if (contents) {
        const directories = contents.filter(entry => entry.type === 'directory');
        setLeftPanelItems(directories);
        setRightPanelItems(contents);
        setCurrentPath(previousPath);
        setHistory(newHistory);
      }
    } else {
      loadDrives();
    }
  };

  const FileListItem = ({ item, onClick, isSelected }) => {
    const itemStyle = {
      padding: '8px',
      cursor: item.type === 'directory' ? 'pointer' : 'default',
      backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
      borderRadius: '4px',
      marginBottom: '2px',
      display: 'flex',
      alignItems: 'center',
    };

    const iconStyle = {
      marginRight: 8,
      color: item.type === 'directory' ? '#e6b800' : 'inherit'
    };

    return (
      <li
        style={itemStyle}
        onClick={onClick}
      >
        <span style={iconStyle}>
          {item.type === 'directory' ? '📁' : '📄'}
        </span>
        <span style={{ wordBreak: 'break-all' }}>{item.name}</span>
      </li>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleBack}
            style={{
              marginRight: 8,
              padding: '8px 16px',
              backgroundColor: history.length === 0 ? '#e0e0e0' : '#1976d2',
              color: history.length === 0 ? '#666' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: history.length === 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={history.length === 0 || isLoading}
          >
            ← Back
          </button>
          <div style={{ fontWeight: 'bold', color: '#1976d2', wordBreak: 'break-all' }}>
            {currentPath || 'Computer'}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          margin: '8px',
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', flex: 1, backgroundColor: '#fff' }}>
        <div style={{ 
          width: 320, 
          borderRight: '1px solid #eee', 
          overflowY: 'auto', 
          padding: '0 8px',
          backgroundColor: '#fafafa' 
        }}>
          <h3 style={{ marginLeft: 8, color: '#424242' }}>{currentPath ? 'Directories' : 'Drives'}</h3>
          {isLoading ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading...</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {leftPanelItems.map(item => (
                <FileListItem
                  key={item.path}
                  item={item}
                  onClick={() => handleLeftPanelClick(item)}
                  isSelected={selectedItem?.path === item.path}
                />
              ))}
              {leftPanelItems.length === 0 && (
                <li style={{ padding: '16px', color: '#666', textAlign: 'center' }}>
                  No directories found
                </li>
              )}
            </ul>
          )}
        </div>
        
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          <h3 style={{ color: '#424242' }}>Contents</h3>
          {isLoading ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading...</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rightPanelItems.map(item => (
                <FileListItem
                  key={item.path}
                  item={item}
                  onClick={() => item.type === 'directory' && handleRightPanelClick(item)}
                  isSelected={false}
                />
              ))}
              {rightPanelItems.length === 0 && (
                <li style={{ padding: '16px', color: '#666', textAlign: 'center' }}>
                  No items found
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileSystemPage;
