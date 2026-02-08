import React from "react";
import style from "./Body.module.css";
import axios from "axios";
import { useState, useEffect, useRef } from "react";

const Body = () => {
  const [files, setFiles] = useState([]);
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
    console.log("token is ", token);
    if (!token) return;
    axios
      .get(`http://localhost:3000/files`, {
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFiles((prev) =>
        prev.map((f) =>
          f.id === renamingId ? { ...f, original_name: name } : f
        )
      );
    } catch (err) {
      console.error("Error renaming file", err);
    }
    setRenamingId(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  const handleDelete = (e, file) => {
    e.stopPropagation();
    setOpenMenuId(null);
    // TODO: implement delete
  };

  const handleFileClick = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`http://localhost:3000/files/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // optional cleanup later
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
    } catch (err) {
      console.log("error in opening file", err);
    }
  };

  return (
    <div className={style.bodySection}>
      <div className={style.fileList}>
        {files.length === 0 ? (
          <p className={style.emptyMessage}>no file in current directory</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={style.fileItem}
              onClick={() => {
                if (renamingId === file.id) return;
                handleFileClick(file.id);
              }}
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
                <span className={style.fileName}>{file.original_name}</span>
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
