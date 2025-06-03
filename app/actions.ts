"use server"

import { promises as fs } from "fs"
import path from "path"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { PROVIDER_MODELS } from "@/lib/providers"

// AI Providers with your API keys - Expanded with all providers
const providers = {
  groq: createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  }),
  openai: createOpenAI({
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
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
  openrouter: createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  }),
  xai: createOpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY,
  }),
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
  // New free providers
  anthropic: createOpenAI({
    baseURL: "https://api.anthropic.com/v1",
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
  gemini: createOpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1",
    apiKey: process.env.GEMINI_API_KEY,
  }),
  aleph: createOpenAI({
    baseURL: "https://api.aleph-alpha.com/v1",
    apiKey: process.env.ALEPH_API_KEY,
  }),
  stability: createOpenAI({
    baseURL: "https://api.stability.ai/v1",
    apiKey: process.env.STABILITY_API_KEY,
  }),
  claude: createOpenAI({
    baseURL: "https://api.anthropic.com/v1",
    apiKey: process.env.CLAUDE_API_KEY,
  }),
  ollama: createOpenAI({
    baseURL: "http://localhost:11434/v1",
    apiKey: "ollama", // Ollama doesn't require an API key when running locally
  }),
}

interface ProjectInfo {
  name: string
  fileCount: number
  languages: string[]
  structure: ProjectStructure
  packageInfo?: PackageInfo
  apiEndpoints?: ApiEndpoint[]
  testFiles?: string[]
  configFiles?: string[]
  uiFiles?: string[]
  securityFiles?: string[]
  dataFlowInfo?: DataFlowInfo
}

interface ProjectStructure {
  directories: string[]
  files: Array<{ path: string; type: string; size: number }>
  depth: number
  keyFiles: Array<{ path: string; purpose: string; type: string }>
}

interface PackageInfo {
  name?: string
  version?: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  framework?: string
  author?: string
  license?: string
}

interface ApiEndpoint {
  method: string
  path: string
  description: string
  file: string
}

interface DataFlowInfo {
  presentationLayer: string[]
  applicationLayer: string[]
  dataLayer: string[]
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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function detectFramework(packageInfo?: PackageInfo, files?: Array<{ path: string; content: string }>): string {
  if (!packageInfo && !files) return "Unknown"

  // Check package.json dependencies
  if (packageInfo?.dependencies) {
    const deps = Object.keys(packageInfo.dependencies)
    if (deps.includes("next")) return "Next.js"
    if (deps.includes("react")) return "React"
    if (deps.includes("vue")) return "Vue.js"
    if (deps.includes("svelte")) return "Svelte"
    if (deps.includes("@angular/core")) return "Angular"
    if (deps.includes("express")) return "Express.js"
    if (deps.includes("fastapi")) return "FastAPI"
    if (deps.includes("django")) return "Django"
    if (deps.includes("flask")) return "Flask"
    if (deps.includes("spring-boot")) return "Spring Boot"
  }

  // Check file patterns
  if (files) {
    const filePaths = files.map((f) => f.path.toLowerCase())
    if (filePaths.some((p) => p.includes("next.config"))) return "Next.js"
    if (filePaths.some((p) => p.includes("nuxt.config"))) return "Nuxt.js"
    if (filePaths.some((p) => p.includes("vite.config"))) return "Vite"
    if (filePaths.some((p) => p.includes("webpack.config"))) return "Webpack"
    if (filePaths.some((p) => p.includes("requirements.txt"))) return "Python"
    if (filePaths.some((p) => p.includes("pom.xml"))) return "Maven/Java"
    if (filePaths.some((p) => p.includes("cargo.toml"))) return "Rust/Cargo"
    if (filePaths.some((p) => p.includes("go.mod"))) return "Go"
  }

  return "Custom"
}

function identifyKeyFiles(files: Array<{ path: string; content: string; language: string }>): Array<{
  path: string
  purpose: string
  type: string
}> {
  const keyFiles: Array<{ path: string; purpose: string; type: string }> = []

  for (const file of files) {
    const fileName = path.basename(file.path).toLowerCase()
    const filePath = file.path.toLowerCase()

    // Main entry points
    if (fileName.includes("main.") || fileName.includes("index.") || fileName.includes("app.")) {
      keyFiles.push({
        path: file.path,
        purpose: "Main application entry point",
        type: "Entry Point",
      })
    }
    // Pages/Routes
    else if (filePath.includes("page") || filePath.includes("route") || filePath.includes("view")) {
      keyFiles.push({
        path: file.path,
        purpose: "Application page or route handler",
        type: "Page/Route",
      })
    }
    // Components
    else if (filePath.includes("component") || fileName.endsWith("component.")) {
      keyFiles.push({
        path: file.path,
        purpose: "Reusable UI component",
        type: "Component",
      })
    }
    // Models/Schemas
    else if (filePath.includes("model") || filePath.includes("schema")) {
      keyFiles.push({
        path: file.path,
        purpose: "Data model or schema definition",
        type: "Model",
      })
    }
    // Controllers/Services
    else if (filePath.includes("controller") || filePath.includes("service")) {
      keyFiles.push({
        path: file.path,
        purpose: "Business logic and API handling",
        type: "Controller/Service",
      })
    }
    // Configuration
    else if (fileName.includes("config") || fileName.includes("setting")) {
      keyFiles.push({
        path: file.path,
        purpose: "Application configuration",
        type: "Configuration",
      })
    }
    // Utils/Helpers
    else if (filePath.includes("util") || filePath.includes("helper") || filePath.includes("lib")) {
      keyFiles.push({
        path: file.path,
        purpose: "Utility functions and helpers",
        type: "Utility",
      })
    }
    // Database
    else if (filePath.includes("db") || filePath.includes("database") || filePath.includes("migration")) {
      keyFiles.push({
        path: file.path,
        purpose: "Database operations and schema management",
        type: "Database",
      })
    }
    // Authentication/Security
    else if (
      filePath.includes("auth") ||
      filePath.includes("security") ||
      filePath.includes("permission") ||
      filePath.includes("role")
    ) {
      keyFiles.push({
        path: file.path,
        purpose: "Authentication and security management",
        type: "Security",
      })
    }
  }

  return keyFiles.slice(0, 15) // Limit to top 15 key files
}

function extractApiEndpoints(files: Array<{ path: string; content: string; language: string }>): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = []

  for (const file of files) {
    const content = file.content.toLowerCase()

    // Look for common API patterns
    const routePatterns = [
      /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /@(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /route\s*\(\s*['"`]([^'"`]+)['"`].*?(get|post|put|delete|patch)/g,
    ]

    for (const pattern of routePatterns) {
      let match
      while ((match = pattern.exec(content)) !== null && endpoints.length < 10) {
        const method = match[1]?.toUpperCase() || "GET"
        const path = match[2] || match[1]
        if (path && !path.includes("function") && !path.includes("const")) {
          endpoints.push({
            method,
            path,
            description: `${method} endpoint`,
            file: file.path,
          })
        }
      }
    }
  }

  return endpoints
}

function identifyDataFlowFiles(files: Array<{ path: string; content: string; language: string }>): DataFlowInfo {
  const presentationLayer: string[] = []
  const applicationLayer: string[] = []
  const dataLayer: string[] = []

  for (const file of files) {
    const filePath = file.path.toLowerCase()
    const fileName = path.basename(filePath)

    // Presentation layer (UI, components, pages)
    if (
      filePath.includes("component") ||
      filePath.includes("page") ||
      filePath.includes("view") ||
      filePath.includes("ui") ||
      filePath.includes("screen") ||
      filePath.includes("template") ||
      [".jsx", ".tsx", ".vue", ".svelte", ".html"].some((ext) => fileName.endsWith(ext))
    ) {
      presentationLayer.push(file.path)
    }

    // Application layer (business logic, controllers, services)
    else if (
      filePath.includes("controller") ||
      filePath.includes("service") ||
      filePath.includes("handler") ||
      filePath.includes("middleware") ||
      filePath.includes("util") ||
      filePath.includes("helper") ||
      filePath.includes("business") ||
      filePath.includes("logic")
    ) {
      applicationLayer.push(file.path)
    }

    // Data layer (models, repositories, database)
    else if (
      filePath.includes("model") ||
      filePath.includes("entity") ||
      filePath.includes("repository") ||
      filePath.includes("dao") ||
      filePath.includes("db") ||
      filePath.includes("database") ||
      filePath.includes("schema") ||
      filePath.includes("migration") ||
      filePath.includes("query")
    ) {
      dataLayer.push(file.path)
    }
  }

  return {
    presentationLayer: presentationLayer.slice(0, 10),
    applicationLayer: applicationLayer.slice(0, 10),
    dataLayer: dataLayer.slice(0, 10),
  }
}

async function analyzeProjectStructure(projectPath: string): Promise<ProjectStructure> {
  const directories: string[] = []
  const files: Array<{ path: string; type: string; size: number }> = []
  let maxDepth = 0

  async function scanDirectory(dirPath: string, relativePath = "", depth = 0) {
    maxDepth = Math.max(maxDepth, depth)

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativeFilePath = path.join(relativePath, entry.name)

        if (entry.isDirectory()) {
          if (!["node_modules", ".git", ".next", "dist", "build", ".vscode", "__pycache__"].includes(entry.name)) {
            directories.push(relativeFilePath)
            if (depth < 4) {
              await scanDirectory(fullPath, relativeFilePath, depth + 1)
            }
          }
        } else {
          try {
            const stats = await fs.stat(fullPath)
            const ext = path.extname(entry.name).toLowerCase()
            files.push({
              path: relativeFilePath,
              type: ext || "file",
              size: stats.size,
            })
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  await scanDirectory(projectPath)

  return {
    directories: directories.sort(),
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    depth: maxDepth,
    keyFiles: [], // Will be populated later
  }
}

async function readProjectFiles(projectPath: string): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  const files: Array<{ path: string; content: string; language: string }> = []
  const languages = new Set<string>()
  const testFiles: string[] = []
  const configFiles: string[] = []
  const uiFiles: string[] = []
  const securityFiles: string[] = []

  // Analyze project structure first
  const structure = await analyzeProjectStructure(projectPath)

  // Try to read package.json for additional info
  let packageInfo: PackageInfo | undefined
  try {
    const packageJsonPath = path.join(projectPath, "package.json")
    const packageContent = await fs.readFile(packageJsonPath, "utf-8")
    const packageData = JSON.parse(packageContent)
    packageInfo = {
      name: packageData.name,
      version: packageData.version,
      description: packageData.description,
      scripts: packageData.scripts,
      dependencies: packageData.dependencies,
      devDependencies: packageData.devDependencies,
      author: packageData.author,
      license: packageData.license,
    }
  } catch (error) {
    // No package.json or invalid JSON
  }

  async function readDirectory(dirPath: string, relativePath = "") {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativeFilePath = path.join(relativePath, entry.name)

        if (entry.isDirectory()) {
          if (!["node_modules", ".git", ".next", "dist", "build", ".vscode", "__pycache__"].includes(entry.name)) {
            await readDirectory(fullPath, relativeFilePath)
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase()
          const fileName = entry.name.toLowerCase()
          const filePath = relativeFilePath.toLowerCase()

          // Identify test files
          if (fileName.includes("test") || fileName.includes("spec") || filePath.includes("test")) {
            testFiles.push(relativeFilePath)
          }

          // Identify config files
          if (
            fileName.includes("config") ||
            fileName.includes("setting") ||
            fileName.includes(".env") ||
            fileName.includes("docker") ||
            fileName.includes("webpack") ||
            fileName.includes("babel")
          ) {
            configFiles.push(relativeFilePath)
          }

          // Identify UI files
          if (
            filePath.includes("component") ||
            filePath.includes("view") ||
            filePath.includes("page") ||
            filePath.includes("screen") ||
            filePath.includes("ui") ||
            [".jsx", ".tsx", ".vue", ".svelte", ".html", ".css", ".scss"].some((e) => fileName.endsWith(e))
          ) {
            uiFiles.push(relativeFilePath)
          }

          // Identify security files
          if (
            filePath.includes("auth") ||
            filePath.includes("security") ||
            filePath.includes("permission") ||
            filePath.includes("role") ||
            filePath.includes("login") ||
            filePath.includes("password")
          ) {
            securityFiles.push(relativeFilePath)
          }

          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            try {
              const content = await fs.readFile(fullPath, "utf-8")
              const language = getLanguageFromExtension(ext)
              languages.add(language)

              if (content.length < 20000) {
                files.push({
                  path: relativeFilePath,
                  content: content.slice(0, 8000),
                  language,
                })
              }
            } catch (error) {
              console.warn(`Could not read file: ${fullPath}`)
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Could not read directory: ${dirPath}`)
    }
  }

  await readDirectory(projectPath)

  // Identify key files
  const keyFiles = identifyKeyFiles(files)
  structure.keyFiles = keyFiles

  // Extract API endpoints
  const apiEndpoints = extractApiEndpoints(files)

  // Identify data flow files
  const dataFlowInfo = identifyDataFlowFiles(files)

  // Detect framework
  if (packageInfo) {
    packageInfo.framework = detectFramework(packageInfo, files)
  }

  const projectName = path.basename(projectPath)
  const projectInfo: ProjectInfo = {
    name: projectName,
    fileCount: files.length,
    languages: Array.from(languages),
    structure,
    packageInfo,
    apiEndpoints,
    testFiles: testFiles.slice(0, 10),
    configFiles: configFiles.slice(0, 10),
    uiFiles: uiFiles.slice(0, 10),
    securityFiles: securityFiles.slice(0, 10),
    dataFlowInfo,
  }

  return { files, projectInfo }
}

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
    // Prepare content for AI analysis - using the simpler format
    const projectContent = files
      .map(
        (file) =>
          `## File: ${file.path} (${file.language})\n\`\`\`${file.language.toLowerCase()}\n${file.content}\n\`\`\``,
      )
      .join("\n\n")

    // Generate documentation using AI with simpler format
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

    const { text } = await generateText({
      model: provider(modelName),
      prompt,
      maxTokens: Math.min(4000, Math.floor(maxTokens * 0.8)),
    })

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

export async function generateDocumentationComparison(
  projectPath: string,
  selectedProvider?: string,
): Promise<GenerateDocumentationResult> {
  console.log("🚀 Starting local documentation generation...")
  console.log("Project path:", projectPath)
  console.log("Selected provider:", selectedProvider)

  try {
    // Validate path
    try {
      await fs.access(projectPath)
    } catch {
      return {
        success: false,
        error: "Project path does not exist or is not accessible",
      }
    }

    // Read project files
    const { files, projectInfo } = await readProjectFiles(projectPath)

    if (files.length === 0) {
      return {
        success: false,
        error: "No supported source files found in the project",
      }
    }

    console.log(`📁 Found ${files.length} files to analyze`)
    console.log(`🔍 Identified ${projectInfo.structure.keyFiles.length} key files`)
    console.log(`🌐 Found ${projectInfo.apiEndpoints?.length || 0} API endpoints`)
    console.log(`🔒 Found ${projectInfo.securityFiles?.length || 0} security-related files`)
    console.log(`🖥️ Found ${projectInfo.uiFiles?.length || 0} UI-related files`)

    // Determine which providers to use
    const providersToTest = selectedProvider
      ? [selectedProvider]
      : Object.keys(PROVIDER_MODELS).filter((provider) => {
          const envKey = `${provider.toUpperCase()}_API_KEY`
          return !!process.env[envKey]
        })

    if (providersToTest.length === 0) {
      return {
        success: false,
        error: "No API keys configured for any providers",
      }
    }

    console.log(`🔑 Testing providers: ${providersToTest.join(", ")}`)

    const results: DocumentationResult[] = []

    // Test all models for each provider
    for (const providerName of providersToTest) {
      const provider = providers[providerName as keyof typeof providers]
      const models = PROVIDER_MODELS[providerName as keyof typeof PROVIDER_MODELS]

      console.log(`🤖 Testing ${models.length} models for ${providerName}`)

      for (const model of models) {
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

        // Add small delay between requests to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    }

    // Sort results by success first, then by generation time
    results.sort((a, b) => {
      if (a.success && !b.success) return -1
      if (!a.success && b.success) return 1
      if (a.success && b.success) {
        return (a.generationTime || 0) - (b.generationTime || 0)
      }
      return 0
    })

    return {
      success: true,
      results,
      projectInfo,
    }
  } catch (error) {
    console.error("Error generating documentation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate documentation",
    }
  }
}

export async function getAvailableProviders(): Promise<string[]> {
  const allProviders = Object.keys(PROVIDER_MODELS)
  const availableProviders = allProviders.filter((provider) => {
    const envKey = `${provider.toUpperCase()}_API_KEY`
    return !!process.env[envKey]
  })

  // Prioritize Groq since it's integrated with Vercel
  const prioritizedProviders = availableProviders.sort((a, b) => {
    if (a === "groq") return -1
    if (b === "groq") return 1
    return 0
  })

  return prioritizedProviders
}
