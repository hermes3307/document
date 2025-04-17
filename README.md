# Document Management System

A web-based document management system built with React and Node.js that supports Korean filename handling.

## Features

- Create and manage folders
- Upload documents with support for Korean filenames
- Download documents
- Rename documents
- Delete documents
- Clean and modern UI
- Full Unicode support for Korean characters

## Tech Stack

- Frontend:
  - React
  - Modern CSS
  - Fetch API for network requests

- Backend:
  - Node.js
  - Express
  - SQLite3
  - Multer for file uploads

## Project Structure

```
document-management-system/
├── src/                    # React frontend source
│   ├── components/        # React components
│   ├── styles/           # CSS styles
│   ├── App.js           # Main App component
│   └── index.js         # React entry point
├── server.js              # Express backend server
├── public/                # Static files
└── package.json          # Project dependencies
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   node server.js
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser

## API Endpoints

- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create a new folder
- `GET /api/documents` - Get documents in a folder
- `POST /api/documents` - Upload a document
- `GET /api/documents/:id/download` - Download a document
- `DELETE /api/documents/:id` - Delete a document
- `PUT /api/documents/:id/rename` - Rename a document

## Development

The project uses:
- React for the frontend UI
- Express.js for the backend API
- SQLite for data storage
- Proper encoding handling for Korean filenames

## License

MIT License