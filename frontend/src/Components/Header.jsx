import React, { useRef, useState } from "react";
import style from "./Header.module.css";
import { useNavigate } from "react-router-dom";
import { uploadFile, createFolder } from "../Services/filesApi";

const Header = ({
  currentFolderId = null,
  onUploadSuccess,
  onFolderCreated,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

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
      await uploadFile(token, file, currentFolderId);
      onUploadSuccess?.();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleNewFolder = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    setCreatingFolder(true);
    try {
      await createFolder(token, name, currentFolderId);
      onFolderCreated?.();
    } catch (err) {
      console.error("Create folder failed", err);
      alert(err.response?.data?.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
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
        <button
          type="button"
          className={style.actionBtn}
          onClick={handleNewFolder}
          disabled={creatingFolder}
        >
          {creatingFolder ? "Creating…" : "New folder"}
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
