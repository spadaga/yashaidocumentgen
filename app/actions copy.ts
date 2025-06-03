"use server"

import { promises as fs } from "fs"
import path from "path"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Using Groq as the primary LLM provider
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
})

// List of available Groq models to try in order of preference
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.2-11b-text-preview",
  "llama-3.2-3b-preview",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "gemma-7b-it",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "deepseek-r1-distill-llama-70b",
  "qwen-qwq-32b",
  "mistral-saba-24b",
]

interface ProjectInfo {
  name: string
  fileCount: number
  languages: string[]
}

interface GenerateDocumentationResult {
  success: boolean
  documentation?: string
  projectInfo?: ProjectInfo
  error?: string
  modelUsed?: string
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

async function readProjectFiles(projectPath: string): Promise<{
  files: Array<{ path: string; content: string; language: string }>
  projectInfo: ProjectInfo
}> {
  const files: Array<{ path: string; content: string; language: string }> = []
  const languages = new Set<string>()

  async function readDirectory(dirPath: string, relativePath = "") {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativeFilePath = path.join(relativePath, entry.name)

        // Skip node_modules, .git, and other common directories
        if (entry.isDirectory()) {
          if (!["node_modules", ".git", ".next", "dist", "build", ".vscode"].includes(entry.name)) {
            await readDirectory(fullPath, relativeFilePath)
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase()
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            try {
              const content = await fs.readFile(fullPath, "utf-8")
              const language = getLanguageFromExtension(ext)
              languages.add(language)

              // Limit file size to prevent overwhelming the AI
              if (content.length < 10000) {
                files.push({
                  path: relativeFilePath,
                  content: content.slice(0, 5000), // Truncate very long files
                  language,
                })
              }
            } catch (error) {
              // Skip files that can't be read
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

  const projectName = path.basename(projectPath)
  const projectInfo: ProjectInfo = {
    name: projectName,
    fileCount: files.length,
    languages: Array.from(languages),
  }

  return { files, projectInfo }
}

export async function generateDocumentation(projectPath: string): Promise<GenerateDocumentationResult> {
  try {
    // Check if Groq API key is available
    if (!process.env.GROQ_API_KEY) {
      return {
        success: false,
        error: "Groq API key is not configured. Please add GROQ_API_KEY to your environment variables",
      }
    }

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

    // Prepare content for AI analysis
    const projectContent = files
      .map(
        (file) =>
          `## File: ${file.path} (${file.language})\n\`\`\`${file.language.toLowerCase()}\n${file.content}\n\`\`\``,
      )
      .join("\n\n")

    // Generate documentation using AI
    const prompt = `
You are a technical documentation expert. Analyze the following source code and generate comprehensive project documentation.

Project Name: ${projectInfo.name}
Languages: ${projectInfo.languages.join(", ")}
Files Analyzed: ${projectInfo.fileCount}

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

    console.log("Trying Groq models in order...")

    // Try each model until one succeeds
    let lastError: Error | null = null
    for (const modelName of GROQ_MODELS) {
      try {
        console.log(`Attempting model: ${modelName}`)

        const { text } = await generateText({
          model: groq(modelName),
          prompt,
          maxTokens: 4000,
        })

        console.log(`✅ Success with model: ${modelName}`)

        return {
          success: true,
          documentation: text,
          projectInfo,
          modelUsed: modelName,
        }
      } catch (error) {
        console.log(`❌ Failed with model ${modelName}:`, error instanceof Error ? error.message : error)
        lastError = error instanceof Error ? error : new Error(String(error))

        // Continue to next model
        continue
      }
    }

    // If we get here, all models failed
    return {
      success: false,
      error: `All Groq models failed. Last error: ${lastError?.message || "Unknown error"}`,
    }
  } catch (error) {
    console.error("Error generating documentation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate documentation",
    }
  }
}
