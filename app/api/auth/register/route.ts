import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  console.log("🚀 Registration API called at:", new Date().toISOString())

  try {
    // Test basic connectivity first
    console.log("🔄 Testing MongoDB connection...")
    const mongoose = await connectDB()
    console.log("✅ MongoDB connection established")
    console.log("📊 Connection state:", mongoose.connection.readyState)
    console.log("📊 Database name:", mongoose.connection.name)

    // Connect to database first
    console.log("🔄 Connecting to database...")
    await connectDB()
    console.log("✅ Database connected successfully")

    const body = await request.json()
    const { name, email, password } = body

    console.log("📝 Registration data received:", {
      name,
      email,
      passwordLength: password?.length,
    })

    // Validate input
    if (!name || !email || !password) {
      console.log("❌ Validation failed: Missing required fields")
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ Validation failed: Password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    console.log("🔍 Checking if user exists...")
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      console.log("❌ User already exists:", email)
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }
    console.log("✅ Email is available")

    // Hash password and create user
    console.log("🔐 Hashing password...")
    const hashedPassword = await hashPassword(password)
    console.log("✅ Password hashed successfully")

    console.log("💾 Creating user in database...")
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    }
    console.log("📊 User data to save:", { ...userData, password: "[HIDDEN]" })

    const user = await User.create(userData)
    console.log("✅ User created successfully with ID:", user._id)

    // Verify user was saved
    const savedUser = await User.findById(user._id)
    console.log("🔍 Verification - User found in DB:", !!savedUser)

    // Generate JWT token
    console.log("🎫 Generating JWT token...")
    const token = generateToken(user._id.toString())
    console.log("✅ JWT token generated")

    const responseData = {
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    }

    console.log("✅ Registration successful, sending response")
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("❌ Registration error:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message)
      console.log("❌ Validation errors:", messages)
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 })
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      console.log("❌ Duplicate key error")
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Handle connection errors
    if (error.name === "MongooseServerSelectionError") {
      console.log("❌ MongoDB server connection error")
      return NextResponse.json(
        { error: "Database connection failed. Please ensure MongoDB is running." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
