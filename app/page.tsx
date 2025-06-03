"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  Hash,
  Trophy,
  AlertCircle,
  Copy,
  Download,
  Folder,
  Code,
  Package,
  Layers,
  FileCode,
  Star,
  Upload,
  GitBranch,
  HardDrive,
  XCircle,
  Zap,
  Shield,
} from "lucide-react"
import { getAvailableProviders, generateDocumentationComparison } from "./actions"
import { generateDocumentationFromFiles } from "./actions-upload"
import { PROVIDER_MODELS, PROVIDER_INFO } from "@/lib/providers"

interface ProjectInfo {
  name: string
  fileCount: number
  languages: string[]
  structure: {
    directories: string[]
    files: Array<{ path: string; type: string; size: number }>
    depth: number
    keyFiles: Array<{ path: string; purpose: string; type: string }>
  }
  packageInfo?: {
    name?: string
    version?: string
    description?: string
    framework?: string
    scripts?: Record<string, string>
    dependencies?: Record<string, string>
  }
  apiEndpoints?: Array<{
    method: string
    path: string
    description: string
    file: string
  }>
  testFiles?: string[]
  configFiles?: string[]
  uiFiles?: string[]
  securityFiles?: string[]
  dataFlowInfo?: {
    presentationLayer: string[]
    applicationLayer: string[]
    dataLayer: string[]
  }
}

interface DocumentationResult {
  success: boolean
  documentation?: string
  modelUsed?: string
  providerUsed?: string
  error?: string
  generationTime?: number
  tokenCount?: number
}

export default function ProjectDocumentationGenerator() {
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<DocumentationResult[]>([])
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [error, setError] = useState("")
  const [availableProviders, setAvailableProviders] = useState<string[]>([])
  const [isLocalEnvironment, setIsLocalEnvironment] = useState(false)

  // Input states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [gitUrl, setGitUrl] = useState("")
  const [localPath, setLocalPath] = useState("")
  const [inputMethod, setInputMethod] = useState<"folder" | "zip" | "git" | "local">("folder")

  useEffect(() => {
    getAvailableProviders().then(setAvailableProviders)

    // Check if running locally
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.includes("localhost"))

    setIsLocalEnvironment(isLocal)

    // If not local and current method is local, switch to folder
    if (!isLocal && inputMethod === "local") {
      setInputMethod("folder")
    }
  }, [inputMethod])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(files)
    setError("")
  }

  const handleZipUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file extension and common ZIP MIME types
      const fileName = file.name.toLowerCase()
      const validZipTypes = [
        "application/zip",
        "application/x-zip-compressed",
        "application/x-zip",
        "application/octet-stream",
      ]

      const isZipFile = fileName.endsWith(".zip") || validZipTypes.includes(file.type)

      if (isZipFile) {
        setZipFile(file)
        setError("")
      } else {
        setError("Please select a valid ZIP file (.zip extension)")
      }
    }
  }

  const handleGenerate = async () => {
    // Validation based on input method
    if (inputMethod === "folder" && uploadedFiles.length === 0) {
      setError("Please upload project files first")
      return
    }
    if (inputMethod === "zip" && !zipFile) {
      setError("Please upload a ZIP file first")
      return
    }
    if (inputMethod === "git" && !gitUrl.trim()) {
      setError("Please enter a Git repository URL")
      return
    }
    if (inputMethod === "local" && !localPath.trim()) {
      setError("Please enter a local project path")
      return
    }

    setIsGenerating(true)
    setError("")
    setResults([])
    setProjectInfo(null)

    try {
      let result

      if (inputMethod === "local") {
        // Use the original local path action
        result = await generateDocumentationComparison(
          localPath,
          selectedProvider === "all" ? undefined : selectedProvider,
        )
      } else {
        // Use the file upload action
        const formData = new FormData()

        if (inputMethod === "folder") {
          uploadedFiles.forEach((file) => {
            formData.append("files", file)
          })
        } else if (inputMethod === "zip") {
          formData.append("zipFile", zipFile!)
        } else if (inputMethod === "git") {
          formData.append("gitUrl", gitUrl)
        }

        result = await generateDocumentationFromFiles(
          formData,
          selectedProvider === "all" ? undefined : selectedProvider,
        )
      }

      if (result.success) {
        setResults(result.results || [])
        setProjectInfo(result.projectInfo || null)
      } else {
        setError(result.error || "Failed to generate documentation")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const successfulResults = results.filter((r) => r.success)
  const failedResults = results.filter((r) => !r.success)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadMarkdown = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Determine number of tabs based on environment
  const tabsGridCols = isLocalEnvironment ? "grid-cols-4" : "grid-cols-3"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src="/yash-logo-new.svg" alt="Logo" className="h-16 w-20" />
          <h1 className="text-2xl font-bold text-center flex-1">AI Documentation Generator</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="bg-gray-50 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-lg">Standard README format</span>
            {isLocalEnvironment && (
              <Badge variant="outline" className="ml-4 text-blue-600 border-blue-600">
                Local Development Mode
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Configuration</h2>
            <p className="text-gray-600 text-lg">
              {isLocalEnvironment
                ? "Upload your project, provide a Git repository URL, or enter a local path"
                : "Upload your project or provide a Git repository URL"}
            </p>
          </div>

          <div className="space-y-8">
            {/* Input Method Selection */}
            <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as any)} className="w-full">
              <TabsList className={`grid w-full ${tabsGridCols}`}>
                <TabsTrigger value="folder" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Upload Folder
                </TabsTrigger>
                <TabsTrigger value="zip" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload ZIP
                </TabsTrigger>
                <TabsTrigger value="git" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Git Repository
                </TabsTrigger>
                {isLocalEnvironment && (
                  <TabsTrigger value="local" className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Local Path
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="folder" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    webkitdirectory="true"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="folder-upload"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.scss,.vue,.svelte,.md,.json,.yaml,.yml,.xml,.sql"
                  />
                  <label htmlFor="folder-upload" className="cursor-pointer">
                    <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Upload Project Directory</p>
                    <p className="text-gray-600">Click to select your project folder</p>
                    <p className="text-sm text-gray-500 mt-2">Supports: JS, TS, Python, Java, C++, and more</p>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">{uploadedFiles.length} files uploaded</p>
                    <p className="text-green-600 text-sm">Ready to generate documentation</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="zip" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
                    onChange={handleZipUpload}
                    className="hidden"
                    id="zip-upload"
                  />
                  <label htmlFor="zip-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Upload ZIP File</p>
                    <p className="text-gray-600">Click to select your project ZIP file</p>
                    <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
                  </label>
                </div>
                {zipFile && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">ZIP file uploaded: {zipFile.name}</p>
                    <p className="text-green-600 text-sm">Size: {(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="git" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Repository URL</label>
                    <Input
                      placeholder="https://github.com/username/repository"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Supported Git Platforms</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Currently supports public GitHub repositories. Private repositories require authentication.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {isLocalEnvironment && (
                <TabsContent value="local" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Local Project Path</label>
                      <Input
                        placeholder="C:\Users\YourName\Documents\MyProject"
                        value={localPath}
                        onChange={(e) => setLocalPath(e.target.value)}
                        className="h-12 text-base font-mono"
                      />
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Local Development Only</span>
                      </div>
                      <p className="text-orange-700 text-sm">
                        This option is only available when running the application locally. Enter the full path to your
                        project directory on your local machine.
                      </p>
                      <div className="mt-2 text-xs text-orange-600">
                        <p>
                          <strong>Examples:</strong>
                        </p>
                        <p>
                          • Windows: <code>C:\Users\YourName\Documents\MyProject</code>
                        </p>
                        <p>
                          • macOS/Linux: <code>/Users/YourName/Documents/MyProject</code>
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* AI Provider Selection - Hidden on production, visible locally */}
            { (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">AI Provider</label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="h-14 text-base px-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <SelectValue placeholder="Select provider" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        All Providers ({availableProviders.length})
                      </div>
                    </SelectItem>
                    {availableProviders.map((provider) => {
                      const info = PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO]
                      const modelCount = PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS]?.length || 0
                      return (
                        <SelectItem key={provider} value={provider}>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            {provider === "groq" ? "⭐ " : ""}
                            {info?.name || provider.charAt(0).toUpperCase() + provider.slice(1)}
                            {info?.integrated ? " (Vercel)" : ""} ({modelCount} models)
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-16 text-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Generating Documentation...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-3" />
                  Generate & Compare Documentation
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Info Cards */}
        {projectInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Project Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Project Name</p>
                      <p className="font-semibold">{projectInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Framework</p>
                      <p className="font-semibold">{projectInfo.packageInfo?.framework || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Files Analyzed</p>
                      <p className="font-semibold">{projectInfo.fileCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Project Depth</p>
                      <p className="font-semibold">{projectInfo.structure.depth} levels</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Languages Detected</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {projectInfo.languages.map((lang) => (
                        <Badge key={lang} variant="secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Results Generated</p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-600">{successfulResults.length} Success</span>
                      {failedResults.length > 0 && (
                        <span className="font-semibold text-red-600">{failedResults.length} Failed</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Project Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Files</p>
                      <p className="font-semibold">{projectInfo.structure.files.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Directories</p>
                      <p className="font-semibold">{projectInfo.structure.directories.length}</p>
                    </div>
                    {projectInfo.packageInfo?.version && (
                      <div>
                        <p className="text-sm text-gray-600">Version</p>
                        <p className="font-semibold">{projectInfo.packageInfo.version}</p>
                      </div>
                    )}
                    {projectInfo.packageInfo?.dependencies && (
                      <div>
                        <p className="text-sm text-gray-600">Dependencies</p>
                        <p className="font-semibold">{Object.keys(projectInfo.packageInfo.dependencies).length}</p>
                      </div>
                    )}
                  </div>
                  {projectInfo.packageInfo?.description && (
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-sm">{projectInfo.packageInfo.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Key Directories</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {projectInfo.structure.directories.slice(0, 6).map((dir) => (
                        <Badge key={dir} variant="outline" className="text-xs">
                          <Folder className="h-3 w-3 mr-1" />
                          {dir.split("/").pop() || dir}
                        </Badge>
                      ))}
                      {projectInfo.structure.directories.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{projectInfo.structure.directories.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {isLocalEnvironment ? "Data Flow Analysis" : "Key Files"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLocalEnvironment && projectInfo.dataFlowInfo ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-blue-50">
                          Presentation
                        </Badge>
                        <p className="text-sm text-gray-600">
                          {projectInfo.dataFlowInfo?.presentationLayer.length || 0} files
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {projectInfo.dataFlowInfo?.presentationLayer.slice(0, 2).join(", ")}
                        {(projectInfo.dataFlowInfo?.presentationLayer.length || 0) > 2 && "..."}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-green-50">
                          Application
                        </Badge>
                        <p className="text-sm text-gray-600">
                          {projectInfo.dataFlowInfo?.applicationLayer.length || 0} files
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {projectInfo.dataFlowInfo?.applicationLayer.slice(0, 2).join(", ")}
                        {(projectInfo.dataFlowInfo?.applicationLayer.length || 0) > 2 && "..."}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-purple-50">
                          Data
                        </Badge>
                        <p className="text-sm text-gray-600">{projectInfo.dataFlowInfo?.dataLayer.length || 0} files</p>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {projectInfo.dataFlowInfo?.dataLayer.slice(0, 2).join(", ")}
                        {(projectInfo.dataFlowInfo?.dataLayer.length || 0) > 2 && "..."}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <p className="text-xs text-gray-600">Security Files</p>
                        </div>
                        <p className="text-xs font-medium">{projectInfo.securityFiles?.length || 0}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <FileCode className="h-3 w-3" />
                          <p className="text-xs text-gray-600">API Endpoints</p>
                        </div>
                        <p className="text-xs font-medium">{projectInfo.apiEndpoints?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectInfo.structure.keyFiles.slice(0, 8).map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <FileCode className="h-3 w-3 text-gray-500" />
                        <span className="truncate font-mono text-xs">{file.path}</span>
                      </div>
                    ))}
                    {projectInfo.structure.keyFiles.length > 8 && (
                      <p className="text-xs text-gray-500">+{projectInfo.structure.keyFiles.length - 8} more files</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Documentation Results
              </CardTitle>
              <CardDescription>
                Standard README format with project overview, architecture, and setup instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="successful" className="w-full">
                <TabsList className={`grid w-full ${isLocalEnvironment ? "grid-cols-3" : "grid-cols-2"}`}>
                  <TabsTrigger value="successful" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Successful ({successfulResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Failed ({failedResults.length})
                  </TabsTrigger>
                  {isLocalEnvironment && (
                    <TabsTrigger value="comparison" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Best Results
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="successful" className="space-y-4">
                  {successfulResults.map((result, index) => (
                    <Card key={index} className="border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">
                              {result.providerUsed}/{result.modelUsed}
                            </CardTitle>
                            {result.providerUsed === "groq" && <Star className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {result.generationTime}ms
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-4 w-4" />
                              {result.tokenCount} tokens
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isLocalEnvironment && (
                          <div className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Documentation Preview</span>
                            </div>
                            <div className="text-xs text-gray-600 mb-3">
                              Standard README format with 10 sections including project overview, architecture, and
                              setup instructions
                            </div>
                          </div>
                        )}
                        <Textarea
                          value={result.documentation || ""}
                          readOnly
                          className="min-h-[500px] font-mono text-sm bg-white border-2 border-gray-200"
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                            lineHeight: "1.5",
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.documentation || "")}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-4 w-4" />
                            Copy Documentation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadMarkdown(
                                result.documentation || "",
                                `${projectInfo?.name}-Documentation-${result.providerUsed}-${result.modelUsed}.md`,
                              )
                            }
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download MD
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="failed" className="space-y-4">
                  {failedResults.map((result, index) => (
                    <Card key={index} className="border-red-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <CardTitle className="text-lg">
                              {result.providerUsed}/{result.modelUsed}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {result.generationTime}ms
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-red-700 text-sm">{result.error}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {isLocalEnvironment && (
                  <TabsContent value="comparison" className="space-y-4">
                    {successfulResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-yellow-200 bg-yellow-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Zap className="h-5 w-5 text-yellow-600" />
                              Fastest Generation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const fastest = successfulResults.reduce((prev, current) =>
                                (prev.generationTime || 0) < (current.generationTime || 0) ? prev : current,
                              )
                              return (
                                <div>
                                  <p className="font-semibold">
                                    {fastest.providerUsed}/{fastest.modelUsed}
                                  </p>
                                  <p className="text-sm text-gray-600">{fastest.generationTime}ms</p>
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Hash className="h-5 w-5 text-blue-600" />
                              Most Comprehensive
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const mostDetailed = successfulResults.reduce((prev, current) =>
                                (prev.tokenCount || 0) > (current.tokenCount || 0) ? prev : current,
                              )
                              return (
                                <div>
                                  <p className="font-semibold">
                                    {mostDetailed.providerUsed}/{mostDetailed.modelUsed}
                                  </p>
                                  <p className="text-sm text-gray-600">{mostDetailed.tokenCount} tokens</p>
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>

                        <Card className="border-green-200 bg-green-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-green-600" />
                              Best Balance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const balanced = successfulResults.reduce((prev, current) => {
                                const prevScore = (prev.tokenCount || 0) / (prev.generationTime || 1)
                                const currentScore = (current.tokenCount || 0) / (current.generationTime || 1)
                                return prevScore > currentScore ? prev : current
                              })
                              return (
                                <div>
                                  <p className="font-semibold">
                                    {balanced.providerUsed}/{balanced.modelUsed}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {balanced.tokenCount} tokens in {balanced.generationTime}ms
                                  </p>
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No successful results to compare</p>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Analyzing Project Structure...</p>
                  <p className="text-gray-600">
                    Generating documentation with {availableProviders.length} AI providers
                  </p>
                  <p className="text-sm text-gray-500">This may take 5-10 minutes for documentation generation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
