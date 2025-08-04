// Script to test user registration directly
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// User schema (same as in the app)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    linkedinUrl: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    walletAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

async function testRegistration() {
  try {
    console.log("🔄 Connecting to MongoDB...")
    await mongoose.connect("mongodb://localhost:27017/jobportal")
    console.log("✅ Connected to MongoDB")

    const User = mongoose.model("User", userSchema)

    // Test data
    const testUser = {
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 12),
    }

    console.log("💾 Creating test user...")
    const user = await User.create(testUser)
    console.log("✅ User created successfully:", {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })

    // Verify user exists
    const foundUser = await User.findById(user._id)
    console.log("🔍 User verification:", !!foundUser)

    // Clean up test user
    await User.findByIdAndDelete(user._id)
    console.log("🧹 Test user cleaned up")
  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("🔌 Disconnected from MongoDB")
  }
}

testRegistration()
