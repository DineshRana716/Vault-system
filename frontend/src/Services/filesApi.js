import axios from "axios";

const BASE = "http://localhost:3000";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const getFiles = (token, parentId = null) => {
  const url =
    parentId == null
      ? `${BASE}/files?parent_id=`
      : `${BASE}/files?parent_id=${encodeURIComponent(parentId)}`;
  return axios.get(url, { headers: authHeaders(token) });
};

export const getFileMeta = (token, id) => {
  return axios.get(`${BASE}/files/${id}`, { headers: authHeaders(token) });
};

/** Returns { url } — url is a signed S3 URL or null for local files. */
export const getDownloadUrl = (token, id) => {
  return axios.get(`${BASE}/files/${id}/download-url`, {
    headers: authHeaders(token),
  });
};

/** Fetch file as blob (for local files when download-url returns url: null). */
export const getFileBlob = (token, id) => {
  return axios.get(`${BASE}/files/${id}`, {
    headers: authHeaders(token),
    responseType: "blob",
  });
};

export const deleteFile = (token, id) => {
  return axios.delete(`${BASE}/files/${id}`, { headers: authHeaders(token) });
};

export const renameFile = (token, id, newName) => {
  return axios.put(
    `${BASE}/files/${id}/rename`,
    { newName },
    { headers: authHeaders(token) },
  );
};

export const createFolder = (token, name, parentId = null) => {
  return axios.post(
    `${BASE}/folder`,
    { name: name.trim(), parent_id: parentId },
    { headers: authHeaders(token) },
  );
};

export const uploadFile = (token, file, parentId = null) => {
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) formData.append("parent_id", parentId);
  return axios.post(`${BASE}/upload`, formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });
};
