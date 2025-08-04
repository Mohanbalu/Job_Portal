"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  Users,
  Briefcase,
  BookOpen,
  TrendingUp,
  Star,
  ArrowRight,
  Loader2,
  Lightbulb,
  Target,
  Clock,
  MapPin,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface JobSuggestion {
  _id: string
  title: string
  description: string
  skills: string[]
  budget: { min: number; max: number; currency: string }
  location: string
  jobType: string
  experienceLevel: string
  postedBy: { name: string; email: string }
  createdAt: string
  matchScore: number
  matchDetails: {
    commonSkills: string[]
    missingSkills: string[]
    explanation: string
  }
}

interface ConnectionSuggestion {
  _id: string
  name: string
  email: string
  skills: string[]
  bio: string
  memberSince: string
  similarityScore: number
  commonSkills: string[]
  uniqueSkills: string[]
  reason: string
}

interface SkillSuggestion {
  skill: string
  frequency: number
  reason: string
}

interface LearningSuggestion {
  skill: string
  priority: "High" | "Medium" | "Low"
  reason: string
  jobCount: number
}

interface Suggestions {
  jobs: JobSuggestion[]
  connections: ConnectionSuggestion[]
  skills: SkillSuggestion[]
  learning: LearningSuggestion[]
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"jobs" | "connections" | "skills" | "learning">("jobs")
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }
    fetchSuggestions()
  }, [router])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/suggestions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setSuggestions(data.suggestions)
        setUserProfile(data.userProfile)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch suggestions",
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
      setIsLoading(false)
    }
  }

  const formatBudget = (budget: JobSuggestion["budget"]) => {
    const symbol = budget.currency === "USD" ? "$" : budget.currency === "EUR" ? "€" : "₹"
    return `${symbol}${budget.min.toLocaleString()} - ${symbol}${budget.max.toLocaleString()}`
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-900/20 border-green-700"
    if (score >= 60) return "text-yellow-400 bg-yellow-900/20 border-yellow-700"
    if (score >= 40) return "text-orange-400 bg-orange-900/20 border-orange-700"
    return "text-red-400 bg-red-900/20 border-red-700"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-400 bg-red-900/20 border-red-700"
      case "Medium":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700"
      case "Low":
        return "text-green-400 bg-green-900/20 border-green-700"
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700"
    }
  }

  const handleConnect = async (userId: string) => {
    setConnectingUsers((prev) => new Set(prev).add(userId))

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: userId,
          message: "I'd like to connect with you based on our similar skills and interests!",
        }),
      })

      if (response.ok) {
        toast({
          title: "🤝 Connection Request Sent!",
          description: "Your connection request has been sent successfully.",
        })

        // Remove the user from suggestions or mark as connected
        setSuggestions((prev) =>
          prev
            ? {
                ...prev,
                connections: prev.connections?.filter((conn) => conn._id !== userId) || [],
              }
            : null,
        )
      } else {
        const data = await response.json()
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to send connection request",
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
      setConnectingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Analyzing your profile and generating suggestions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Brain className="w-8 h-8 mr-3 text-purple-400" />
                AI Suggestions
              </h1>
              <p className="text-gray-400">Personalized recommendations based on your skills and interests</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchSuggestions}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/profile">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                  <Users className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Profile Summary */}
        {userProfile && (
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Welcome back, {userProfile.name}!</h3>
                    <p className="text-gray-400">
                      {userProfile.skillCount} skills •{" "}
                      {userProfile.hasBio ? "Profile complete" : "Add bio for better matches"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">AI-Powered</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: "jobs", label: "Job Matches", icon: Briefcase, count: suggestions?.jobs?.length || 0 },
            { key: "connections", label: "People", icon: Users, count: suggestions?.connections?.length || 0 },
            { key: "skills", label: "Trending Skills", icon: TrendingUp, count: suggestions?.skills?.length || 0 },
            { key: "learning", label: "Learn Next", icon: BookOpen, count: suggestions?.learning?.length || 0 },
          ].map(({ key, label, icon: Icon, count }) => (
            <Button
              key={key}
              onClick={() => setActiveTab(key as any)}
              variant={activeTab === key ? "default" : "outline"}
              className={
                activeTab === key
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
              {count > 0 && <Badge className="ml-2 bg-slate-700 text-white text-xs">{count}</Badge>}
            </Button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Job Suggestions */}
          {activeTab === "jobs" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Briefcase className="w-6 h-6 mr-2 text-purple-400" />
                  Recommended Jobs
                </h2>
                <Link href="/jobs">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    View All Jobs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {suggestions?.jobs?.length === 0 ? (
                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Job Matches Found</h3>
                    <p className="text-gray-400 mb-6">
                      Add more skills to your profile to get better job recommendations
                    </p>
                    <Link href="/profile">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Update Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestions?.jobs?.map((job) => (
                    <Link href={`/jobs/${job._id}`} key={job._id}>
                      <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm hover:border-purple-500 transition-all duration-300 group cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-white text-lg group-hover:text-purple-300 transition-colors">
                                {job.title}
                              </CardTitle>
                              <CardDescription className="text-gray-400 flex items-center mt-1">
                                <Users className="w-3 h-3 mr-1" />
                                {job.postedBy.name}
                              </CardDescription>
                            </div>
                            <Badge className={`${getMatchScoreColor(job.matchScore)} font-semibold`}>
                              <Star className="w-3 h-3 mr-1" />
                              {job.matchScore}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-300 text-sm line-clamp-2">{job.description}</p>

                          {/* Match Details */}
                          <div className="space-y-2">
                            <p className="text-xs text-gray-400">{job.matchDetails.explanation}</p>

                            {job.matchDetails.commonSkills.length > 0 && (
                              <div>
                                <p className="text-xs text-green-400 mb-1">✓ Your matching skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {job.matchDetails.commonSkills.slice(0, 3).map((skill, index) => (
                                    <Badge
                                      key={index}
                                      className="text-xs bg-green-900/50 text-green-300 border-green-700"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.matchDetails.commonSkills.length > 3 && (
                                    <Badge className="text-xs bg-slate-700 text-gray-300">
                                      +{job.matchDetails.commonSkills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {job.matchDetails.missingSkills.length > 0 &&
                              job.matchDetails.missingSkills.length <= 3 && (
                                <div>
                                  <p className="text-xs text-orange-400 mb-1">⚠ Skills to learn:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {job.matchDetails.missingSkills.slice(0, 3).map((skill, index) => (
                                      <Badge
                                        key={index}
                                        className="text-xs bg-orange-900/50 text-orange-300 border-orange-700"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-400">
                              <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                              {formatBudget(job.budget)}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                              {job.location}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <Clock className="w-4 h-4 mr-2 text-orange-400" />
                              {job.jobType} • {job.experienceLevel}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault()
                              router.push(`/jobs/${job._id}`)
                            }}
                          >
                            View Job Details
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Connection Suggestions */}
          {activeTab === "connections" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-400" />
                  People You Should Know
                </h2>
              </div>

              {suggestions?.connections?.length === 0 ? (
                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Connection Suggestions</h3>
                    <p className="text-gray-400">Add more skills to find professionals with similar backgrounds</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestions?.connections?.map((connection) => (
                    <Card
                      key={connection._id}
                      className="bg-slate-800/80 border-slate-700 backdrop-blur-sm hover:border-blue-500 transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-white text-lg">{connection.name}</CardTitle>
                            <CardDescription className="text-gray-400">{connection.reason}</CardDescription>
                          </div>
                          <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">
                            {connection.similarityScore}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {connection.bio && <p className="text-gray-300 text-sm line-clamp-2">{connection.bio}</p>}

                        {connection.commonSkills.length > 0 && (
                          <div>
                            <p className="text-xs text-blue-400 mb-2">Common skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {connection.commonSkills.slice(0, 4).map((skill, index) => (
                                <Badge key={index} className="text-xs bg-blue-900/50 text-blue-300 border-blue-700">
                                  {skill}
                                </Badge>
                              ))}
                              {connection.commonSkills.length > 4 && (
                                <Badge className="text-xs bg-slate-700 text-gray-300">
                                  +{connection.commonSkills.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {connection.uniqueSkills.length > 0 && (
                          <div>
                            <p className="text-xs text-purple-400 mb-2">They also know:</p>
                            <div className="flex flex-wrap gap-1">
                              {connection.uniqueSkills.slice(0, 3).map((skill, index) => (
                                <Badge
                                  key={index}
                                  className="text-xs bg-purple-900/50 text-purple-300 border-purple-700"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-transparent"
                          onClick={() => handleConnect(connection._id)}
                          disabled={connectingUsers.has(connection._id)}
                        >
                          {connectingUsers.has(connection._id) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skill Suggestions */}
          {activeTab === "skills" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
                  Trending Skills
                </h2>
              </div>

              {suggestions?.skills?.length === 0 ? (
                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Skill Trends Available</h3>
                    <p className="text-gray-400">Check back later for trending skills in the job market</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions?.skills?.map((skill, index) => (
                    <Card
                      key={index}
                      className="bg-slate-800/80 border-slate-700 backdrop-blur-sm hover:border-green-500 transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{skill.skill}</h3>
                          <Badge className="bg-green-900/50 text-green-300 border-green-700">{skill.frequency}</Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{skill.reason}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3 border-green-600 text-green-400 hover:bg-green-600 hover:text-white bg-transparent"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          Add to Profile
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Learning Suggestions */}
          {activeTab === "learning" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-orange-400" />
                  Skills to Learn Next
                </h2>
              </div>

              {suggestions?.learning?.length === 0 ? (
                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Learning Suggestions</h3>
                    <p className="text-gray-400">Apply to more jobs to get personalized learning recommendations</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions?.learning?.map((learning, index) => (
                    <Card
                      key={index}
                      className="bg-slate-800/80 border-slate-700 backdrop-blur-sm hover:border-orange-500 transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">{learning.skill}</h3>
                          <Badge className={getPriorityColor(learning.priority)}>{learning.priority}</Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{learning.reason}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {learning.jobCount} job{learning.jobCount > 1 ? "s" : ""}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white bg-transparent"
                          >
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Learn
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
