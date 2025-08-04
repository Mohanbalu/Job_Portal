import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Connection from "@/models/Connection"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// POST /api/connections - Send connection request
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { recipientId, message } = await request.json()

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    if (recipientId === decoded.userId) {
      return NextResponse.json({ error: "You cannot connect with yourself" }, { status: 400 })
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId)
    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: decoded.userId, recipient: recipientId },
        { requester: recipientId, recipient: decoded.userId },
      ],
    })

    if (existingConnection) {
      return NextResponse.json({ error: "Connection request already exists" }, { status: 400 })
    }

    // Create connection request
    const connection = await Connection.create({
      requester: decoded.userId,
      recipient: recipientId,
      message: message || "",
      status: "pending",
    })

    const populatedConnection = await Connection.findById(connection._id)
      .populate("requester", "name email")
      .populate("recipient", "name email")

    return NextResponse.json({
      success: true,
      message: "Connection request sent successfully",
      connection: populatedConnection,
    })
  } catch (error: any) {
    console.error("Connection request error:", error)

    if (error.code === 11000) {
      return NextResponse.json({ error: "Connection request already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to send connection request" }, { status: 500 })
  }
}

// GET /api/connections - Get user's connections
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "all" // all, pending, accepted, rejected
    const type = url.searchParams.get("type") || "all" // all, sent, received

    const filter: any = {}

    // Filter by status
    if (status !== "all") {
      filter.status = status
    }

    // Filter by type (sent or received)
    if (type === "sent") {
      filter.requester = decoded.userId
    } else if (type === "received") {
      filter.recipient = decoded.userId
    } else {
      // All connections (sent or received)
      filter.$or = [{ requester: decoded.userId }, { recipient: decoded.userId }]
    }

    const connections = await Connection.find(filter)
      .populate("requester", "name email skills bio")
      .populate("recipient", "name email skills bio")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      connections,
    })
  } catch (error: any) {
    console.error("Get connections error:", error)
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 })
  }
}
