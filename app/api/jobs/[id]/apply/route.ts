import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Job from "@/models/Job"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// POST /api/jobs/[id]/apply - Apply for a job
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Find the job
    const job = await Job.findById(params.id)
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if user is trying to apply to their own job
    if (job.postedBy.toString() === decoded.userId) {
      return NextResponse.json({ error: "You cannot apply to your own job" }, { status: 400 })
    }

    // Check if user has already applied
    const hasApplied = job.applicants.some((applicant: any) => applicant.user.toString() === decoded.userId)
    if (hasApplied) {
      return NextResponse.json({ error: "You have already applied to this job" }, { status: 400 })
    }

    // Add user to applicants
    job.applicants.push({
      user: decoded.userId,
      appliedAt: new Date(),
      status: "Applied",
    })

    await job.save()

    // Get user info for response
    const user = await User.findById(decoded.userId).select("name email")

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicant: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
        },
        appliedAt: new Date(),
        status: "Applied",
      },
    })
  } catch (error: any) {
    console.error("Job application error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
