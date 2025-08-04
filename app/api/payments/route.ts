import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"
import { verifyToken } from "@/lib/auth"

// POST /api/payments - Save payment transaction
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

    const { txHash, amount, network, blockNumber, gasUsed, gasPrice, fromAddress, toAddress, purpose } =
      await request.json()

    // Validate required fields
    if (!txHash || !amount || !network || !fromAddress || !toAddress) {
      return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ txHash })
    if (existingPayment) {
      return NextResponse.json({ error: "Payment already recorded" }, { status: 400 })
    }

    // Create payment record
    const payment = await Payment.create({
      userId: decoded.userId,
      txHash,
      amount,
      network,
      blockNumber,
      gasUsed,
      gasPrice,
      fromAddress,
      toAddress,
      purpose: purpose || "job_posting",
      status: "success",
    })

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      payment,
    })
  } catch (error: any) {
    console.error("Payment recording error:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}

// GET /api/payments - Get user's payment history
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
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const payments = await Payment.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalPayments = await Payment.countDocuments({ userId: decoded.userId })

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPayments / limit),
        totalPayments,
        hasNext: page < Math.ceil(totalPayments / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error: any) {
    console.error("Get payments error:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
