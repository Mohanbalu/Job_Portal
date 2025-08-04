"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Database, Users, Settings } from "lucide-react"

interface TestResult {
  success: boolean
  database?: string
  userCount?: number
  collections?: string[]
  connectionState?: number
  message?: string
  error?: string
  details?: any
}

export default function DebugPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationTest, setRegistrationTest] = useState<any>(null)
  const [regLoading, setRegLoading] = useState(false)

  const testDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setTestResult(data)
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testRegistration = async () => {
    setRegLoading(true)
    try {
      const testData = {
        name: "Debug Test User",
        email: `test${Date.now()}@example.com`,
        password: "password123",
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      })

      const data = await response.json()
      setRegistrationTest({
        success: response.ok,
        status: response.status,
        data,
        testData: { ...testData, password: "[HIDDEN]" },
      })
    } catch (error: any) {
      setRegistrationTest({
        success: false,
        error: error.message,
      })
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Database Debug Panel</h1>
          <p className="text-gray-400">Test your MongoDB connection and registration system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Database Connection Test */}
          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-400" />
                Database Connection
              </CardTitle>
              <CardDescription className="text-gray-400">
                Test MongoDB connection and view database status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testDatabase} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Database Connection"
                )}
              </Button>

              {testResult && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={testResult.success ? "text-green-400" : "text-red-400"}>
                      {testResult.success ? "Connection Successful" : "Connection Failed"}
                    </span>
                  </div>

                  {testResult.success && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Database:</span>
                        <Badge variant="secondary">{testResult.database}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Users:</span>
                        <Badge variant="secondary">{testResult.userCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collections:</span>
                        <Badge variant="secondary">{testResult.collections?.length || 0}</Badge>
                      </div>
                      {testResult.collections && testResult.collections.length > 0 && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-xs mb-1">Collections:</p>
                          <div className="flex flex-wrap gap-1">
                            {testResult.collections.map((collection, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {collection}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!testResult.success && (
                    <div className="bg-red-900/20 border border-red-800 rounded p-3">
                      <p className="text-red-400 text-sm font-medium">Error:</p>
                      <p className="text-red-300 text-sm">{testResult.error}</p>
                      {testResult.details && (
                        <div className="mt-2 text-xs text-gray-400">
                          <p>MongoDB URI: {testResult.details.mongodbUri}</p>
                          <p>Error Code: {testResult.details.code}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Test */}
          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-400" />
                Registration Test
              </CardTitle>
              <CardDescription className="text-gray-400">Test user registration functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testRegistration}
                disabled={regLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Registration"
                )}
              </Button>

              {registrationTest && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {registrationTest.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={registrationTest.success ? "text-green-400" : "text-red-400"}>
                      {registrationTest.success ? "Registration Successful" : "Registration Failed"}
                    </span>
                  </div>

                  <div className="bg-slate-700/50 rounded p-3 text-sm">
                    <p className="text-gray-400 mb-2">Test Data:</p>
                    <pre className="text-gray-300 text-xs overflow-x-auto">
                      {JSON.stringify(registrationTest.testData, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-slate-700/50 rounded p-3 text-sm">
                    <p className="text-gray-400 mb-2">Response:</p>
                    <pre className="text-gray-300 text-xs overflow-x-auto">
                      {JSON.stringify(registrationTest.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Troubleshooting Guide */}
        <Card className="bg-slate-800/80 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-orange-400" />
              Troubleshooting Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">If Database Connection Fails:</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                <li>Ensure MongoDB is installed and running</li>
                <li>
                  Check if MongoDB service is active:{" "}
                  <code className="bg-slate-700 px-1 rounded">brew services list | grep mongodb</code>
                </li>
                <li>
                  Start MongoDB:{" "}
                  <code className="bg-slate-700 px-1 rounded">brew services start mongodb-community</code>
                </li>
                <li>Verify port 27017 is available</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">If Registration Fails:</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                <li>Check browser console for detailed error messages</li>
                <li>Verify all required fields are provided</li>
                <li>Ensure email format is valid</li>
                <li>Check if user already exists with the same email</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Environment Variables:</h4>
              <div className="bg-slate-700/50 rounded p-2">
                <p>MONGODB_URI: mongodb://localhost:27017/jobportal</p>
                <p>JWT_SECRET: [Set in .env.local]</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
