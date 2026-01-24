/\*\*

- Multer is a Node.js middleware for handling file uploads.
-
- It processes incoming requests with enctype="multipart/form-data",
- typically used for uploading files from HTML forms.
-
- Key features:
- - Parses multipart form data
- - Stores uploaded files in memory or disk
- - Provides file metadata (name, size, mimetype, etc.)
- - Supports single or multiple file uploads
- - Configurable storage, file filtering, and size limits
-
- @module multer
- @description Middleware for handling file uploads in Express.js applications
  \*/

## Installation

```bash
npm install multer
```

## Basic Usage

```javascript
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully");
});
```

## Configuration

we have made a api /preview which shows the file in browser . for that we used to set the header to
res.setHeader("Content-Disposition", "inline");
the inline is used to preview the content

to make the file downlaod we can set the header like
res.setHeader(
"Content-Disposition",
`attachment; filename="${file.original_name}"`
);
