import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    console.log("🧪 Testing database connection...")

    // Test connection
    const mongoose = await connectDB()
    console.log("✅ Database connected")

    // Test user model
    const userCount = await User.countDocuments()
    console.log("👥 Current user count:", userCount)

    // Get database info
    const dbName = mongoose.connection.db?.databaseName
    const collections = await mongoose.connection.db?.listCollections().toArray()

    return NextResponse.json({
      success: true,
      database: dbName,
      userCount,
      collections: collections?.map((c) => c.name) || [],
      connectionState: mongoose.connection.readyState,
      message: "Database connection successful",
    })
  } catch (error: any) {
    console.error("❌ Database test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: {
          name: error.name,
          code: error.code,
          mongodbUri: process.env.MONGODB_URI || "Not set",
        },
      },
      { status: 500 },
    )
  }
}
