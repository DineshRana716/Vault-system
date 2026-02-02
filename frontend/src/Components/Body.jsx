import React from "react";
import style from "./Body.module.css";

// Mock files for layout demo – replace with API data later
const MOCK_FILES = [
  { id: 1, name: "document.pdf", type: "file" },
  { id: 2, name: "image.png", type: "file" },
  { id: 3, name: "notes.txt", type: "file" },
  { id: 4, name: "report.docx", type: "file" },
  { id: 5, name: "spreadsheet.xlsx", type: "file" },
  { id: 6, name: "presentation.pptx", type: "file" },
  { id: 7, name: "photo.jpg", type: "file" },
  { id: 8, name: "archive.zip", type: "file" },
  { id: 9, name: "readme.md", type: "file" },
  { id: 10, name: "config.json", type: "file" },
];

const Body = () => {
  const files = MOCK_FILES; // Replace with state from API later

  return (
    <div className={style.bodySection}>
      <div className={style.fileList}>
        {files.length === 0 ? (
          <p className={style.emptyMessage}>no file in current directory</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className={style.fileItem}>
              <span className={style.fileName}>{file.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Body;
