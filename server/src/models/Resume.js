import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl:{
        type: String,
        required: true
    },
    originalName:{
        type: String,
        required: true
    },
    extractedText:{
        type: String,
        required: true
    },
    analysisStatus:{
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    score:{
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    skills:{
        type: [String],
        default: []
    },
    missingSkills:{
        type: [String],
        default: []
    },
    strengths:{
        type: [String],
        default: []
    
    },
    weakness:{
        type: [String],
        default: []
    },
    suggestions:{
        type: [String],
        default: []
    }
},
{
    timestamps: true
})
const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;