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
app.use(
  cors({
    origin: "http://localhost:5173", // EXACT frontend URL
    credentials: true,
  }),
);

app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const parent_id = req.body.parent_id || null;
    const file = req.file;
    const userId = req.user.user_id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 🔒 1️⃣ Validate parent folder (if not root)
    if (parent_id) {
      const folderCheck = await pool.query(
        `SELECT id FROM user_files
           WHERE id = $1
           AND user_id = $2
           AND type = 'FOLDER'`,
        [parent_id, userId],
      );

      if (folderCheck.rowCount === 0) {
        return res.status(400).json({
          message: "Invalid parent folder",
        });
      }
    }

    // 2️⃣ Hash the uploaded file
    const fileHash = await getHash(file.path);

    // 3️⃣ Check for duplicate file
    const existingFile = await pool.query(
      `SELECT * FROM stored_files WHERE hash = $1`,
      [fileHash],
    );

    let storedFileId;

    if (existingFile.rowCount > 0) {
      // Duplicate → reuse
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
      // New file → store physically
      const storedResult = await pool.query(
        `INSERT INTO stored_files
           (hash, path, size, mime_type, ref_count)
           VALUES ($1,$2,$3,$4,1)
           RETURNING id`,
        [fileHash, file.path, file.size, file.mimetype],
      );

      storedFileId = storedResult.rows[0].id;
    }

    // 4️⃣ Insert into user_files as FILE
    const userFile = await pool.query(
      `INSERT INTO user_files
         (user_id, stored_file_id, original_name, parent_id, type)
         VALUES ($1,$2,$3,$4,'FILE')
         RETURNING *`,
      [userId, storedFileId, file.originalname, parent_id],
    );

    res.status(201).json(userFile.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

app.get("/files", authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  const parent_id = req.query.parent_id; // optional: filter by folder

  let query = "select * from user_files where user_id = $1";
  const params = [userId];

  if (parent_id !== undefined) {
    if (parent_id === "" || parent_id === "null") {
      query += " and parent_id is null";
    } else {
      query += " and parent_id = $2";
      params.push(parent_id);
    }
  }

  query += " order by type desc, original_name asc"; // FOLDER before FILE, then by name
  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.get("/files/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // 1️⃣ Check user owns the file
    const result = await pool.query(
      `SELECT * FROM user_files
       WHERE id = $1
       AND user_id = $2`,
      [id, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const row = result.rows[0];

    // 2️⃣ Folder: return metadata only (for breadcrumb/navigation)
    if (row.type !== "FILE") {
      return res.json({
        id: row.id,
        original_name: row.original_name,
        parent_id: row.parent_id,
        type: row.type,
      });
    }

    if (!row.stored_file_id) {
      return res.status(404).json({ message: "File not found" });
    }

    // 3️⃣ Get physical file
    const storedResult = await pool.query(
      `SELECT * FROM stored_files WHERE id = $1`,
      [row.stored_file_id],
    );

    if (storedResult.rowCount === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const storedFile = storedResult.rows[0];

    const absolutePath = path.resolve(storedFile.path);

    // 4️⃣ Send file safely
    res.download(absolutePath, row.original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download failed" });
  }
});

// app.get("/files/:id/preview", authMiddleware, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query("SELECT * FROM files WHERE id = $1", [id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "File not found" });
//     }
//     const file = result.rows[0];

//     res.setHeader("Content-Type", file.mime_type);
//     res.setHeader("Content-Disposition", "inline");

//     res.sendFile(path.resolve(file.path));
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
app.delete("/files/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const result = await pool.query(
      "select * from user_files where id=$1 and user_id=$2",
      [id, userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "file not found" });
    }

    const row = result.rows[0];

    if (row.type === "FILE" && row.stored_file_id) {
      const storedId = await pool.query(
        "select * from stored_files where id=$1",
        [row.stored_file_id],
      );
      if (storedId.rows.length > 0) {
        const result_stored = await pool.query(
          `UPDATE stored_files
           SET ref_count = ref_count - 1
           WHERE id = $1
           RETURNING ref_count, path`,
          [storedId.rows[0].id],
        );
        const count = result_stored.rows[0].ref_count;
        if (count <= 0) {
          fs.unlinkSync(storedId.rows[0].path);
          await pool.query("delete from stored_files where id=$1", [
            storedId.rows[0].id,
          ]);
        }
      }
    }

    await pool.query("delete from user_files where id=$1 and user_id=$2", [
      id,
      userId,
    ]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.put("/files/:id/rename", authMiddleware, async (req, res) => {
  const userId = req.user.user_id;
  const { id } = req.params;
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).json({ message: "new name is required" });
  }
  const result = await pool.query(
    `update user_files set original_name=$1 where id=$2 and user_id=$3 returning *`,
    [newName, id, userId],
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "File not found" });
  }

  res.json({ message: "Renamed successfully" });
});
app.post("/folder", authMiddleware, async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const userId = req.user.user_id;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const parentId = parent_id || null;

    if (parentId) {
      const folderCheck = await pool.query(
        `SELECT id FROM user_files
         WHERE id = $1 AND user_id = $2 AND type = 'FOLDER'`,
        [parentId, userId],
      );
      if (folderCheck.rowCount === 0) {
        return res.status(400).json({ message: "Invalid parent folder" });
      }
    }

    const result = await pool.query(
      `INSERT INTO user_files 
       (id, user_id, original_name, type, parent_id)
       VALUES (gen_random_uuid(), $1, $2, 'FOLDER', $3)
       RETURNING *`,
      [userId, name.trim(), parentId],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating folder" });
  }
});

app.post("/signup", async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    await client.query("BEGIN");

    // Check if user exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await client.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword],
    );

    const userId = userResult.rows[0].id;

    // 🔥 Create default folders (root level)
    await client.query(
      `INSERT INTO user_files 
       (id, user_id, original_name, type, parent_id)
       VALUES 
       (gen_random_uuid(), $1, 'Documents', 'FOLDER', NULL),
       (gen_random_uuid(), $1, 'Images', 'FOLDER', NULL)`,
      [userId],
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "User created successfully",
      user_id: userId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    client.release();
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
