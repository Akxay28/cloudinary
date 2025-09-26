const express = require("express");
const router = express.Router();
const { imageUpload, updateProfile, deleteProfile } = require("./controller"); // this must be a function
const { storage } = require("./storage");
const multer = require("multer");
const upload = multer({ storage });
require("./db");

router.post("/imageUploading", upload.single("image"), imageUpload);
router.put("/profile/:id", upload.single("image"), updateProfile);
router.delete("/profile/:id", deleteProfile);

module.exports = router;
