import React from "react";
import style from "./Body.module.css";
import axios from "axios";
import { useState, useEffect } from "react";

const Body = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("token is ", token);
    if (!token) return;
    axios
      .get("http://localhost:3000/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setFiles(res.data);
        console.log("files are ", files);
      })
      .catch((err) => {
        console.error("Error fectching files", err);
      });
  }, []);

  return (
    <div className={style.bodySection}>
      <div className={style.fileList}>
        {files.length === 0 ? (
          <p className={style.emptyMessage}>no file in current directory</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className={style.fileItem}>
              <span className={style.fileName}>{file.original_name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Body;
