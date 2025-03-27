# RAG Chatbot Frontend

This is a React-based frontend application for interacting with the RAG Chatbot API. It provides interfaces for document management and natural language querying of your documents.

## Features

- **Document Management**: Upload, organize, and delete documents and collections
- **Chat Interface**: Ask questions about your documents using natural language
- **Multi-Collection Support**: Query across multiple document collections at once
- **Settings Management**: Configure API connection details

## Setup & Installation

1. Ensure you have [Node.js](https://nodejs.org/) (v14 or later) installed.

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. The application will open in your browser at `http://localhost:3000`.

## Building for Production

To create a production build:

```
npm run build
```

This generates optimized files in the `build` folder that you can deploy to any static hosting service.

## API Configuration

The first time you use the application, you'll need to set up the API connection:

1. Navigate to the Settings page
2. Enter your API URL (e.g., `http://localhost:8000/api`)
3. Enter your API key if required
4. Click "Save Configuration" and test the connection

## Usage

### Document Management

1. Go to the Document Manager page
2. Use the "Upload Document" tab to add new documents
3. Specify collection name or leave blank for automatic naming
4. Adjust chunking configuration if needed
5. View and manage your collections on the Collections tab

### Chat Interface

1. Go to the Chat Interface page
2. Select collections to search from the sidebar
3. Type your question in the input field and press Enter
4. The answer will be displayed with relevant sources
5. Adjust advanced settings like top-K, temperature, etc., as needed

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- RAG Chatbot API running and accessible

## Troubleshooting

If you encounter connection issues:

1. Verify the API server is running
2. Check that the API URL is correct in Settings
3. Test the connection using the "Test Connection" button
4. Check browser console for CORS errors and configure API accordingly 