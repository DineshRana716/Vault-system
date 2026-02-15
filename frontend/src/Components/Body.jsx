import React from "react";
import style from "./Body.module.css";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Body = ({ refreshTrigger = 0, currentFolderId = null }) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [folderInfo, setFolderInfo] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const renameInputRef = useRef(null);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    if (renamingId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const url =
      currentFolderId == null
        ? "http://localhost:3000/files?parent_id="
        : `http://localhost:3000/files?parent_id=${encodeURIComponent(currentFolderId)}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFiles(res.data))
      .catch((err) => console.error("Error fetching files", err));
  }, [refreshTrigger, currentFolderId]);

  useEffect(() => {
    if (!currentFolderId) {
      setFolderInfo(null);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`http://localhost:3000/files/${currentFolderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data?.type === "FOLDER") setFolderInfo(res.data);
        else setFolderInfo(null);
      })
      .catch(() => setFolderInfo(null));
  }, [currentFolderId]);

  const handleRename = (e, file) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingId(file.id);
    setEditingName(file.original_name);
  };

  const submitRename = async () => {
    if (renamingId == null) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const name = editingName.trim();
    if (!name) {
      setRenamingId(null);
      return;
    }
    try {
      await axios.put(
        `http://localhost:3000/files/${renamingId}/rename`,
        { newName: name },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setFiles((prev) =>
        prev.map((f) =>
          f.id === renamingId ? { ...f, original_name: name } : f,
        ),
      );
    } catch (err) {
      console.error("Error renaming file", err);
    }
    setRenamingId(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  const handleDelete = async (e, file) => {
    e.stopPropagation();
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.original_name}"?`,
    );
    if (!confirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.delete(`http://localhost:3000/files/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error("Error deleting file", err);
    }
  };

  const handleItemClick = (file) => {
    if (renamingId === file.id) return;
    if (file.type === "FOLDER") {
      navigate(`/home/folder/${file.id}`);
      return;
    }
    handleFileOpen(file.id);
  };

  const handleFileOpen = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`http://localhost:3000/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Error opening file", err);
    }
  };

  const goBack = () => {
    if (!folderInfo?.parent_id) navigate("/home");
    else navigate(`/home/folder/${folderInfo.parent_id}`);
  };

  return (
    <div className={style.bodySection}>
      {(currentFolderId || folderInfo) && (
        <nav className={style.breadcrumb}>
          <button
            type="button"
            className={style.breadcrumbBack}
            onClick={goBack}
            aria-label="Go back"
          >
            ← Back
          </button>
          <span className={style.breadcrumbPath}>
            <button
              type="button"
              className={style.breadcrumbLink}
              onClick={() => navigate("/home")}
            >
              Home
            </button>
            {folderInfo && (
              <>
                <span className={style.breadcrumbSep}>/</span>
                <span className={style.breadcrumbCurrent}>
                  {folderInfo.original_name}
                </span>
              </>
            )}
          </span>
        </nav>
      )}
      <div className={style.fileList}>
        {files.length === 0 ? (
          <p className={style.emptyMessage}>No items in this folder</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`${style.fileItem} ${file.type === "FOLDER" ? style.fileItemFolder : ""}`}
              onClick={() => handleItemClick(file)}
            >
              {renamingId === file.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  className={style.renameInput}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitRename();
                    } else if (e.key === "Escape") {
                      cancelRename();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className={style.fileName}>
                    {file.type === "FOLDER" && (
                      <span className={style.folderIcon} aria-hidden>
                        📁{" "}
                      </span>
                    )}
                    {file.original_name}
                  </span>
                </>
              )}
              <div
                className={style.fileItemRight}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={style.menuBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === file.id ? null : file.id);
                  }}
                  aria-label="Open menu"
                >
                  ⋮
                </button>
                {openMenuId === file.id && (
                  <div className={style.dropdown}>
                    <button
                      type="button"
                      className={style.dropdownItem}
                      onClick={(e) => handleRename(e, file)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={style.dropdownItem}
                      onClick={(e) => handleDelete(e, file)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Body;
