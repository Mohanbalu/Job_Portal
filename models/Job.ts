import mongoose from "mongoose"

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [2000, "Job description cannot exceed 2000 characters"],
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    budget: {
      min: {
        type: Number,
        required: [true, "Minimum budget is required"],
        min: [0, "Budget cannot be negative"],
      },
      max: {
        type: Number,
        required: [true, "Maximum budget is required"],
        min: [0, "Budget cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR"],
      },
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    jobType: {
      type: String,
      required: [true, "Job type is required"],
      enum: ["Full-time", "Part-time", "Contract", "Freelance", "Internship"],
    },
    experienceLevel: {
      type: String,
      required: [true, "Experience level is required"],
      enum: ["Entry", "Mid", "Senior", "Expert"],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["Applied", "Reviewed", "Shortlisted", "Rejected", "Hired"],
          default: "Applied",
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Paused", "Closed", "Draft"],
      default: "Active",
    },
    deadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for better performance
jobSchema.index({ postedBy: 1 })
jobSchema.index({ skills: 1 })
jobSchema.index({ location: 1 })
jobSchema.index({ jobType: 1 })
jobSchema.index({ status: 1 })
jobSchema.index({ createdAt: -1 })

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema)

export default Job
