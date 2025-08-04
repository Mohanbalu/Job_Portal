"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  LogOut,
  X,
  Mail,
  Linkedin,
  Wallet,
  Plus,
  Save,
  Loader2,
  Brain,
  Home,
  Menu,
  Briefcase,
} from "lucide-react"
import Link from "next/link"

interface UserProfile {
  _id: string
  name: string
  email: string
  bio: string
  linkedinUrl: string
  skills: string[]
  walletAddress: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    linkedinUrl: "",
    skills: [] as string[],
    walletAddress: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/auth/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    fetchProfile(parsedUser.id, token)
  }, [router])

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData({
          name: data.user.name || "",
          bio: data.user.bio || "",
          linkedinUrl: data.user.linkedinUrl || "",
          skills: data.user.skills || [],
          walletAddress: data.user.walletAddress || "",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile",
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
      setIsInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")

      if (!token || !userData) {
        router.push("/auth/login")
        return
      }

      const parsedUser = JSON.parse(userData)

      const response = await fetch(`/api/profile/${parsedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        toast({
          title: "✅ Profile Updated",
          description: "Your profile has been saved successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
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

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth/login")
        return
      }

      const formData = new FormData()
      formData.append("resumeFile", file)

      const response = await fetch("/api/upload-resume", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({
          ...prev,
          skills: [...new Set([...prev.skills, ...data.skills])],
        }))
        toast({
          title: "🧠 AI Magic Complete!",
          description: `Extracted ${data.skills.length} skills from your resume!`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to process resume",
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
      setIsUploading(false)
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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>Unable to load profile. Please try again.</p>
          <Button onClick={() => router.push("/auth/login")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Navigation Header */}
      <div className="border-b border-slate-800 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Profile Dashboard</h1>
                <p className="text-gray-400">Manage your professional information</p>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
                <Link href="/jobs" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Job Feed
                </Link>
                <Link
                  href="/suggestions"
                  className="text-gray-300 hover:text-purple-400 transition-colors flex items-center"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Suggestions
                </Link>
                <Link
                  href="/jobs/post"
                  className="text-gray-300 hover:text-purple-400 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              {/* Mobile Navigation Menu */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="text-gray-300 hover:text-purple-400"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pt-4 border-t border-slate-700">
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-purple-400 transition-colors flex items-center py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
                <Link
                  href="/jobs"
                  className="text-gray-300 hover:text-purple-400 transition-colors flex items-center py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Job Feed
                </Link>
                <Link
                  href="/jobs/post"
                  className="text-gray-300 hover:text-purple-400 transition-colors flex items-center py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-white">{user.name}</CardTitle>
                <CardDescription className="text-gray-400">{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.linkedinUrl && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Linkedin className="w-4 h-4 text-blue-400" />
                    <span className="text-sm truncate">LinkedIn Connected</span>
                  </div>
                )}
                {user.walletAddress && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <span className="text-sm truncate">Wallet Connected</span>
                  </div>
                )}
                <div className="pt-4">
                  <p className="text-sm text-gray-400 mb-2">Skills ({user.skills.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {user.skills.slice(0, 6).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-purple-900/50 text-purple-300 border-purple-700"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {user.skills.length > 6 && (
                      <Badge variant="secondary" className="text-xs bg-slate-700 text-gray-300">
                        +{user.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <X className="w-5 h-5 mr-2 text-purple-400" />
                  Edit Profile
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your professional information and showcase your skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300 font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-gray-300 font-medium">
                        LinkedIn URL
                      </Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-gray-300 font-medium">
                      Professional Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about your professional background, experience, and goals..."
                      className="min-h-[120px] bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="text-gray-300 font-medium">
                      Wallet Address
                    </Label>
                    <Input
                      id="wallet"
                      value={formData.walletAddress}
                      onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                      placeholder="Your crypto wallet address"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                    />
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300 font-medium flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-purple-400" />
                        Skills & Expertise
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                          id="resume-upload"
                        />
                        <Label htmlFor="resume-upload" className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            asChild
                            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white bg-transparent"
                          >
                            <span>
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Resume
                                </>
                              )}
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>

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
                          className="flex items-center gap-1 bg-purple-900/50 text-purple-300 border-purple-700 hover:bg-purple-800/50"
                        >
                          {skill}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Floating Quick Navigation */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        <Link href="/jobs">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full w-14 h-14 p-0"
            title="View Job Feed"
          >
            <Briefcase className="w-6 h-6" />
          </Button>
        </Link>
        <Link href="/jobs/post">
          <Button
            size="lg"
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-full w-14 h-14 p-0"
            title="Post New Job"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
