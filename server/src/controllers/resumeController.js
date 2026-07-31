import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import Resume from "../models/Resume.js";
import cloudinary from "../config/cloudinary.js";
import { analyzeResume } from "../services/analysisService.js";

// @desc   Upload resume
// @route  POST /api/resume/upload
// @access Private

export const uploadResume = async (req, res) => {
  try {
    // 1. check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;

    // 2. extract text from pdf
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(pdfBuffer);
    const extractedText = pdfData.text;

    // 3. check if text was extracted
    // Previously this checked === "0" which was a bug
    // Correct check: is the text empty after trimming whitespace?
    if (!extractedText || extractedText.trim().length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message:
          "No text could be extracted from this PDF. Make sure it is not a scanned image.",
      });
    }

    // 4. upload file to cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
      folder: "resumes",
      resource_type: "raw",
    });

    // 5. delete temp file
    fs.unlinkSync(filePath);

    // 6. save resume data to database
    const resume = await Resume.create({
      userId: req.user._id,
      fileUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      originalName: req.file.originalname,
      extractedText: extractedText,
      analysisStatus: "pending",
    });

    // 7. send response
    res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume: {
        id: resume._id,
        originalName: resume.originalName,
        fileUrl: resume.fileUrl,
        analysisStatus: resume.analysisStatus,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    // cleanup temp file if it still exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc   Analyze a resume using AI
// @route  POST /api/resume/:id/analyze
// @access Private

export const analyzeResumeById = async (req, res) => {
  try {
    // 1. find the resume and confirm it belongs to this user
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // 2. check if already analyzed
    // no need to call Gemini again if we already have results
    if (resume.analysisStatus === "completed") {
      return res.status(200).json({
        success: true,
        message: "Resume already analyzed",
        resume,
      });
    }

    // 3. mark as processing so the client knows analysis has started
    resume.analysisStatus = "processing";
    await resume.save();

    // 4. call Gemini AI with the extracted text
    // analyzeResume is the function we wrote in analysisService.js
    const analysisResult = await analyzeResume(resume.extractedText);

    // 5. save the analysis results to the resume document
    resume.score = analysisResult.score;
    resume.skills = analysisResult.skills;
    resume.missingSkills = analysisResult.missingSkills;
    resume.strengths = analysisResult.strengths;
    resume.weakness = analysisResult.weakness;
    resume.suggestions = analysisResult.suggestions;
    resume.analysisStatus = "completed";
    await resume.save();

    // 6. return the full resume with analysis
    res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      resume,
    });
  } catch (error) {
    // if anything goes wrong, mark as failed
    // we use updateOne here because resume.save() itself may have failed
    await Resume.updateOne(
      { _id: req.params.id },
      { analysisStatus: "failed" },
    );

    res.status(500).json({
      success: false,
      message: "Analysis failed",
      error: error.message,
    });
  }
};

// @desc   Get all resumes for a user
// @route  GET /api/resume/all
// @access Private

export const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("-extractedText");

    res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc   Get a specific resume by ID
// @route  GET /api/resume/:id
// @access Private

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select("-extractedText");

    // we exclude extractedText because it is large raw text
    // the frontend only needs the structured analysis fields

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resume fetched successfully",
      resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc   Delete a specific resume by ID
// @route  DELETE /api/resume/:id
// @access Private

export const deleteResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // delete from cloudinary if we have the public_id
    if (resume.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(resume.cloudinaryPublicId, {
        resource_type: "raw",
      });
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
