import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Job from "@/models/Job"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Calculate match score between user skills and job skills
async function calculateMatchScore(userSkills: string[], jobSkills: string[]): Promise<number> {
  if (!userSkills.length || !jobSkills.length) return 0

  try {
    const HF_API_KEY = process.env.HF_API_KEY

    if (!HF_API_KEY) {
      // Fallback to simple keyword matching
      return calculateSimpleMatchScore(userSkills, jobSkills)
    }

    // Use Hugging Face embeddings for semantic similarity
    const userSkillsText = userSkills.join(" ")
    const jobSkillsText = jobSkills.join(" ")

    const response = await fetch("https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          source_sentence: userSkillsText,
          sentences: [jobSkillsText],
        },
      }),
    })

    if (!response.ok) {
      return calculateSimpleMatchScore(userSkills, jobSkills)
    }

    const data = await response.json()
    const similarity = data[0] || 0

    // Convert to percentage and ensure it's reasonable
    const matchScore = Math.min(Math.max(similarity * 100, 0), 100)
    return Math.round(matchScore)
  } catch (error) {
    console.error("Match score calculation error:", error)
    return calculateSimpleMatchScore(userSkills, jobSkills)
  }
}

function calculateSimpleMatchScore(userSkills: string[], jobSkills: string[]): number {
  const userSkillsLower = userSkills.map((skill) => skill.toLowerCase())
  const jobSkillsLower = jobSkills.map((skill) => skill.toLowerCase())

  let matches = 0
  let partialMatches = 0

  for (const jobSkill of jobSkillsLower) {
    if (userSkillsLower.includes(jobSkill)) {
      matches++
    } else {
      // Check for partial matches
      for (const userSkill of userSkillsLower) {
        if (userSkill.includes(jobSkill) || jobSkill.includes(userSkill)) {
          partialMatches++
          break
        }
      }
    }
  }

  const totalPossibleMatches = jobSkillsLower.length
  const score = ((matches + partialMatches * 0.5) / totalPossibleMatches) * 100

  return Math.round(Math.min(score, 100))
}

// GET /api/jobs - Get all jobs with advanced match scores
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const skillFilter = url.searchParams.get("skill")
    const locationFilter = url.searchParams.get("location")
    const jobTypeFilter = url.searchParams.get("jobType")
    const experienceFilter = url.searchParams.get("experience")
    const sortBy = url.searchParams.get("sortBy") || "match" // match, date, budget

    // Build filter query
    const filter: any = { status: "Active" }

    if (skillFilter) {
      filter.skills = { $in: [new RegExp(skillFilter, "i")] }
    }
    if (locationFilter) {
      filter.location = new RegExp(locationFilter, "i")
    }
    if (jobTypeFilter) {
      filter.jobType = jobTypeFilter
    }
    if (experienceFilter) {
      filter.experienceLevel = experienceFilter
    }

    const skip = (page - 1) * limit

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalJobs = await Job.countDocuments(filter)

    // Get user info for match score calculation
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    let jobsWithScores = jobs

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        const user = await User.findById(decoded.userId).select("skills bio")
        if (user && user.skills.length > 0) {
          // Import matching functions
          const { calculateJobMatch, calculateTextSimilarity } = await import("@/lib/matching")

          // Calculate advanced match scores for each job
          jobsWithScores = jobs.map((job) => {
            const skillMatch = calculateJobMatch(user.skills, job.skills)

            // Optional: Add bio similarity if user has bio
            let bioSimilarity = 0
            if (user.bio && user.bio.length > 20) {
              bioSimilarity = calculateTextSimilarity(user.bio, job.description)
            }

            // Combined score (70% skills, 30% bio similarity)
            const combinedScore = Math.round(skillMatch.score * 0.7 + bioSimilarity * 0.3)

            return {
              ...job,
              matchScore: combinedScore,
              skillMatch: skillMatch,
              bioSimilarity: bioSimilarity,
              matchDetails: {
                commonSkills: skillMatch.commonSkills,
                missingSkills: skillMatch.missingSkills,
                explanation: skillMatch.explanation,
              },
            }
          })

          // Sort by match score, date, or budget
          if (sortBy === "match") {
            jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          } else if (sortBy === "budget") {
            jobsWithScores.sort((a, b) => (b.budget?.max || 0) - (a.budget?.max || 0))
          }
          // Default sort by date is already applied above
        }
      }
    }

    return NextResponse.json({
      success: true,
      jobs: jobsWithScores,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
        hasNext: page < Math.ceil(totalJobs / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error: any) {
    console.error("Get jobs error:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// POST /api/jobs - Create a new job
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

    const jobData = await request.json()
    const { title, description, skills, budget, location, tags, jobType, experienceLevel, deadline } = jobData

    // Validate required fields
    if (!title || !description || !budget || !location || !jobType || !experienceLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create job
    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      skills: skills || [],
      budget: {
        min: budget.min,
        max: budget.max,
        currency: budget.currency || "USD",
      },
      location: location.trim(),
      tags: tags || [],
      jobType,
      experienceLevel,
      postedBy: decoded.userId,
      deadline: deadline ? new Date(deadline) : undefined,
    })

    const populatedJob = await Job.findById(job._id).populate("postedBy", "name email")

    return NextResponse.json({
      success: true,
      message: "Job posted successfully",
      job: populatedJob,
    })
  } catch (error: any) {
    console.error("Create job error:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}
