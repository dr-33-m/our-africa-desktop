import { Module } from '../types'
import { ModuleValidator, ModuleValidationResult } from '../utils/moduleSchema'

export interface ModuleLoadResult {
  success: boolean
  module?: Module
  validationResult?: ModuleValidationResult
  error?: string
}

export class ModuleLoaderService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_DOMAINS = [
    'github.com',
    'raw.githubusercontent.com',
    'gist.githubusercontent.com',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ]

  /**
   * Load a module from a URL
   */
  static async loadFromUrl(url: string): Promise<ModuleLoadResult> {
    try {
      // Validate URL format
      const urlValidation = this.validateUrl(url)
      if (!urlValidation.isValid) {
        return {
          success: false,
          error: urlValidation.error
        }
      }

      // Fetch the module data
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 seconds
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch module: ${response.status} ${response.statusText}`
        }
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        return {
          success: false,
          error: 'Invalid content type. Expected JSON.'
        }
      }

      // Check file size
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB.`
        }
      }

      // Parse JSON
      const moduleData = await response.json()

      // Validate and sanitize the module
      return this.processModuleData(moduleData)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out. Please try again.'
          }
        }
        return {
          success: false,
          error: `Failed to load module: ${error.message}`
        }
      }
      return {
        success: false,
        error: 'An unknown error occurred while loading the module.'
      }
    }
  }

  /**
   * Load a module from a file
   */
  static async loadFromFile(file: File): Promise<ModuleLoadResult> {
    try {
      // Validate file
      const fileValidation = this.validateFile(file)
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.error
        }
      }

      // Read file content
      const fileContent = await this.readFileAsText(file)

      // Parse JSON
      let moduleData
      try {
        moduleData = JSON.parse(fileContent)
      } catch {
        return {
          success: false,
          error: 'Invalid JSON format. Please check your file.'
        }
      }

      // Validate and sanitize the module
      return this.processModuleData(moduleData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file.'
      }
    }
  }

  /**
   * Process and validate module data
   */
  private static processModuleData(moduleData: unknown): ModuleLoadResult {
    // Validate the module structure
    const validationResult = ModuleValidator.validate(moduleData as Record<string, unknown>)

    if (!validationResult.isValid) {
      return {
        success: false,
        validationResult,
        error: 'Module validation failed. Please check the errors below.'
      }
    }

    try {
      // Sanitize and create the module
      const sanitizedModule = ModuleValidator.sanitizeModule(moduleData as Record<string, unknown>)

      return {
        success: true,
        module: sanitizedModule,
        validationResult
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process module data.'
      }
    }
  }

  /**
   * Validate URL
   */
  private static validateUrl(url: string): {
    isValid: boolean
    error?: string
  } {
    try {
      const urlObj = new URL(url)

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: 'Only HTTP and HTTPS URLs are allowed.'
        }
      }

      // Check if domain is in allowed list (optional - can be disabled for more flexibility)
      // Uncomment the following lines to enable domain restrictions
      /*
      if (!this.ALLOWED_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
        return {
          isValid: false,
          error: `Domain not allowed. Allowed domains: ${this.ALLOWED_DOMAINS.join(', ')}`
        };
      }
      */

      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: 'Invalid URL format.'
      }
    }
  }

  /**
   * Validate file
   */
  private static validateFile(file: File): {
    isValid: boolean
    error?: string
  } {
    // Check file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      return {
        isValid: false,
        error: 'Only JSON files are allowed.'
      }
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB.`
      }
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty.'
      }
    }

    return { isValid: true }
  }

  /**
   * Read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Check if a module with the same ID or title already exists
   */
  static checkForDuplicates(
    newModule: Module,
    existingModules: Module[]
  ): {
    isDuplicate: boolean
    duplicateType?: 'id' | 'title'
    existingModule?: Module
  } {
    // Check for ID duplicate
    const idDuplicate = existingModules.find((module) => module.id === newModule.id)
    if (idDuplicate) {
      return {
        isDuplicate: true,
        duplicateType: 'id',
        existingModule: idDuplicate
      }
    }

    // Check for title duplicate (case-insensitive)
    const titleDuplicate = existingModules.find(
      (module) => module.title.toLowerCase() === newModule.title.toLowerCase()
    )
    if (titleDuplicate) {
      return {
        isDuplicate: true,
        duplicateType: 'title',
        existingModule: titleDuplicate
      }
    }

    return { isDuplicate: false }
  }

  /**
   * Generate a preview of the module for user confirmation
   */
  static generateModulePreview(module: Module) {
    return {
      title: module.title,
      description: module.description,
      version: module.version,
      lessonsCount: module.content.lessons.length,
      quizzesCount: module.content.quizzes.length,
      estimatedTime: module.content.estimatedTime,
      lessonTitles: module.content.lessons.map((lesson) => lesson.title),
      quizTitles: module.content.quizzes.map((quiz) => quiz.title)
    }
  }
}
