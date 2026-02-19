import React, { useRef, useState } from "react";
import style from "./Header.module.css";
import { useNavigate } from "react-router-dom";
import { uploadFile, createFolder } from "../Services/filesApi";
import CreateFolderModal from "./CreateFolderModal";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Searchbar from "./Searchbar";

const Header = ({
  currentFolderId = null,
  onUploadSuccess,
  onFolderCreated,
  onSearch,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

  const handleCreateFolder = async (name) => {
    const token = localStorage.getItem("token");
    if (!token || !name.trim()) return;

    setCreatingFolder(true);
    try {
      await createFolder(token, name, currentFolderId);
      onFolderCreated?.();
      setShowModal(false);
    } catch (err) {
      console.error("Create folder failed", err);
      alert(err.response?.data?.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <>
      <header className={style.header}>
        <input
          ref={fileInputRef}
          type="file"
          className={style.hiddenInput}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.txt"
        />

        <div className={style.leftSection}>
          <button
            type="button"
            className={style.actionBtn}
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <UploadFileOutlinedIcon className={style.btnIcon} />
            {uploading ? "Uploading…" : "Upload file"}
          </button>

          <button
            type="button"
            className={style.actionBtn}
            onClick={() => setShowModal(true)}
          >
            <AddOutlinedIcon className={style.btnIcon} />
            New folder
          </button>
        </div>

        <div className={style.centerSection}>
          <Searchbar onSearch={onSearch} />
        </div>

        <div className={style.rightSection}>
          <button
            type="button"
            className={style.actionBtn}
            onClick={handleLogout}
          >
            <LogoutOutlinedIcon />
          </button>
        </div>
      </header>

      {showModal && (
        <CreateFolderModal
          loading={creatingFolder}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateFolder}
        />
      )}
    </>
  );
};

export default Header;
