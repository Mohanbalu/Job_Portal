import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"
import { verifyToken } from "@/lib/auth"

// POST /api/payments/verify - Verify if user has made recent payment for job posting
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

    // Check for recent successful payment for job posting (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recentPayment = await Payment.findOne({
      userId: decoded.userId,
      purpose: "job_posting",
      status: "success",
      createdAt: { $gte: twentyFourHoursAgo },
    }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      hasPaid: !!recentPayment,
      payment: recentPayment,
      message: recentPayment
        ? "Recent payment found - you can post jobs"
        : "No recent payment found - payment required to post jobs",
    })
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
