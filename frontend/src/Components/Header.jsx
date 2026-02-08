import React, { useRef, useState } from "react";
import style from "./Header.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Header = ({ onUploadSuccess }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      onUploadSuccess?.();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <header className={style.header}>
      <input
        ref={fileInputRef}
        type="file"
        className={style.hiddenInput}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className={style.leftSection}>
        <button
          type="button"
          className={style.actionBtn}
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
      </div>
      <div className={style.rightSection}>
        <button
          type="button"
          className={style.actionBtn}
          onClick={handleLogout}
        >
          Logout
        </button>
        <span className={style.appName}>MYvault</span>
      </div>
    </header>
  );
};

export default Header;
