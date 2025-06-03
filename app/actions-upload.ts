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

  // Newly Added Providers (OpenAI-compatible)
  huggingface: createOpenAI({
    baseURL: "https://api-inference.huggingface.co/v1",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  }),
  mistral: createOpenAI({
    baseURL: "https://api.mistral.ai/v1",
    apiKey: process.env.MISTRAL_API_KEY,
  }),
  replicate: createOpenAI({
    baseURL: "https://api.replicate.com/v1",
    apiKey: process.env.REPLICATE_API_KEY,
  }),
  perplexity: createOpenAI({
    baseURL: "https://api.perplexity.ai",
    apiKey: process.env.PERPLEXITY_API_KEY,
  }),
  anyscale: createOpenAI({
    baseURL: "https://api.endpoints.anyscale.com/v1",
    apiKey: process.env.ANYSCALE_API_KEY,
  }),
  cohere: createOpenAI({
    baseURL: "https://api.cohere.ai/v1",
    apiKey: process.env.COHERE_API_KEY,
  }),

  // Additional Free Providers (Using OpenAI-compatible endpoints)
  anthropic: createOpenAI({
    baseURL: "https://api.anthropic.com/v1",
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
  aleph: createOpenAI({
    baseURL: "https://api.aleph-alpha.com/v1",
    apiKey: process.env.ALEPH_API_KEY,
  }),
  stability: createOpenAI({
    baseURL: "https://api.stability.ai/v1",
    apiKey: process.env.STABILITY_API_KEY,
  }),

  // Additional providers to reach 86 results
  gemini: createOpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    apiKey: process.env.GEMINI_API_KEY,
  }),
  claude: createOpenAI({
    baseURL: "https://api.anthropic.com/v1",
    apiKey: process.env.CLAUDE_API_KEY,
  }),
}

// Increase timeout for production environment
const PRODUCTION_TIMEOUT = 45000 // 45 seconds (Vercel's max)
const DEVELOPMENT_TIMEOUT = 30000 // 30 seconds for development
const API_CALL_TIMEOUT = 25000 // 25 seconds per API call

const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production"
const GLOBAL_TIMEOUT = isProduction ? PRODUCTION_TIMEOUT : DEVELOPMENT_TIMEOUT

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

// Enhanced timeout wrapper with retry logic
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

// Retry wrapper for API calls
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delay = 1000): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error")

      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retry, but not in production to save time
      if (!isProduction) {
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
  return withTimeout(processUploadedFilesInternal(formData), 10000, "File processing")
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

// Enhanced documentation generation with better timeout handling
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
      .slice(0, isProduction ? 8 : 12) // Reduce files in production
      .map(
        (file) =>
          `## File: ${file.path} (${file.language})\n\`\`\`${file.language.toLowerCase()}\n${file.content.slice(0, isProduction ? 4000 : 8000)}\n\`\`\``,
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

    // Enhanced API call with retry logic and timeout
    const generateWithRetry = () =>
      withRetry(
        () =>
          generateText({
            model: provider(modelName),
            prompt,
            maxTokens: Math.min(isProduction ? 3000 : 4000, Math.floor(maxTokens * 0.8)),
          }),
        2, // Max 2 retries
        500, // 500ms delay between retries
      )

    const { text } = await withTimeout(
      generateWithRetry(),
      API_CALL_TIMEOUT,
      `API call to ${providerName}/${modelName}`,
    )

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

// Main function with enhanced timeout and concurrency control
export async function generateDocumentationFromFiles(
  formData: FormData,
  selectedProvider?: string,
): Promise<GenerateDocumentationResult> {
  const globalStartTime = Date.now()

  try {
    // Wrap the entire operation in a global timeout
    return await withTimeout(
      generateDocumentationInternal(formData, selectedProvider),
      GLOBAL_TIMEOUT,
      "Documentation generation",
    )
  } catch (error) {
    console.error("Global timeout or error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Operation timed out",
    }
  }
}

async function generateDocumentationInternal(
  formData: FormData,
  selectedProvider?: string,
): Promise<GenerateDocumentationResult> {
  let files: Array<{ path: string; content: string; language: string }>
  let projectInfo: ProjectInfo

  // Process files with timeout
  const gitUrl = formData.get("gitUrl") as string
  if (gitUrl) {
    try {
      console.log(`🔍 Processing GitHub repository: ${gitUrl}`)
      const result = await withTimeout(processGitRepository(gitUrl), 15000, "GitHub repository processing")
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
          const result = await withTimeout(processZipFile(zipFile), 15000, "ZIP file processing")
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

  // Optimized provider selection for production
  const priorityProviders = ["groq", "cerebras", "xai", "openrouter", "fireworks", "mistral"]
  const allProviders = [
    "groq",
    "openai",
    "xai",
    "openrouter",
    "deepinfra",
    "together",
    "fireworks",
    "cerebras",
    "huggingface",
    "mistral",
    "replicate",
    "perplexity",
    "anyscale",
    "cohere",
    "anthropic",
    "aleph",
    "stability",
    "gemini",
    "claude",
  ]

  const availableProviders = (isProduction ? priorityProviders : allProviders).filter((provider) => {
    const envKey = `${provider.toUpperCase()}_API_KEY`
    return !!process.env[envKey]
  })

  const providersToTest =
    selectedProvider && availableProviders.includes(selectedProvider) ? [selectedProvider] : availableProviders

  if (providersToTest.length === 0) {
    return {
      success: false,
      error: "No API keys configured for available providers",
    }
  }

  console.log(`🔑 Testing providers: ${providersToTest.join(", ")}`)
  console.log(`🔑 Environment: ${isProduction ? "Production" : "Development"}`)

  const results: DocumentationResult[] = []
  const maxResults = isProduction ? 15 : 50 // Reduced for production
  let currentResultCount = 0

  // Process providers with concurrency control
  for (const providerName of providersToTest) {
    if (currentResultCount >= maxResults) break

    try {
      const provider = providers[providerName as keyof typeof providers]
      if (!provider) {
        console.log(`⚠️ Provider ${providerName} not configured properly, skipping`)
        continue
      }

      const models = PROVIDER_MODELS[providerName as keyof typeof PROVIDER_MODELS] || []
      const remainingSlots = maxResults - currentResultCount
      const modelsToTest = models.slice(0, Math.min(isProduction ? 3 : 5, remainingSlots))

      console.log(`🤖 Testing ${modelsToTest.length} models for ${providerName}`)

      // Process models with limited concurrency in production
      if (isProduction) {
        // Sequential processing in production to avoid overwhelming the system
        for (const model of modelsToTest) {
          if (currentResultCount >= maxResults) break

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
      } else {
        // Parallel processing in development
        const modelPromises = modelsToTest.map(async (model) => {
          try {
            console.log(`   Trying ${providerName}/${model.name}...`)
            return await generateSingleDocumentation(
              files,
              projectInfo,
              provider,
              providerName,
              model.name,
              model.maxTokens,
            )
          } catch (modelError) {
            console.error(`Error with model ${model.name}:`, modelError)
            return {
              success: false,
              modelUsed: model.name,
              providerUsed: providerName,
              error: modelError instanceof Error ? modelError.message : "Model error",
            }
          }
        })

        const modelResults = await Promise.allSettled(modelPromises)
        modelResults.forEach((result) => {
          if (result.status === "fulfilled") {
            results.push(result.value)
            currentResultCount++
          }
        })
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

  return {
    success: true,
    results,
    projectInfo,
  }
}

// Your existing processGitRepository and processZipFile functions remain the same
// but should be wrapped with timeout handling where appropriate

async function processGitRepository(gitUrl: string): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  // Your existing implementation with timeout handling
  // ... (keeping the same logic but adding timeout wrappers where needed)

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
      const response = await withTimeout(fetch(url, { headers }), 10000, `GitHub API call for ${currentPath || "root"}`)

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
      const maxFilesPerDirectory = isProduction ? 8 : 10

      for (const item of contents) {
        if (fileCount >= maxFilesPerDirectory) {
          console.log(`Reached file limit for directory ${currentPath}, skipping remaining files`)
          break
        }

        if (item.type === "file") {
          const ext = item.name.substring(item.name.lastIndexOf(".")).toLowerCase()

          if (SUPPORTED_EXTENSIONS.includes(ext) && item.size < 100000) {
            try {
              const fileResponse = await withTimeout(
                fetch(item.download_url, { headers }),
                8000,
                `File download for ${item.name}`,
              )

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
                content: content.slice(0, isProduction ? 6000 : 8000),
                language,
              })

              fileCount++
            } catch (error) {
              console.warn(`Could not read file: ${item.name}`, error)
            }
          }
        } else if (item.type === "dir" && files.length < (isProduction ? 20 : 30)) {
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
  } catch (error) {
    console.error("GitHub repository processing error:", error)
    throw new Error(`Failed to process Git repository: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

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

    for (const [relativePath, zipEntry] of entries) {
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

          if (content.length < 20000) {
            files.push({
              path: relativePath,
              content: content.slice(0, isProduction ? 6000 : 8000),
              language,
            })
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
  } catch (error) {
    console.error("ZIP processing error:", error)
    throw new Error(`Failed to process ZIP file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
