import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Job from "@/models/Job"
import { verifyToken } from "@/lib/auth"
import { calculateUserSimilarity, calculateJobMatch } from "@/lib/matching"

// GET /api/suggestions - Get personalized suggestions
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
    const type = url.searchParams.get("type") || "all" // all, jobs, connections

    // Get current user
    const currentUser = await User.findById(decoded.userId).select("skills bio name email")
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const suggestions: any = {}

    // Job Suggestions
    if (type === "all" || type === "jobs") {
      const jobs = await Job.find({
        status: "Active",
        postedBy: { $ne: decoded.userId }, // Exclude user's own jobs
      })
        .populate("postedBy", "name email")
        .limit(20)
        .lean()

      const jobSuggestions = jobs
        .map((job) => {
          const match = calculateJobMatch(currentUser.skills, job.skills)
          return {
            ...job,
            matchScore: match.score,
            matchDetails: {
              commonSkills: match.commonSkills,
              missingSkills: match.missingSkills,
              explanation: match.explanation,
            },
          }
        })
        .filter((job) => job.matchScore > 30) // Only suggest jobs with >30% match
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)

      suggestions.jobs = jobSuggestions
    }

    // Connection Suggestions
    if (type === "all" || type === "connections") {
      const users = await User.find({
        _id: { $ne: decoded.userId },
        skills: { $exists: true, $not: { $size: 0 } },
      })
        .select("name email skills bio createdAt")
        .limit(50)
        .lean()

      const connectionSuggestions = users
        .map((user) => {
          const similarity = calculateUserSimilarity(currentUser.skills, user.skills)
          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            skills: user.skills,
            bio: user.bio,
            memberSince: user.createdAt,
            similarityScore: similarity.score,
            commonSkills: similarity.commonSkills,
            uniqueSkills: similarity.uniqueSkills,
            reason:
              similarity.commonSkills.length > 0
                ? `${similarity.commonSkills.length} skills in common`
                : "Similar professional background",
          }
        })
        .filter((user) => user.similarityScore > 20) // Only suggest users with >20% similarity
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 8)

      suggestions.connections = connectionSuggestions
    }

    // Skill Suggestions (based on job market trends)
    if (type === "all" || type === "skills") {
      // Get most common skills from recent jobs
      const recentJobs = await Job.find({
        status: "Active",
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      })
        .select("skills")
        .lean()

      const skillFrequency: { [key: string]: number } = {}
      recentJobs.forEach((job) => {
        job.skills.forEach((skill) => {
          const normalizedSkill = skill.trim()
          if (!currentUser.skills.some((userSkill) => userSkill.toLowerCase() === normalizedSkill.toLowerCase())) {
            skillFrequency[normalizedSkill] = (skillFrequency[normalizedSkill] || 0) + 1
          }
        })
      })

      const skillSuggestions = Object.entries(skillFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([skill, frequency]) => ({
          skill,
          frequency,
          reason: `Mentioned in ${frequency} recent job${frequency > 1 ? "s" : ""}`,
        }))

      suggestions.skills = skillSuggestions
    }

    // Learning Suggestions (based on missing skills from high-match jobs)
    if (type === "all" || type === "learning") {
      const highMatchJobs = suggestions.jobs?.filter((job: any) => job.matchScore > 60) || []
      const learningSkills: { [key: string]: number } = {}

      highMatchJobs.forEach((job: any) => {
        job.matchDetails.missingSkills.forEach((skill: string) => {
          learningSkills[skill] = (learningSkills[skill] || 0) + 1
        })
      })

      const learningSuggestions = Object.entries(learningSkills)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([skill, count]) => ({
          skill,
          priority: count > 2 ? "High" : count > 1 ? "Medium" : "Low",
          reason: `Required by ${count} high-match job${count > 1 ? "s" : ""}`,
          jobCount: count,
        }))

      suggestions.learning = learningSuggestions
    }

    return NextResponse.json({
      success: true,
      suggestions,
      userProfile: {
        name: currentUser.name,
        skillCount: currentUser.skills.length,
        hasBio: !!currentUser.bio,
      },
    })
  } catch (error: any) {
    console.error("Suggestions error:", error)
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 })
  }
}
