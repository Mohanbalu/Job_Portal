"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Users,
  Building,
  Star,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Send,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

interface JobDetails {
  _id: string
  title: string
  description: string
  skills: string[]
  budget: { min: number; max: number; currency: string }
  location: string
  tags: string[]
  jobType: string
  experienceLevel: string
  postedBy: { _id: string; name: string; email: string }
  createdAt: string
  deadline?: string
  applicants: any[]
  matchScore?: number
  matchDetails?: {
    commonSkills: string[]
    missingSkills: string[]
    explanation: string
  }
}

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/auth/login")
      return
    }

    setCurrentUser(JSON.parse(userData))
    fetchJobDetails()
  }, [params.id, router])

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/jobs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
        setHasApplied(data.hasApplied || false)
      } else {
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive",
        })
        router.push("/jobs")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
      router.push("/jobs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async () => {
    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    setIsApplying(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/jobs/${params.id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setHasApplied(true)
        toast({
          title: "🎉 Application Sent!",
          description: "Your application has been submitted successfully.",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Application Failed",
          description: data.error || "Failed to submit application",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const formatBudget = (budget: JobDetails["budget"]) => {
    const symbol = budget.currency === "USD" ? "$" : budget.currency === "EUR" ? "€" : "₹"
    return `${symbol}${budget.min.toLocaleString()} - ${symbol}${budget.max.toLocaleString()}`
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-900/20 border-green-700"
    if (score >= 60) return "text-yellow-400 bg-yellow-900/20 border-yellow-700"
    if (score >= 40) return "text-orange-400 bg-orange-900/20 border-orange-700"
    return "text-red-400 bg-red-900/20 border-red-700"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>Job not found</p>
          <Link href="/jobs">
            <Button className="mt-4">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnJob = currentUser?.id === job.postedBy._id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{job.title}</h1>
              <p className="text-gray-400 flex items-center">
                <Building className="w-4 h-4 mr-1" />
                {job.postedBy.name}
              </p>
            </div>
            {job.matchScore !== undefined && (
              <Badge className={`${getMatchScoreColor(job.matchScore)} font-semibold text-lg px-3 py-1`}>
                <Star className="w-4 h-4 mr-1" />
                {job.matchScore}% Match
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Required Skills */}
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-400" />
                  Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => {
                    const isMatched = job.matchDetails?.commonSkills.includes(skill)
                    return (
                      <Badge
                        key={index}
                        className={
                          isMatched
                            ? "bg-green-900/50 text-green-300 border-green-700"
                            : "bg-slate-700 text-gray-300 border-slate-600"
                        }
                      >
                        {isMatched && <CheckCircle className="w-3 h-3 mr-1" />}
                        {skill}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Match Analysis */}
            {job.matchDetails && (
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                    Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300">{job.matchDetails.explanation}</p>

                  {job.matchDetails.commonSkills.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Your Matching Skills ({job.matchDetails.commonSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.matchDetails.commonSkills.map((skill, index) => (
                          <Badge key={index} className="bg-green-900/50 text-green-300 border-green-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.matchDetails.missingSkills.length > 0 && (
                    <div>
                      <h4 className="text-orange-400 font-medium mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Skills to Learn ({job.matchDetails.missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.matchDetails.missingSkills.map((skill, index) => (
                          <Badge key={index} className="bg-orange-900/50 text-orange-300 border-orange-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {job.tags.length > 0 && (
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Apply for this Job</CardTitle>
                <CardDescription className="text-gray-400">
                  {hasApplied ? "You have already applied" : "Submit your application"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOwnJob ? (
                  <div className="text-center py-4">
                    <Badge className="bg-blue-900/50 text-blue-300 border-blue-700 mb-2">Your Job</Badge>
                    <p className="text-gray-400 text-sm">This is your job posting</p>
                  </div>
                ) : hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-medium">Application Submitted</p>
                    <p className="text-gray-400 text-sm">You'll hear back from the employer soon</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Job Info */}
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-300">
                  <DollarSign className="w-5 h-5 mr-3 text-green-400" />
                  <div>
                    <p className="font-medium">{formatBudget(job.budget)}</p>
                    <p className="text-sm text-gray-400">Budget Range</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                  <div>
                    <p className="font-medium">{job.location}</p>
                    <p className="text-sm text-gray-400">Location</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <Clock className="w-5 h-5 mr-3 text-orange-400" />
                  <div>
                    <p className="font-medium">{job.jobType}</p>
                    <p className="text-sm text-gray-400">Job Type</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <TrendingUp className="w-5 h-5 mr-3 text-purple-400" />
                  <div>
                    <p className="font-medium">{job.experienceLevel}</p>
                    <p className="text-sm text-gray-400">Experience Level</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-3 text-pink-400" />
                  <div>
                    <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400">Posted Date</p>
                  </div>
                </div>

                {job.deadline && (
                  <div className="flex items-center text-gray-300">
                    <AlertCircle className="w-5 h-5 mr-3 text-red-400" />
                    <div>
                      <p className="font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">Application Deadline</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-gray-300">
                  <Users className="w-5 h-5 mr-3 text-cyan-400" />
                  <div>
                    <p className="font-medium">{job.applicants.length} applicants</p>
                    <p className="text-sm text-gray-400">Total Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Info */}
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">About the Employer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{job.postedBy.name}</p>
                    <p className="text-gray-400 text-sm">{job.postedBy.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
