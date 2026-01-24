const express = require("express");
const upload = require("../middleware/multer");
const fileController = require("../controllers/file.controller");

const router = express.Router();

router.post("/upload", upload.single("uploadFile"), fileController.uploadFile);

module.exports = router;
