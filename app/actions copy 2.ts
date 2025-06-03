"use server"

import { promises as fs } from "fs"
import path from "path"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { PROVIDER_MODELS } from "@/lib/providers"

// AI Providers with your API keys
const providers = {
  groq: createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
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
}

interface ProjectInfo {
  name: string
  fileCount: number
  languages: string[]
  structure: ProjectStructure
  packageInfo?: PackageInfo
}

interface ProjectStructure {
  directories: string[]
  files: Array<{ path: string; type: string; size: number }>
  depth: number
}

interface PackageInfo {
  name?: string
  version?: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  framework?: string
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
    if (deps.includes("angular")) return "Angular"
    if (deps.includes("express")) return "Express.js"
    if (deps.includes("fastapi")) return "FastAPI"
    if (deps.includes("django")) return "Django"
    if (deps.includes("flask")) return "Flask"
    if (deps.includes("spring-boot")) return "Spring Boot"
  }

  // Check file patterns
  if (files) {
    const filePaths = files.map(f => f.path.toLowerCase())
    if (filePaths.some(p => p.includes("next.config"))) return "Next.js"
    if (filePaths.some(p => p.includes("nuxt.config"))) return "Nuxt.js"
    if (filePaths.some(p => p.includes("vite.config"))) return "Vite"
    if (filePaths.some(p => p.includes("webpack.config"))) return "Webpack"
    if (filePaths.some(p => p.includes("requirements.txt"))) return "Python"
    if (filePaths.some(p => p.includes("pom.xml"))) return "Maven/Java"
    if (filePaths.some(p => p.includes("cargo.toml"))) return "Rust/Cargo"
    if (filePaths.some(p => p.includes("go.mod"))) return "Go"
  }

  return "Custom"
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
            if (depth < 3) { // Limit depth to avoid too deep scanning
              await scanDirectory(fullPath, relativeFilePath, depth + 1)
            }
          }
        } else {
          try {
            const stats = await fs.stat(fullPath)
            const ext = path.extname(entry.name).toLowerCase()
            files.push({
              path: relativeFilePath,
              type: ext || 'file',
              size: stats.size
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
    depth: maxDepth
  }
}

async function readProjectFiles(projectPath: string): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  const files: Array<{ path: string; content: string; language: string }> = []
  const languages = new Set<string>()

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
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            try {
              const content = await fs.readFile(fullPath, "utf-8")
              const language = getLanguageFromExtension(ext)
              languages.add(language)

              if (content.length < 15000) {
                files.push({
                  path: relativeFilePath,
                  content: content.slice(0, 6000),
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
  }

  return { files, projectInfo }
}

function generateProjectStructureTree(structure: ProjectStructure): string {
  const tree: string[] = []
  const allPaths = [
    ...structure.directories.map(d => ({ path: d, type: 'dir' })),
    ...structure.files.map(f => ({ path: f.path, type: 'file' }))
  ].sort((a, b) => a.path.localeCompare(b.path))

  for (const item of allPaths.slice(0, 50)) { // Limit to first 50 items
    const depth = item.path.split(path.sep).length - 1
    const indent = '  '.repeat(depth)
    const icon = item.type === 'dir' ? '📁' : '📄'
    const name = path.basename(item.path)
    tree.push(`${indent}${icon} ${name}`)
  }

  if (allPaths.length > 50) {
    tree.push('  ... and more files')
  }

  return tree.join('\n')
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
    // Generate project structure tree
    const structureTree = generateProjectStructureTree(projectInfo.structure)

    // Identify key files and pages
    const keyFiles = files.filter(f => 
      f.path.includes('page.') || 
      f.path.includes('index.') || 
      f.path.includes('main.') || 
      f.path.includes('app.') ||
      f.path.includes('server.') ||
      f.path.includes('config.')
    ).slice(0, 8)

    // Limit content based on token constraints
    const projectContent = files
      .slice(0, Math.min(files.length, 12)) // Limit to 12 files max
      .map(
        (file) =>
          `## File: ${file.path} (${file.language})\n\`\`\`${file.language.toLowerCase()}\n${file.content.slice(0, 800)}\n\`\`\``,
      )
      .join("\n\n")

    const keyFilesContent = keyFiles.map(f => 
      `- **${f.path}** (${f.language}): ${f.content.slice(0, 200).replace(/\n/g, ' ')}...`
    ).join('\n')

    const packageScripts = projectInfo.packageInfo?.scripts 
      ? Object.entries(projectInfo.packageInfo.scripts).map(([key, value]) => `- \`npm run ${key}\`: ${value}`).join('\n')
      : ''

    const dependencies = projectInfo.packageInfo?.dependencies
      ? Object.keys(projectInfo.packageInfo.dependencies).slice(0, 10).join(', ')
      : 'Not specified'

    const prompt = `
You are a technical documentation expert. Analyze the following project and generate comprehensive documentation.

## Project Information
- **Name**: ${projectInfo.name}
- **Framework**: ${projectInfo.packageInfo?.framework || 'Unknown'}
- **Languages**: ${projectInfo.languages.join(", ")}
- **Files Analyzed**: ${Math.min(files.length, 12)}
- **Total Files**: ${projectInfo.structure.files.length}
- **Directories**: ${projectInfo.structure.directories.length}
- **Project Depth**: ${projectInfo.structure.depth} levels

## Project Structure
\`\`\`
${structureTree}
\`\`\`

## Key Files/Pages
${keyFilesContent}

## Package Information
${projectInfo.packageInfo ? `
- **Version**: ${projectInfo.packageInfo.version || 'Not specified'}
- **Description**: ${projectInfo.packageInfo.description || 'Not specified'}
- **Main Dependencies**: ${dependencies}
` : 'No package.json found'}

## Source Code Analysis
${projectContent}

Please generate comprehensive documentation with the following sections:

# ${projectInfo.name}

## 📋 Project Overview
Brief description of what the project does, its purpose, and main functionality.

## 🏗️ Architecture & Design
High-level architecture, design patterns, and project organization.

## 🛠️ Technologies Used
List of frameworks, libraries, languages, and tools used in the project.

## 📁 Project Structure
Detailed explanation of the directory structure and file organization:
\`\`\`
${structureTree}
\`\`\`

## 📄 Page/Component Explanations
Detailed explanation of key pages, components, and their functionality:
${keyFiles.map(f => `- **${f.path}**: [Explain what this file/page does]`).join('\n')}

## 🚀 Setup & Installation
Step-by-step instructions to set up and run the project locally:

1. **Prerequisites**: List required software/tools
2. **Installation**: Clone and install dependencies
3. **Configuration**: Environment variables and config files
4. **Running**: How to start the development server

## 📦 Available Scripts
${packageScripts || 'List the main commands to run, build, and test the project'}

## 🌐 Deployment & Production
Instructions for deploying the application:

1. **Build Process**: How to create production build
2. **Deployment Options**: Various deployment platforms
3. **Environment Setup**: Production environment configuration
4. **Monitoring**: How to monitor the deployed application

## 🔧 Development
Guidelines for developers working on this project:

- **Code Structure**: How code is organized
- **Development Workflow**: Git workflow and best practices
- **Testing**: How to run tests
- **Contributing**: How to contribute to the project

## 📚 API Documentation
${projectInfo.packageInfo?.framework?.includes('API') || files.some(f => f.path.includes('api')) 
  ? 'Document the main API endpoints and their usage' 
  : 'If applicable, document any APIs or interfaces'}

## 🤝 Contributing
Guidelines for contributing to the project, including code style, pull request process, and issue reporting.

Make the documentation professional, clear, and actionable. Focus on practical information that helps developers understand, set up, and contribute to the project.
`

    const { text } = await generateText({
      model: provider(modelName),
      prompt,
      maxTokens: Math.min(3500, Math.floor(maxTokens * 0.6)),
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
    console.log(`🏗️ Project structure: ${projectInfo.structure.directories.length} directories, ${projectInfo.structure.files.length} files`)

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
        await new Promise((resolve) => setTimeout(resolve, 1000))
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
  return Object.keys(PROVIDER_MODELS).filter((provider) => {
    const envKey = `${provider.toUpperCase()}_API_KEY`
    return !!process.env[envKey]
  })
}
