import "./App.css";
import axios from "axios";
import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);

  const uploadfunc = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // MUST match multer field name

    try {
      await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Uploaded successfully");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div>
      <h1>Upload section</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={uploadfunc}>Upload</button>
    </div>
  );
}

export default App;
