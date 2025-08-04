import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jobportal"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

// Extend global to include mongooseConnection
declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

let cached = global.mongooseConnection

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null }
}

async function connectDB() {
  // Simple connection check first
  if (cached.conn && cached.conn.connection.readyState === 1) {
    console.log("✅ Using existing MongoDB connection")
    return cached.conn
  }

  if (!cached.promise) {
    console.log("🔄 Creating new MongoDB connection to:", MONGODB_URI)

    // Simplified connection options
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully!")
        console.log("📊 Database:", mongoose.connection.db?.databaseName || "Unknown")
        console.log("📊 Host:", mongoose.connection.host)
        console.log("📊 Port:", mongoose.connection.port)
        return mongoose
      })
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error.message)
        cached.promise = null
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (e: any) {
    cached.promise = null
    console.error("❌ Failed to establish MongoDB connection:", e.message)
    throw new Error(`MongoDB connection failed: ${e.message}`)
  }
}

export default connectDB
