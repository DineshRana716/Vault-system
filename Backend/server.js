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

const app = express();
app.use(express.json());
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
