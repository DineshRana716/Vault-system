import React, { useState } from "react";
import style from "./CreateFolderModal.module.css";

const CreateFolderModal = ({ onClose, onCreate, loading = false }) => {
  const [folderName, setFolderName] = useState("");

  const handleSubmit = () => {
    if (!folderName.trim()) return;
    onCreate(folderName);
  };

  return (
    <div className={style.overlay}>
      <div className={style.modal}>
        <h2 className={style.title}>Create New Folder</h2>

        <input
          type="text"
          placeholder="Enter folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className={style.input}
        />

        <div className={style.actions}>
          <button className={style.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button
            className={style.createBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
