const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const upload = require("./config/multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());

app.post("/upload", upload.single("file"), async (req, res) => {
  const { folder_id = null } = req.body;
  const file = req.file;

  const result = await pool.query(
    `INSERT INTO files
     (original_name, stored_name, path, size, mime_type, folder_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      file.originalname,
      file.filename,
      file.path,
      file.size,
      file.mimetype,
      folder_id,
    ],
  );

  res.json(result.rows[0]);
});

app.get("/files", async (req, res) => {
  const result = await pool.query(
    "select * from files order by created_at desc",
  );
  //console.log(result.rows);
  res.json(result.rows);
});

app.get("/files/:id", async (req, res) => {
  const { id } = req.params;
  console.log("id is " + id);
  const result = await pool.query("select * from files where id=$1", [id]);
  console.log("result is " + result.rows);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "file not found" });
  }
  const file = result.rows[0];
  res.sendFile(path.resolve(file.path));
});

app.get("/files/:id/preview", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM files WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }
    const file = result.rows[0];

    res.setHeader("Content-Type", file.mime_type);
    res.setHeader("Content-Disposition", "inline");

    res.sendFile(path.resolve(file.path));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete("/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("select * from files where id=$1 ", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json("file not found");
    }
    const file = result.rows[0];
    fs.unlinkSync(path.resolve(file.path));
    await pool.query("delete from files where id=$1", [id]);
    res.json({ message: "file deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/folders", async (req, res) => {
  const { name, parent_id = null } = req.body;

  const result = await pool.query(
    "INSERT INTO folders (name, parent_id) VALUES ($1, $2) RETURNING *",
    [name, parent_id],
  );

  res.json(result.rows[0]);
});

app.listen(3000, () => console.log("Server running on 3000"));
