require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const upload = require("./config/multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.jwt_secret;
const authMiddleware = require("./middleware/authorization");
const getHash = require("./config/cryptohash");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { folder_id = null } = req.body;
    const file = req.file;
    const userId = req.user.user_id;

    // 1️⃣ hash the uploaded file
    const fileHash = await getHash(file.path);

    // 2️⃣ check if file already exists
    const existingFile = await pool.query(
      `SELECT * FROM stored_files WHERE hash = $1`,
      [fileHash],
    );

    let storedFileId;

    if (existingFile.rowCount > 0) {
      // 3️⃣ duplicate file → reuse
      storedFileId = existingFile.rows[0].id;

      await pool.query(
        `UPDATE stored_files
           SET ref_count = ref_count + 1
           WHERE id = $1`,
        [storedFileId],
      );

      // remove newly uploaded duplicate
      fs.unlinkSync(file.path);
    } else {
      // 4️⃣ new file → store physically
      const storedResult = await pool.query(
        `INSERT INTO stored_files
           (hash, path, size, mime_type, ref_count)
           VALUES ($1,$2,$3,$4,1)
           RETURNING id`,
        [fileHash, file.path, file.size, file.mimetype],
      );

      storedFileId = storedResult.rows[0].id;
    }

    // 5️⃣ create user ↔ file mapping
    const userFile = await pool.query(
      `INSERT INTO user_files
         (user_id, stored_file_id, original_name, folder_id)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
      [userId, storedFileId, file.originalname, folder_id],
    );

    res.json(userFile.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "upload failed" });
  }
});

app.get("/files", authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  //console.log("user id is ", userId);
  const result = await pool.query("select * from user_files where user_id=$1", [
    userId,
  ]);
  //console.log(result.rows);
  res.json(result.rows);
});

app.get("/files/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  const result = await pool.query(
    "select * from user_files where id=$1 and user_id=$2",
    [id, userId],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "file not found" });
  }
  const storedId = await pool.query("select * from stored_files where id=$1", [
    result.rows[0].stored_file_id,
  ]);
  if (storedId.rows.length === 0) {
    return res.status(404).json({ message: "file not found" });
  }

  //here we re sendong content type of the file to the frontend so it do necces operations
  res.setHeader("Content-Type", storedId.rows[0].mime_type);
  //opening file. We don't do path.resolve as we already store absolute path
  res.sendFile(storedId.rows[0].path, { root: "." });
});

app.get("/files/:id/preview", authMiddleware, async (req, res) => {
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
app.delete("/files/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    //console.log("id and user ", id, " ", userId);
    const result = await pool.query(
      "select * from user_files where id=$1 and user_id=$2 ",
      [id, userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json("file not found");
    }
    //console.log("file is ", JSON.stringify(result.rows[0]));
    const file = result.rows[0];
    const storedId = await pool.query(
      "select * from stored_files where id=$1",
      [file.stored_file_id],
    );
    if (storedId.rows.length === 0) {
      return res.status(404).json("file not found");
    }
    //fs.unlinkSync(storedId.rows[0].path);
    const result_stored = await pool.query(
      `UPDATE stored_files
   SET ref_count = ref_count - 1
   WHERE id = $1
   RETURNING ref_count, path`,
      [storedId.rows[0].id],
    );

    const count = result_stored.rows[0].ref_count;
    console.log("count", count);
    if (count <= 0) {
      fs.unlinkSync(storedId.rows[0].path);
      await pool.query("delete from stored_files where id=$1", [
        storedId.rows[0].id,
      ]);
    }
    await pool.query("delete from user_files where id=$1 and user_id=$2", [
      id,
      userId,
    ]);
    res.json({ message: "file deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/folders", authMiddleware, async (req, res) => {
  const { name, parent_id = null } = req.body;

  const result = await pool.query(
    "INSERT INTO folders (name, parent_id) VALUES ($1, $2) RETURNING *",
    [name, parent_id],
  );

  res.json(result.rows[0]);
});
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert user
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword],
    );

    // 5. Success response
    res.status(201).json({
      message: "User created successfully",
      user_id: result.rows[0].id,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(404)
        .json({ message: "email and password are required" });
    }
    //check if user exists
    const result = await pool.query("select * from users where email=$1", [
      email,
    ]);
    const user = result.rows[0];
    //console.log("TOKEN is ");
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    //generate token
    const token = jwt.sign({ user_id: user.id }, jwt_secret, {
      expiresIn: "1h",
    });
    res.json({ message: "token sent successfully", token });
  } catch (err) {
    return res.status(500).json({ message: "internal server error" });
  }
});

app.listen(3000, () => console.log("Server running on 3000"));
