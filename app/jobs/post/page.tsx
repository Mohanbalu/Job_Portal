"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  X,
  Plus,
  Brain,
  Loader2,
  Sparkles,
  ArrowLeft,
  Shield,
} from "lucide-react"
import Link from "next/link"
import PayToPostJob from "@/components/PayToPostJob"

export default function PostJobPage() {
  const [hasPaid, setHasPaid] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: [] as string[],
    budget: {
      min: "",
      max: "",
      currency: "USD",
    },
    location: "",
    tags: [] as string[],
    jobType: "",
    experienceLevel: "",
    deadline: "",
  })

  const [newSkill, setNewSkill] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExtractingSkills, setIsExtractingSkills] = useState(false)
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }
    checkPaymentStatus()
  }, [router])

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setHasPaid(data.hasPaid)
        if (data.hasPaid) {
          toast({
            title: "✅ Payment Verified",
            description: "You have an active payment. You can post jobs!",
          })
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
    } finally {
      setIsCheckingPayment(false)
    }
  }

  const extractSkillsFromDescription = async () => {
    if (!formData.description.trim() || formData.description.length < 10) {
      toast({
        title: "Description too short",
        description: "Please write a more detailed job description to extract skills.",
        variant: "destructive",
      })
      return
    }

    setIsExtractingSkills(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/jobs/extract-skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: formData.description }),
      })

      const data = await response.json()

      if (response.ok) {
        setExtractedSkills(data.skills)
        const newSkills = [...new Set([...formData.skills, ...data.skills])]
        setFormData((prev) => ({ ...prev, skills: newSkills }))

        toast({
          title: "🧠 AI Magic Complete!",
          description: `Extracted ${data.skills.length} skills from your job description.`,
        })
      } else {
        toast({
          title: "Extraction Failed",
          description: data.error || "Failed to extract skills. Please add them manually.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtractingSkills(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth/login")
        return
      }

      // Validate form
      if (!formData.title || !formData.description || !formData.budget.min || !formData.budget.max) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      if (Number.parseFloat(formData.budget.min) >= Number.parseFloat(formData.budget.max)) {
        toast({
          title: "Invalid Budget",
          description: "Maximum budget must be greater than minimum budget.",
          variant: "destructive",
        })
        return
      }

      const jobData = {
        ...formData,
        budget: {
          min: Number.parseFloat(formData.budget.min),
          max: Number.parseFloat(formData.budget.max),
          currency: formData.budget.currency,
        },
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "🎉 Job Posted Successfully!",
          description: "Your job has been posted and is now live on the blockchain-secured platform.",
        })
        router.push("/jobs")
      } else {
        toast({
          title: "Failed to Post Job",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking payment status
  if (isCheckingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Checking payment status...</p>
        </div>
      </div>
    )
  }

  // Show payment component if user hasn't paid
  if (!hasPaid) {
    return <PayToPostJob onPaymentSuccess={() => setHasPaid(true)} />
  }

  // Show job posting form if payment is verified
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
              <h1 className="text-2xl font-bold text-white">Post a New Job</h1>
              <p className="text-gray-400">Find the perfect candidate for your project</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <Badge className="bg-green-900/50 text-green-300 border-green-700">Payment Verified</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
              Job Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Provide detailed information about your job posting. Our AI will help extract relevant skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300 font-medium">
                  Job Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Full Stack Developer"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                  required
                />
              </div>

              {/* Job Description with AI Skill Extraction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-gray-300 font-medium">
                    Job Description *
                  </Label>
                  <Button
                    type="button"
                    onClick={extractSkillsFromDescription}
                    disabled={isExtractingSkills || !formData.description.trim()}
                    variant="outline"
                    size="sm"
                    className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white bg-transparent"
                  >
                    {isExtractingSkills ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Extract Skills with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the job requirements, responsibilities, and what you're looking for in a candidate. Be detailed - our AI will extract relevant skills automatically!"
                  className="min-h-[150px] bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                  required
                />
                {extractedSkills.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-green-400">
                    <Sparkles className="w-4 h-4" />
                    <span>AI extracted {extractedSkills.length} skills and added them below!</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <Label className="text-gray-300 font-medium">Required Skills</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., React, Python, Design)"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`flex items-center gap-1 ${
                        extractedSkills.includes(skill)
                          ? "bg-green-900/50 text-green-300 border-green-700"
                          : "bg-purple-900/50 text-purple-300 border-purple-700"
                      } hover:bg-opacity-70`}
                    >
                      {extractedSkills.includes(skill) && <Sparkles className="w-3 h-3" />}
                      {skill}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-4">
                <Label className="text-gray-300 font-medium flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                  Budget Range *
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="minBudget" className="text-sm text-gray-400">
                      Minimum
                    </Label>
                    <Input
                      id="minBudget"
                      type="number"
                      value={formData.budget.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budget: { ...formData.budget, min: e.target.value },
                        })
                      }
                      placeholder="1000"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBudget" className="text-sm text-gray-400">
                      Maximum
                    </Label>
                    <Input
                      id="maxBudget"
                      type="number"
                      value={formData.budget.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budget: { ...formData.budget, max: e.target.value },
                        })
                      }
                      placeholder="5000"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-sm text-gray-400">
                      Currency
                    </Label>
                    <Select
                      value={formData.budget.currency}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          budget: { ...formData.budget, currency: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location and Job Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-300 font-medium flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Remote, New York, London"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium">Job Type *</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Experience Level and Deadline */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium">Experience Level *</Label>
                  <Select
                    value={formData.experienceLevel}
                    onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Entry">Entry Level</SelectItem>
                      <SelectItem value="Mid">Mid Level</SelectItem>
                      <SelectItem value="Senior">Senior Level</SelectItem>
                      <SelectItem value="Expert">Expert Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-gray-300 font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-orange-400" />
                    Application Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <Label className="text-gray-300 font-medium">Tags (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag (e.g., urgent, startup, remote-friendly)"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex items-center gap-1 bg-slate-700/50 text-slate-300 border-slate-600"
                    >
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting Job...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Post Job
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
