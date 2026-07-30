import fs from "fs";
// import pdfParse from "pdf-parse";
// import pdf from "pdf-parse/lib/pdf-parse.js";
import pdf from "pdf-parse";
import Resume from "../models/Resume.js";
import cloudinary from "../config/cloudinary.js";

// use pdf2json or pdfjs-dist instead of pdf-parse for better text extraction

// @desc   Upload resume
// @route  POST /api/resume/upload
// @access Private

export const uploadResume = async (req, res) => {
  try {
    //1. check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
        success: false,
      });
    }

    const filePath = req.file.path;
    //2. extract text from pdf
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(pdfBuffer);
    const extractedText = pdfData.text;
    console.log("Extracted text:", extractedText);

    //3. check if text was extracted
    if (!extractedText || extractedText.trim() === "0") {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "No text extracted from the PDF",
      });
    }

    //4. upload file to cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
      folder: "resumes",
      resource_type: "raw",
    });

    //5. Delete temp data
    fs.unlinkSync(filePath);

    //6. save resume data to database
    const resume = await Resume.create({
      userId: req.user._id,
      fileUrl: cloudinaryResult.secure_url,
      originalName: req.file.originalname,
      extractedText: extractedText,
      analysisStatus: "pending",
    });

    //7. send response
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
    //cleanup temp file if exists
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

// @desc   Get all resumes for a user
//  @route  GET /api/resume/all
// @access Private

export const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("-extractedText");

    res.status(200).json({
      success: true,
      resumes: resumes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc  Get a specific resume by ID
// @route  GET /api/resume/:id
// @access Private

export const getResumeById = async (req, res) => {
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

    res.status(200).json({
      message: "Resume fetched successfully",
      success: true,
      resume: {
        id: resume._id,
        originalName: resume.originalName,
        fileUrl: resume.fileUrl,
        analysisStatus: resume.analysisStatus,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc  Delete a specific resume by ID
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
