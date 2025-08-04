"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Plus,
  Filter,
  Briefcase,
  Star,
  ArrowRight,
  Calendar,
  Building,
} from "lucide-react"
import Link from "next/link"

interface Job {
  _id: string
  title: string
  description: string
  skills: string[]
  budget: {
    min: number
    max: number
    currency: string
  }
  location: string
  tags: string[]
  jobType: string
  experienceLevel: string
  postedBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  matchScore?: number
  applicants: any[]
}

interface JobFilters {
  skill: string
  location: string
  jobType: string
  experience: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<JobFilters>({
    skill: "All Skills",
    location: "All Locations",
    jobType: "All Types",
    experience: "All Levels",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
    fetchJobs()
  }, [currentPage, filters])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...(filters.skill !== "All Skills" && { skill: filters.skill }),
        ...(filters.location !== "All Locations" && { location: filters.location }),
        ...(filters.jobType !== "All Types" && { jobType: filters.jobType }),
        ...(filters.experience !== "All Levels" && { experience: filters.experience }),
      })

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/jobs?${params}`, { headers })
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch jobs",
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

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      skill: "All Skills",
      location: "All Locations",
      jobType: "All Types",
      experience: "All Levels",
    })
    setCurrentPage(1)
  }

  const formatBudget = (budget: Job["budget"]) => {
    const symbol =
      budget.currency === "USD" ? "$" : budget.currency === "EUR" ? "€" : budget.currency === "GBP" ? "£" : "₹"
    return `${symbol}${budget.min.toLocaleString()} - ${symbol}${budget.max.toLocaleString()}`
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-900/20 border-green-700"
    if (score >= 60) return "text-yellow-400 bg-yellow-900/20 border-yellow-700"
    if (score >= 40) return "text-orange-400 bg-orange-900/20 border-orange-700"
    return "text-red-400 bg-red-900/20 border-red-700"
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-white">Job Feed</h1>
              <p className="text-gray-400">
                {isLoggedIn ? "Discover opportunities tailored to your skills" : "Find your next opportunity"}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/profile">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                  <Users className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link href="/jobs/post">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs by title, description, or skills..."
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Select value={filters.skill} onValueChange={(value) => handleFilterChange("skill", value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Filter by skill" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="All Skills">All Skills</SelectItem>
                      <SelectItem value="React">React</SelectItem>
                      <SelectItem value="Node.js">Node.js</SelectItem>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="JavaScript">JavaScript</SelectItem>
                      <SelectItem value="TypeScript">TypeScript</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="All Locations">All Locations</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="San Francisco">San Francisco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={filters.jobType} onValueChange={(value) => handleFilterChange("jobType", value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Job type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="All Types">All Types</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={filters.experience} onValueChange={(value) => handleFilterChange("experience", value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="All Levels">All Levels</SelectItem>
                      <SelectItem value="Entry">Entry Level</SelectItem>
                      <SelectItem value="Mid">Mid Level</SelectItem>
                      <SelectItem value="Senior">Senior Level</SelectItem>
                      <SelectItem value="Expert">Expert Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.skill !== "All Skills" ||
                filters.location !== "All Locations" ||
                filters.jobType !== "All Types" ||
                filters.experience !== "All Levels") && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-800/80 border-slate-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-700 rounded"></div>
                      <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Jobs Found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ||
                Object.values(filters).some(
                  (f) => f !== "All Skills" && f !== "All Locations" && f !== "All Types" && f !== "All Levels",
                )
                  ? "Try adjusting your search criteria or filters"
                  : "Be the first to post a job!"}
              </p>
              <Link href="/jobs/post">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Post the First Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link href={`/jobs/${job._id}`} key={job._id}>
                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm hover:border-purple-500 transition-all duration-300 group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg group-hover:text-purple-300 transition-colors">
                          {job.title}
                        </CardTitle>
                        <CardDescription className="text-gray-400 flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {job.postedBy.name}
                        </CardDescription>
                      </div>
                      {isLoggedIn && job.matchScore !== undefined && (
                        <Badge className={`${getMatchScoreColor(job.matchScore)} font-semibold`}>
                          <Star className="w-3 h-3 mr-1" />
                          {job.matchScore}% Match
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm line-clamp-3">{job.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-purple-900/50 text-purple-300 border-purple-700"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-slate-700 text-gray-300">
                          +{job.skills.length - 3} more
                        </Badge>
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
                      <div className="flex items-center text-gray-400">
                        <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-gray-400 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {job.applicants.length} applicants
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(`/jobs/${job._id}`)
                        }}
                      >
                        View Details
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
