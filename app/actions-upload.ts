"use server"

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { PROVIDER_MODELS } from "@/lib/providers"
import JSZip from "jszip"

// AI Providers - Using only OpenAI-compatible providers to avoid dependency issues
const providers = {
  // Core Providers (Vercel Integrated)
  groq: createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  }),
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  xai: createOpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY,
  }),

  // Additional Free Providers
  openrouter: createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  }),
  deepinfra: createOpenAI({
    baseURL: "https://api.deepinfra.com/v1/openai",
    apiKey: process.env.DEEPINFRA_API_KEY,
  }),
  together: createOpenAI({
    baseURL: "https://api.together.xyz/v1",
    apiKey: process.env.TOGETHER_API_KEY,
  }),
  fireworks: createOpenAI({
    baseURL: "https://api.fireworks.ai/inference/v1",
    apiKey: process.env.FIREWORKS_API_KEY,
  }),
  cerebras: createOpenAI({
    baseURL: "https://api.cerebras.ai/v1",
    apiKey: process.env.CEREBRAS_API_KEY,
  }),
}

// Environment detection
const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production"

// Timeout configuration - 50 seconds max for Vercel free plan
const PRODUCTION_TIMEOUT = 50000 // 50 seconds for production
const API_CALL_TIMEOUT = 30000 // 30 seconds for API calls

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
    dependencies?: Record<string, string>
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

interface GenerateDocumentationResult {
  success: boolean
  results?: DocumentationResult[]
  projectInfo?: ProjectInfo
  error?: string
}

// Enhanced timeout wrapper with 50-second limit
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs),
  )
  return Promise.race([promise, timeout])
}

// Retry wrapper for API calls
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1, delay = 500): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      console.log(`Attempt ${attempt} failed, retrying...`)
      lastError = error instanceof Error ? error : new Error("Unknown error")

      // Check if it's a 404 error (model not found) - don't retry these
      if (error instanceof Error && error.message.includes("Not Found")) {
        console.log("Model not found error - skipping retries")
        throw lastError
      }

      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retry
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError!
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Your existing helper functions remain the same...
const SUPPORTED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".cs",
  ".php",
  ".rb",
  ".go",
  ".rs",
  ".swift",
  ".kt",
  ".scala",
  ".html",
  ".css",
  ".scss",
  ".vue",
  ".svelte",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".sql",
]

const getLanguageFromExtension = (ext: string): string => {
  const languageMap: Record<string, string> = {
    ".js": "JavaScript",
    ".jsx": "React/JSX",
    ".ts": "TypeScript",
    ".tsx": "React/TypeScript",
    ".py": "Python",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".go": "Go",
    ".rs": "Rust",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".vue": "Vue.js",
    ".svelte": "Svelte",
    ".md": "Markdown",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".xml": "XML",
    ".sql": "SQL",
  }
  return languageMap[ext] || ext.slice(1).toUpperCase()
}

function detectFramework(packageInfo?: any, files?: Array<{ name: string; content: string }>): string {
  if (packageInfo?.dependencies) {
    const deps = Object.keys(packageInfo.dependencies)
    if (deps.includes("next")) return "Next.js"
    if (deps.includes("react")) return "React"
    if (deps.includes("vue")) return "Vue.js"
    if (deps.includes("svelte")) return "Svelte"
    if (deps.includes("@angular/core")) return "Angular"
    if (deps.includes("express")) return "Express.js"
  }

  if (files) {
    const fileNames = files.map((f) => f.name.toLowerCase())
    if (fileNames.some((n) => n.includes("next.config"))) return "Next.js"
    if (fileNames.some((n) => n.includes("package.json"))) return "Node.js"
    if (fileNames.some((n) => n.includes("requirements.txt"))) return "Python"
    if (fileNames.some((n) => n.includes("pom.xml"))) return "Maven/Java"
    if (fileNames.some((n) => n.includes("cargo.toml"))) return "Rust/Cargo"
    if (fileNames.some((n) => n.includes("go.mod"))) return "Go"
  }

  return "Custom"
}

// Enhanced file processing with timeout
async function processUploadedFiles(formData: FormData): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  return withTimeout(
    processUploadedFilesInternal(formData),
    15000, // 15 seconds for file processing
    "File processing",
  )
}

async function processUploadedFilesInternal(formData: FormData): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  const files: Array<{ path: string; content: string; language: string }> = []
  const languages = new Set<string>()
  const directories = new Set<string>()
  let packageInfo: any = undefined
  let projectName = "Uploaded Project"

  const uploadedFiles = formData.getAll("files") as File[]

  for (const file of uploadedFiles) {
    const fileName = file.name
    const filePath = file.webkitRelativePath || fileName
    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase()

    if (filePath.includes("/")) {
      projectName = filePath.split("/")[0]
      const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
      if (dirPath) directories.add(dirPath)
    }

    if (SUPPORTED_EXTENSIONS.includes(ext)) {
      try {
        const content = await file.text()
        const language = getLanguageFromExtension(ext)
        languages.add(language)

        if (fileName === "package.json") {
          try {
            packageInfo = JSON.parse(content)
            if (packageInfo.name) projectName = packageInfo.name
          } catch (e) {
            // Invalid JSON, skip
          }
        }

        if (content.length < 20000) {
          files.push({
            path: filePath,
            content: content.slice(0, 8000),
            language,
          })
        }
      } catch (error) {
        console.warn(`Could not read file: ${fileName}`)
      }
    }
  }

  const framework = detectFramework(
    packageInfo,
    files.map((f) => ({ name: f.path, content: f.content })),
  )
  if (packageInfo) {
    packageInfo.framework = framework
  }

  const projectInfo: ProjectInfo = {
    name: projectName,
    fileCount: files.length,
    languages: Array.from(languages),
    structure: {
      directories: Array.from(directories).sort(),
      files: files.map((f) => ({
        path: f.path,
        type: f.path.substring(f.path.lastIndexOf(".")),
        size: f.content.length,
      })),
      depth: Math.max(...Array.from(directories).map((d) => d.split("/").length), 1),
      keyFiles: files
        .filter(
          (f) =>
            f.path.includes("index.") ||
            f.path.includes("main.") ||
            f.path.includes("app.") ||
            f.path.includes("page.") ||
            f.path.includes("component"),
        )
        .slice(0, 10)
        .map((f) => ({
          path: f.path,
          purpose: f.path.includes("page") ? "Application page" : "Key component",
          type: f.language,
        })),
    },
    packageInfo,
  }

  return { files, projectInfo }
}

// Enhanced documentation generation with timeout restrictions
async function generateSingleDocumentation(
  files: Array<{ path: string; content: string; language: string }>,
  projectInfo: ProjectInfo,
  provider: any,
  providerName: string,
  modelName: string,
  maxTokens: number,
): Promise<DocumentationResult> {
  const startTime = Date.now()

  try {
    const projectContent = files
      .slice(0, 8) // Reduced from 12 to 8 for faster processing
      .map(
        (file) =>
          `## File: ${file.path} (${file.language})\n\`\`\`${file.language.toLowerCase()}\n${file.content.slice(0, 6000)}\n\`\`\``, // Reduced from 8000 to 6000
      )
      .join("\n\n")

    const prompt = `
You are a technical documentation expert. Analyze the following source code and generate comprehensive project documentation.

Project Name: ${projectInfo.name}
Languages: ${projectInfo.languages.join(", ")}
Files Analyzed: ${projectInfo.fileCount}
Framework: ${projectInfo.packageInfo?.framework || "Unknown"}

Source Code:
${projectContent}

Please generate a comprehensive README.md style documentation that includes:

1. **Project Overview** - Brief description of what the project does
2. **Architecture** - High-level architecture and design patterns used
3. **Technologies Used** - List of frameworks, libraries, and technologies
4. **Project Structure** - Directory structure and file organization
5. **Key Features** - Main functionality and features
6. **Setup Instructions** - How to install and run the project
7. **API Documentation** - If applicable, document main APIs/endpoints
8. **Usage Examples** - Code examples showing how to use the project
9. **Contributing Guidelines** - How others can contribute
10. **Dependencies** - List of main dependencies and their purposes

Make the documentation clear, professional, and useful for developers who want to understand or contribute to the project.
Format the output in Markdown.
`

    console.log(`Starting API call to ${providerName}/${modelName}...`)

    // Enhanced API call with retry logic and timeout
    const generateWithRetry = () =>
      withRetry(
        () =>
          withTimeout(
            generateText({
              model: provider(modelName),
              prompt,
              maxTokens: Math.min(3000, Math.floor(maxTokens * 0.6)), // Reduced token limit
            }),
            API_CALL_TIMEOUT,
            `API call to ${providerName}/${modelName}`,
          ),
        1, // Reduced retries from 2 to 1
        300, // Reduced delay from 500ms to 300ms
      )

    const { text } = await generateWithRetry()

    console.log(`Completed API call to ${providerName}/${modelName} successfully`)

    const generationTime = Date.now() - startTime
    const tokenCount = estimateTokens(text)

    return {
      success: true,
      documentation: text,
      modelUsed: modelName,
      providerUsed: providerName,
      generationTime,
      tokenCount,
    }
  } catch (error) {
    console.error(`Error with ${providerName}/${modelName}:`, error)
    const generationTime = Date.now() - startTime
    return {
      success: false,
      modelUsed: modelName,
      providerUsed: providerName,
      error: error instanceof Error ? error.message : "Unknown error",
      generationTime,
    }
  }
}

// Main function with timeout restrictions
export async function generateDocumentationFromFiles(
  formData: FormData,
  selectedProvider?: string,
): Promise<GenerateDocumentationResult> {
  console.log("Starting documentation generation process...")
  const globalStartTime = Date.now()

  try {
    // Apply global timeout for the entire operation
    return await withTimeout(
      generateDocumentationInternal(formData, selectedProvider, globalStartTime),
      PRODUCTION_TIMEOUT,
      "Documentation generation",
    )
  } catch (error) {
    console.error("Global error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Operation failed",
    }
  }
}

async function generateDocumentationInternal(
  formData: FormData,
  selectedProvider?: string,
  globalStartTime?: number,
): Promise<GenerateDocumentationResult> {
  const startTime = globalStartTime || Date.now()
  let files: Array<{ path: string; content: string; language: string }>
  let projectInfo: ProjectInfo

  // Process files with timeout
  const gitUrl = formData.get("gitUrl") as string
  if (gitUrl) {
    try {
      console.log(`🔍 Processing GitHub repository: ${gitUrl}`)
      const result = await withTimeout(
        processGitRepository(gitUrl),
        20000, // 20 seconds for GitHub processing
        "GitHub repository processing",
      )
      files = result.files
      projectInfo = result.projectInfo
      console.log(`✅ Successfully processed GitHub repository with ${files.length} files`)
    } catch (error) {
      console.error("GitHub processing error:", error)
      return {
        success: false,
        error: `Failed to process GitHub repository: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  } else {
    const zipFile = formData.get("zipFile") as File
    if (zipFile && zipFile.size > 0) {
      console.log("Processing ZIP file:", zipFile.name, zipFile.type, zipFile.size)

      const fileName = zipFile.name.toLowerCase()
      const validZipTypes = [
        "application/zip",
        "application/x-zip-compressed",
        "application/x-zip",
        "application/octet-stream",
      ]

      const isZipFile = fileName.endsWith(".zip") || validZipTypes.includes(zipFile.type)

      if (isZipFile) {
        try {
          const result = await withTimeout(
            processZipFile(zipFile),
            15000, // 15 seconds for ZIP processing
            "ZIP file processing",
          )
          files = result.files
          projectInfo = result.projectInfo
        } catch (error) {
          console.error("ZIP processing error:", error)
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process ZIP file",
          }
        }
      } else {
        return {
          success: false,
          error: "Invalid file format. Please upload a valid ZIP file.",
        }
      }
    } else {
      const result = await processUploadedFiles(formData)
      files = result.files
      projectInfo = result.projectInfo
    }
  }

  if (!files || files.length === 0) {
    return {
      success: false,
      error: "No supported source files found in the uploaded content",
    }
  }

  console.log(`📁 Found ${files.length} files to analyze`)

  // LIMITED PROVIDERS for free plan - focus on fastest/most reliable
  const priorityProviders = ["groq", "openai", "deepinfra", "together", "fireworks"]

  const availableProviders = priorityProviders.filter((provider) => {
    const envKey = `${provider.toUpperCase()}_API_KEY`
    return !!process.env[envKey]
  })

  const providersToTest =
    selectedProvider && availableProviders.includes(selectedProvider)
      ? [selectedProvider]
      : availableProviders.slice(0, 3) // Limit to 3 providers

  if (providersToTest.length === 0) {
    return {
      success: false,
      error: "No API keys configured for available providers",
    }
  }

  console.log(`🔑 Testing providers: ${providersToTest.join(", ")}`)
  console.log(`🔑 Environment: ${isProduction ? "Production" : "Development"}`)

  // LIMITED MODELS - test only fastest models to stay within 60-second limit
  const results: DocumentationResult[] = []
  let currentResultCount = 0
  const maxResults = 5 // Limit total results

  // Process providers with limited models
  for (const providerName of providersToTest) {
    if (currentResultCount >= maxResults) break

    try {
      const provider = providers[providerName as keyof typeof providers]
      if (!provider) {
        console.log(`⚠️ Provider ${providerName} not configured properly, skipping`)
        continue
      }

      const models = PROVIDER_MODELS[providerName as keyof typeof PROVIDER_MODELS] || []

      // Test only the first 2 fastest models per provider
      const fastModels = models.slice(0, 2)
      console.log(`🤖 Testing ${fastModels.length} models for ${providerName}`)

      // Sequential processing with timeout checks
      for (const model of fastModels) {
        if (currentResultCount >= maxResults) break

        // Check if we're running out of time
        const elapsed = Date.now() - startTime
        if (elapsed > 45000) {
          // Stop if we've used 45 seconds
          console.log("⏰ Approaching timeout limit, stopping model testing")
          break
        }

        try {
          console.log(`   Trying ${providerName}/${model.name}...`)

          const result = await generateSingleDocumentation(
            files,
            projectInfo,
            provider,
            providerName,
            model.name,
            model.maxTokens,
          )

          results.push(result)
          currentResultCount++

          // Reduced delay between API calls
          await new Promise((resolve) => setTimeout(resolve, 50))
        } catch (modelError) {
          console.error(`Error with model ${model.name}:`, modelError)
          results.push({
            success: false,
            modelUsed: model.name,
            providerUsed: providerName,
            error: modelError instanceof Error ? modelError.message : "Model error",
          })
          currentResultCount++
        }
      }
    } catch (providerError) {
      console.error(`Error with provider ${providerName}:`, providerError)
      results.push({
        success: false,
        providerUsed: providerName,
        error: providerError instanceof Error ? providerError.message : "Provider error",
      })
      currentResultCount++
    }
  }

  // Sort results by success and generation time
  results.sort((a, b) => {
    if (a.success && !b.success) return -1
    if (!a.success && b.success) return 1
    if (a.success && b.success) {
      return (a.generationTime || 0) - (b.generationTime || 0)
    }
    return 0
  })

  console.log(`✅ Generated ${results.length} total results`)
  console.log(`✅ Successful: ${results.filter((r) => r.success).length}`)
  console.log(`❌ Failed: ${results.filter((r) => !r.success).length}`)
  console.log(`⏱️ Total time: ${Date.now() - startTime}ms`)

  return {
    success: true,
    results,
    projectInfo,
  }
}

// GitHub repository processing with timeout
async function processGitRepository(gitUrl: string): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  try {
    const repoMatch = gitUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/)
    if (!repoMatch) {
      throw new Error("Invalid GitHub URL format")
    }

    const [, owner, repo] = repoMatch
    const projectName = repo

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`

    const headers: HeadersInit = {}
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`
    }

    const files: Array<{ path: string; content: string; language: string }> = []
    const languages = new Set<string>()
    const directories = new Set<string>()
    let packageInfo: any = undefined

    async function fetchDirectoryContents(url: string, currentPath = ""): Promise<void> {
      const response = await fetch(url, { headers })

      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
      if (rateLimitRemaining && Number.parseInt(rateLimitRemaining) < 5) {
        console.warn(`⚠️ GitHub API rate limit almost reached: ${rateLimitRemaining} requests remaining`)
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Try again later or add a GITHUB_TOKEN environment variable.")
        }
        throw new Error(`Failed to fetch repository: ${response.statusText}`)
      }

      const contents = await response.json()

      let fileCount = 0
      const maxFilesPerDirectory = 10 // Reduced from 15 to 10

      for (const item of contents) {
        if (fileCount >= maxFilesPerDirectory) {
          console.log(`Reached file limit for directory ${currentPath}, skipping remaining files`)
          break
        }

        if (item.type === "file") {
          const ext = item.name.substring(item.name.lastIndexOf(".")).toLowerCase()

          if (SUPPORTED_EXTENSIONS.includes(ext) && item.size < 50000) {
            // Reduced from 100000 to 50000
            try {
              const fileResponse = await fetch(item.download_url, { headers })

              if (!fileResponse.ok) {
                console.warn(`Could not fetch file: ${item.name}, status: ${fileResponse.status}`)
                continue
              }

              const content = await fileResponse.text()
              const language = getLanguageFromExtension(ext)
              languages.add(language)

              const filePath = currentPath ? `${currentPath}/${item.name}` : item.name

              if (item.name === "package.json") {
                try {
                  packageInfo = JSON.parse(content)
                } catch (e) {
                  // Invalid JSON, skip
                }
              }

              files.push({
                path: filePath,
                content: content.slice(0, 6000), // Reduced from 8000 to 6000
                language,
              })

              fileCount++
            } catch (error) {
              console.warn(`Could not read file: ${item.name}`, error)
            }
          }
        } else if (item.type === "dir" && files.length < 30) {
          // Reduced from 50 to 30
          const dirPath = currentPath ? `${currentPath}/${item.name}` : item.name
          directories.add(dirPath)

          if (!["node_modules", ".git", "dist", "build", ".next", "__pycache__"].includes(item.name)) {
            await fetchDirectoryContents(item.url, dirPath)
          }
        }
      }
    }

    await fetchDirectoryContents(apiUrl)

    const framework = detectFramework(
      packageInfo,
      files.map((f) => ({ name: f.path, content: f.content })),
    )
    if (packageInfo) {
      packageInfo.framework = framework
    }

    const projectInfo: ProjectInfo = {
      name: projectName,
      fileCount: files.length,
      languages: Array.from(languages),
      structure: {
        directories: Array.from(directories).sort(),
        files: files.map((f) => ({
          path: f.path,
          type: f.path.substring(f.path.lastIndexOf(".")),
          size: f.content.length,
        })),
        depth: Math.max(...Array.from(directories).map((d) => d.split("/").length), 1),
        keyFiles: files
          .filter(
            (f) =>
              f.path.includes("index.") ||
              f.path.includes("main.") ||
              f.path.includes("app.") ||
              f.path.includes("page.") ||
              f.path.includes("component"),
          )
          .slice(0, 8) // Reduced from 10 to 8
          .map((f) => ({
            path: f.path,
            purpose: f.path.includes("page") ? "Application page" : "Key component",
            type: f.language,
          })),
      },
      packageInfo,
    }

    return { files, projectInfo }
  } catch (error) {
    console.error("GitHub repository processing error:", error)
    throw new Error(`Failed to process Git repository: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// ZIP file processing with timeout
async function processZipFile(zipFile: File): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  try {
    const arrayBuffer = await zipFile.arrayBuffer()

    const zip = new JSZip()
    let zipData
    try {
      zipData = await zip.loadAsync(arrayBuffer)
    } catch (error) {
      console.error("Error loading ZIP:", error)
      throw new Error(`Failed to load ZIP file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    const files: Array<{ path: string; content: string; language: string }> = []
    const languages = new Set<string>()
    const directories = new Set<string>()
    let packageInfo: any = undefined
    let projectName = zipFile.name.replace(".zip", "")

    const entries = Object.entries(zipData.files)
    if (entries.length === 0) {
      throw new Error("ZIP file appears to be empty")
    }

    // Reduced file limit for faster processing
    const maxFiles = 50 // Reduced from 100 to 50
    let fileCount = 0

    for (const [relativePath, zipEntry] of entries) {
      if (fileCount >= maxFiles) {
        console.log(`Reached maximum file limit (${maxFiles}), stopping further processing`)
        break
      }

      if (zipEntry.dir) {
        directories.add(relativePath.replace(/\/$/, ""))
        continue
      }

      const fileName = relativePath.split("/").pop() || ""
      const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase()

      if (relativePath.includes("/")) {
        const firstDir = relativePath.split("/")[0]
        if (firstDir && !projectName.includes(firstDir)) {
          projectName = firstDir
        }
        const dirPath = relativePath.substring(0, relativePath.lastIndexOf("/"))
        if (dirPath) directories.add(dirPath)
      }

      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        try {
          const content = await zipEntry.async("string")
          const language = getLanguageFromExtension(ext)
          languages.add(language)

          if (fileName === "package.json") {
            try {
              packageInfo = JSON.parse(content)
              if (packageInfo.name) projectName = packageInfo.name
            } catch (e) {
              // Invalid JSON, skip
            }
          }

          if (content.length < 15000) {
            // Reduced from 20000 to 15000
            files.push({
              path: relativePath,
              content: content.slice(0, 6000), // Reduced from 8000 to 6000
              language,
            })
            fileCount++
          }
        } catch (error) {
          console.warn(`Could not read file: ${relativePath}`)
        }
      }
    }

    if (files.length === 0) {
      throw new Error("No supported files found in the ZIP archive")
    }

    const framework = detectFramework(
      packageInfo,
      files.map((f) => ({ name: f.path, content: f.content })),
    )
    if (packageInfo) {
      packageInfo.framework = framework
    }

    const projectInfo: ProjectInfo = {
      name: projectName,
      fileCount: files.length,
      languages: Array.from(languages),
      structure: {
        directories: Array.from(directories).sort(),
        files: files.map((f) => ({
          path: f.path,
          type: f.path.substring(f.path.lastIndexOf(".")),
          size: f.content.length,
        })),
        depth: Math.max(...Array.from(directories).map((d) => d.split("/").length), 1),
        keyFiles: files
          .filter(
            (f) =>
              f.path.includes("index.") ||
              f.path.includes("main.") ||
              f.path.includes("app.") ||
              f.path.includes("page.") ||
              f.path.includes("component"),
          )
          .slice(0, 8) // Reduced from 10 to 8
          .map((f) => ({
            path: f.path,
            purpose: f.path.includes("page") ? "Application page" : "Key component",
            type: f.language,
          })),
      },
      packageInfo,
    }

    return { files, projectInfo }
  } catch (error) {
    console.error("ZIP processing error:", error)
    throw new Error(`Failed to process ZIP file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
