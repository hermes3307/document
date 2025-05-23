const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database connection and initialization
const db = new sqlite3.Database('documents.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Create tables if they don't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating folders table:', err);
      } else {
        console.log('Folders table ready');
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        content BLOB NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES folders (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating documents table:', err);
      } else {
        console.log('Documents table ready');
      }
    });
  }
});

// Configure multer for file uploads
const upload = multer();

// API Routes
// Get all folders
app.get('/api/folders', (req, res) => {
  console.log('GET /api/folders - Fetching all folders');
  db.all('SELECT * FROM folders ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching folders:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Successfully fetched folders:', rows);
    res.json(rows);
  });
});

// Create new folder
app.post('/api/folders', (req, res) => {
  console.log('POST /api/folders - Creating new folder');
  console.log('Request body:', req.body);
  
  const { name } = req.body;
  
  if (!name) {
    console.error('No folder name provided');
    res.status(400).json({ error: 'Folder name is required' });
    return;
  }

  db.run('INSERT INTO folders (name) VALUES (?)', [name], function(err) {
    if (err) {
      console.error('Error creating folder:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Successfully created folder with ID:', this.lastID);
    res.json({ id: this.lastID });
  });
});

// Get documents in folder
app.get('/api/documents', (req, res) => {
  const { folderId } = req.query;
  db.all(
    'SELECT id, folder_id, filename, file_type, file_size, created_at FROM documents WHERE folder_id = ?',
    [folderId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Upload document
app.post('/api/documents', upload.single('file'), (req, res) => {
  const { folderId } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    // Use originalname as-is (UTF-8, do not convert)
    const originalFilename = file.originalname;
    const fileType = path.extname(originalFilename).toLowerCase();
    
    db.run(
      'INSERT INTO documents (folder_id, filename, file_type, content, file_size) VALUES (?, ?, ?, ?, ?)',
      [folderId, originalFilename, fileType, file.buffer, file.size],
      function(err) {
        if (err) {
          console.error('Error uploading document:', err);
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Download document
app.get('/api/documents/:id/download', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT filename, content, file_type FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    try {
      // Set the content type based on file type
      const contentType = row.file_type === '.pdf' ? 'application/pdf' : 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // Encode the filename for Content-Disposition
      const encodedFilename = encodeURIComponent(row.filename).replace(/['()]/g, escape);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      
      res.send(Buffer.from(row.content));
    } catch (error) {
      console.error('Error sending file:', error);
      res.status(500).json({ error: 'Error sending file' });
    }
  });
});

// Get file content for preview (text and PDF)
app.get('/api/documents/:id/content', (req, res) => {
  const { id } = req.params;
  db.get('SELECT filename, content, file_type FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    try {
      const textTypes = ['.txt', '.md', '.js', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp', '.csv', '.log'];
      if (textTypes.includes(row.file_type)) {
        const content = Buffer.from(row.content).toString('utf8');
        res.type('text/plain').send(content);
        return;
      }
      if (row.file_type === '.pdf') {
        res.type('application/pdf').send(Buffer.from(row.content));
        return;
      }
      // For other types (e.g., docx), indicate not supported for preview
      res.status(415).send('Preview not supported for this file type.');
    } catch (error) {
      console.error('Error previewing file:', error);
      res.status(500).json({ error: 'Error previewing file' });
    }
  });
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Document deleted' });
  });
});

// Rename document
app.put('/api/documents/:id/rename', (req, res) => {
  const { id } = req.params;
  const { newFilename } = req.body;

  if (!newFilename || newFilename.trim() === '') {
    res.status(400).json({ error: 'New filename is required' });
    return;
  }

  db.run(
    'UPDATE documents SET filename = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newFilename, id],
    function(err) {
      if (err) {
        console.error('Error renaming document:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.json({ message: 'Document renamed successfully' });
    }
  );
});

// List Windows drives (C:, D:, etc.)
app.get('/api/filesystem/root', (req, res) => {
  // On Windows, drives are typically A: to Z:
  const drives = [];
  for (let i = 67; i <= 90; i++) { // C to Z
    const drive = String.fromCharCode(i) + ':\\';
    if (fs.existsSync(drive)) {
      drives.push({
        name: drive.replace('\\', ''),
        path: drive,
        type: 'directory',
        children: []
      });
    }
  }
  res.json(drives);
});

// List folders/files for a given path
app.get('/api/filesystem/list', (req, res) => {
  const dirPath = req.query.path;
  if (!dirPath) return res.status(400).json({ error: 'No path provided' });
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = entries.map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      type: entry.isDirectory() ? 'directory' : 'file'
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});