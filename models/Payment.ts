import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: String,
      required: true,
    },
    network: {
      type: String,
      required: true,
      enum: ["ethereum", "polygon", "goerli", "mumbai", "sepolia"],
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: String,
    },
    gasPrice: {
      type: String,
    },
    fromAddress: {
      type: String,
      required: true,
    },
    toAddress: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["job_posting", "premium_feature", "subscription"],
      default: "job_posting",
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
paymentSchema.index({ userId: 1 })
paymentSchema.index({ txHash: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ createdAt: -1 })

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema)

export default Payment
