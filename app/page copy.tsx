"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  FileText,
  FolderOpen,
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
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
  Shield,
  FileCode,
} from "lucide-react"
import { generateDocumentationComparison, getAvailableProviders } from "./actions"
import { PROVIDER_MODELS } from "@/lib/providers"

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
  const [projectPath, setProjectPath] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<DocumentationResult[]>([])
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [error, setError] = useState("")
  const [availableProviders, setAvailableProviders] = useState<string[]>([])

  useEffect(() => {
    getAvailableProviders().then(setAvailableProviders)
  }, [])

  const handleGenerate = async () => {
    if (!projectPath.trim()) {
      setError("Please enter a valid project path")
      return
    }

    setIsGenerating(true)
    setError("")
    setResults([])
    setProjectInfo(null)

    try {
      const result = await generateDocumentationComparison(
        projectPath,
        selectedProvider === "all" ? undefined : selectedProvider,
      )

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            AI Documentation Comparison Tool
          </h1>
          <p className="text-lg text-gray-600">
            Generate comprehensive documentation with data flow analysis and detailed technical sections
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <Zap className="h-4 w-4" />
            <span>Enhanced with 13-section professional documentation structure</span>
          </div>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Project Configuration
            </CardTitle>
            <CardDescription>Configure your project path and AI provider preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Project Path</label>
                <Input
                  placeholder="C:\Users\YourName\Documents\MyProject"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">AI Provider</label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🚀 All Providers ({availableProviders.length})</SelectItem>
                    {availableProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider.charAt(0).toUpperCase() + provider.slice(1)} (
                        {PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS]?.length || 0} models)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Professional Documentation...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate & Compare Documentation
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Project Info */}
        {projectInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  Data Flow Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Professional Documentation Results
              </CardTitle>
              <CardDescription>
                Comprehensive 13-section documentation with data flow analysis and technical details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="successful" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="successful" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Successful ({successfulResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Failed ({failedResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Best Results
                  </TabsTrigger>
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
                        <Textarea
                          value={result.documentation || ""}
                          readOnly
                          className="min-h-[400px] font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.documentation || "")}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadMarkdown(
                                result.documentation || "",
                                `${projectInfo?.name}-${result.providerUsed}-${result.modelUsed}.md`,
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
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
                    Generating professional 13-section documentation with data flow analysis
                  </p>
                  <p className="text-sm text-gray-500">
                    This may take 3-7 minutes for comprehensive documentation generation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
