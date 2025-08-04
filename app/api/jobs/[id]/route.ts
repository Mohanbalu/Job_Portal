import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Job from "@/models/Job"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"
import { calculateJobMatch } from "@/lib/matching"

// GET /api/jobs/[id] - Get job details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const job = await Job.findById(params.id).populate("postedBy", "name email").lean()

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if user is authenticated for match score
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    let jobWithMatch = job
    let hasApplied = false

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        // Check if user has applied
        hasApplied = job.applicants.some((applicant: any) => applicant.user.toString() === decoded.userId)

        // Get user skills for match calculation
        const user = await User.findById(decoded.userId).select("skills bio")
        if (user && user.skills.length > 0) {
          const match = calculateJobMatch(user.skills, job.skills)
          jobWithMatch = {
            ...job,
            matchScore: match.score,
            matchDetails: {
              commonSkills: match.commonSkills,
              missingSkills: match.missingSkills,
              explanation: match.explanation,
            },
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      job: jobWithMatch,
      hasApplied,
    })
  } catch (error: any) {
    console.error("Get job details error:", error)
    return NextResponse.json({ error: "Failed to fetch job details" }, { status: 500 })
  }
}
