import express from "express";
import {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResumeById,
} from "../controllers/resumeController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("resume"), uploadResume);
router.get("/all", getAllResumes);
router.get("/:id", getResumeById);
router.delete("/:id", deleteResumeById);

export default router;
