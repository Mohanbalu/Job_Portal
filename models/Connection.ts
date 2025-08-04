import mongoose from "mongoose"

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      maxlength: [500, "Message cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Create compound index to prevent duplicate connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true })

// Create indexes for better performance
connectionSchema.index({ requester: 1, status: 1 })
connectionSchema.index({ recipient: 1, status: 1 })

const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema)

export default Connection
