import { Database } from 'sqlite3'
import { join } from 'path'
import { mkdirSync, existsSync, readFileSync } from 'fs'
import { app } from 'electron'
import * as bcrypt from 'bcrypt'
import type { User, Module, UserProgress, Certificate, ApiResponse, LessonProgress } from '../types'

// Database row interfaces
interface ModuleRow {
  id: number
  title: string
  description: string
  content: string
  version: string
  author: string
  difficulty_level: string
  tags: string | null
  estimated_duration: number
  created_at: string
  updated_at: string
}

class DatabaseManager {
  private db: Database | null = null
  private dbPath: string

  constructor() {
    // Use a more reliable path for the database
    try {
      const userDataPath = app.getPath('userData')
      const dbDir = join(userDataPath, 'database')

      // Create directory if it doesn't exist
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true })
      }

      this.dbPath = join(dbDir, 'lms.db')
    } catch {
      // Fallback for development or if app is not ready
      this.dbPath = join(__dirname, '../../data/lms.db')
      const dbDir = join(__dirname, '../../data')
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true })
      }
    }
  }

  // Utility method to promisify database operations
  private query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows as T[])
        }
      })
    })
  }

  private run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
        }
      })
    })
  }

  private get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row as T | undefined)
        }
      })
    })
  }

  async initialize(): Promise<void> {
    try {
      // Initialize database connection
      this.db = new Database(this.dbPath)

      // Read schema from external file
      // Use app.getAppPath() to get the correct path in both dev and production
      const appPath = app.getAppPath()
      const schemaPath = join(appPath, 'src/main/database/schema.sql')
      const schema = readFileSync(schemaPath, 'utf8')

      // Drop existing tables to ensure clean schema
      const dropStatements = [
        'DROP TABLE IF EXISTS certificates',
        'DROP TABLE IF EXISTS lesson_progress',
        'DROP TABLE IF EXISTS user_progress',
        'DROP TABLE IF EXISTS modules',
        'DROP TABLE IF EXISTS users'
      ]

      for (const dropStatement of dropStatements) {
        await this.run(dropStatement)
      }

      const statements = schema.split(';').filter((stmt) => stmt.trim())

      for (const statement of statements) {
        if (statement.trim()) {
          await this.run(statement)
        }
      }

      // Load sample module from JSON file
      await this.loadSampleModule()

      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<ApiResponse<User>> {
    try {
      // Check if user already exists
      const existingUser = await this.get<User>(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [userData.email, userData.username]
      )

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email or username already exists'
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password_hash, 10)

      // Insert user
      const result = await this.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [userData.username, userData.email, hashedPassword]
      )

      // Get the created user
      const newUser = await this.get<User>('SELECT * FROM users WHERE id = ?', [result.lastID])

      if (newUser) {
        // Remove password from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash: _password_hash, ...userWithoutPassword } = newUser
        return {
          success: true,
          data: userWithoutPassword as User
        }
      }

      return { success: false, error: 'Failed to retrieve created user' }
    } catch (error) {
      return { success: false, error: `Failed to create user: ${error}` }
    }
  }

  async authenticateUser(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.get<User>('SELECT * FROM users WHERE email = ?', [email])

      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash)

      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Remove password from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _password_hash, ...userWithoutPassword } = user
      return {
        success: true,
        data: userWithoutPassword as User
      }
    } catch (error) {
      return { success: false, error: `Authentication failed: ${error}` }
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.query<User>(
        'SELECT id, username, email, avatar, created_at FROM users'
      )
      return users
    } catch (error) {
      console.error('Failed to get all users:', error)
      return []
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await this.get<User>(
        'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
        [id]
      )
      return user || null
    } catch (error) {
      console.error('Failed to get user by id:', error)
      return null
    }
  }

  async createModule(
    moduleData: Omit<Module, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<Module>> {
    try {
      const result = await this.run(
        'INSERT INTO modules (title, description, content, version, author, difficulty_level, tags, estimated_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          moduleData.title,
          moduleData.description,
          JSON.stringify(moduleData.content),
          moduleData.version || '1.0',
          moduleData.author || 'Unknown',
          moduleData.difficulty_level || 'beginner',
          moduleData.tags ? JSON.stringify(moduleData.tags) : null,
          moduleData.content?.estimatedTime || 0
        ]
      )

      const newModule = await this.get<ModuleRow>('SELECT * FROM modules WHERE id = ?', [
        result.lastID
      ])

      if (newModule) {
        const module: Module = {
          ...newModule,
          content:
            typeof newModule.content === 'string'
              ? JSON.parse(newModule.content)
              : newModule.content,
          tags: newModule.tags ? JSON.parse(newModule.tags) : []
        }
        return { success: true, data: module }
      }

      return { success: false, error: 'Failed to retrieve created module' }
    } catch (error) {
      return { success: false, error: `Failed to create module: ${error}` }
    }
  }

  async getAllModules(): Promise<Module[]> {
    try {
      const modules = await this.query<ModuleRow>('SELECT * FROM modules')
      return modules.map((module) => {
        const content = module.content
          ? JSON.parse(module.content)
          : { lessons: [], quizzes: [], estimatedTime: 0 }
        const tags = module.tags ? JSON.parse(module.tags) : []

        return {
          ...module,
          content: content,
          tags: tags
        }
      })
    } catch (error) {
      console.error('Failed to get all modules:', error)
      return []
    }
  }

  async getModuleById(id: number): Promise<Module | null> {
    try {
      const module = await this.get<ModuleRow>('SELECT * FROM modules WHERE id = ?', [id])
      if (!module) return null

      const content = module.content
        ? JSON.parse(module.content)
        : { lessons: [], quizzes: [], estimatedTime: 0 }
      const tags = module.tags ? JSON.parse(module.tags) : []

      return {
        ...module,
        content: content,
        tags: tags
      }
    } catch (error) {
      console.error('Failed to get module by id:', error)
      return null
    }
  }

  async deleteModule(id: number): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.run('DELETE FROM modules WHERE id = ?', [id])

      if (result.changes > 0) {
        return { success: true, message: 'Module deleted successfully' }
      }

      return { success: false, error: 'Module not found' }
    } catch (error) {
      return { success: false, error: `Failed to delete module: ${error}` }
    }
  }

  async deleteAllModules(): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.run('DELETE FROM modules')
      return { success: true, message: `Deleted ${result.changes} modules` }
    } catch (error) {
      return { success: false, error: `Failed to delete all modules: ${error}` }
    }
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    try {
      const progress = await this.query<UserProgress>(
        'SELECT * FROM user_progress WHERE user_id = ?',
        [userId]
      )
      return progress
    } catch (error) {
      console.error('Failed to get user progress:', error)
      return []
    }
  }

  async getUserLessonProgress(userId: number): Promise<LessonProgress[]> {
    try {
      const lessonProgress = await this.query<LessonProgress>(
        'SELECT * FROM lesson_progress WHERE user_id = ?',
        [userId]
      )
      return lessonProgress
    } catch (error) {
      console.error('Failed to get user lesson progress:', error)
      return []
    }
  }

  async updateLessonProgress(progressData: {
    userId: number
    moduleId: number
    lessonId: string
    completed: boolean
    timeSpent: number
    quizScore?: number
  }): Promise<ApiResponse<LessonProgress>> {
    try {
      // Check if module progress exists (for setting started_at timestamp)
      const moduleProgress = await this.get<UserProgress>(
        'SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?',
        [progressData.userId, progressData.moduleId]
      )

      if (!moduleProgress) {
        // First time user interacts with this module - create module progress with started_at
        await this.run(
          'INSERT INTO user_progress (user_id, module_id, started_at, last_accessed) VALUES (?, ?, ?, ?)',
          [
            progressData.userId,
            progressData.moduleId,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        )
      } else {
        // Update last_accessed time
        await this.run(
          'UPDATE user_progress SET last_accessed = ? WHERE user_id = ? AND module_id = ?',
          [new Date().toISOString(), progressData.userId, progressData.moduleId]
        )
      }

      // Check if lesson progress record exists
      const existing = await this.get<LessonProgress>(
        'SELECT * FROM lesson_progress WHERE user_id = ? AND module_id = ? AND lesson_id = ?',
        [progressData.userId, progressData.moduleId, progressData.lessonId]
      )

      if (existing) {
        // Update existing record - ACCUMULATE time instead of overwriting
        const newTimeSpent = (existing.time_spent || 0) + progressData.timeSpent
        await this.run(
          'UPDATE lesson_progress SET completed = ?, time_spent = ?, quiz_score = ?, updated_at = CURRENT_TIMESTAMP, completed_at = ? WHERE user_id = ? AND module_id = ? AND lesson_id = ?',
          [
            progressData.completed,
            newTimeSpent,
            progressData.quizScore !== undefined ? progressData.quizScore : existing.quiz_score,
            progressData.completed ? new Date().toISOString() : existing.completed_at,
            progressData.userId,
            progressData.moduleId,
            progressData.lessonId
          ]
        )
      } else {
        // Create new record
        await this.run(
          'INSERT INTO lesson_progress (user_id, module_id, lesson_id, completed, time_spent, quiz_score, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            progressData.userId,
            progressData.moduleId,
            progressData.lessonId,
            progressData.completed,
            progressData.timeSpent,
            progressData.quizScore,
            progressData.completed ? new Date().toISOString() : null
          ]
        )
      }

      // Check if the module is now completed
      await this.updateModuleCompletionStatus(progressData.userId, progressData.moduleId)

      // Return the updated lesson progress record
      const updatedProgress = await this.get<LessonProgress>(
        'SELECT * FROM lesson_progress WHERE user_id = ? AND module_id = ? AND lesson_id = ?',
        [progressData.userId, progressData.moduleId, progressData.lessonId]
      )

      if (updatedProgress) {
        return { success: true, data: updatedProgress }
      } else {
        return { success: false, error: 'Failed to retrieve updated progress' }
      }
    } catch (error) {
      return { success: false, error: `Failed to update progress: ${error}` }
    }
  }

  async getModuleProgress(
    userId: number,
    moduleId: number
  ): Promise<{ moduleProgress: UserProgress | null; lessonProgress: LessonProgress[] }> {
    try {
      const moduleProgress = await this.get<UserProgress>(
        'SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?',
        [userId, moduleId]
      )
      const lessonProgress = await this.query<LessonProgress>(
        'SELECT * FROM lesson_progress WHERE user_id = ? AND module_id = ?',
        [userId, moduleId]
      )
      return { moduleProgress: moduleProgress || null, lessonProgress }
    } catch (error) {
      console.error('Failed to get module progress:', error)
      return { moduleProgress: null, lessonProgress: [] }
    }
  }

  async resetModuleProgress(userId: number, moduleId: number): Promise<ApiResponse<unknown>> {
    try {
      await this.run('DELETE FROM user_progress WHERE user_id = ? AND module_id = ?', [
        userId,
        moduleId
      ])
      const result = await this.run(
        'DELETE FROM lesson_progress WHERE user_id = ? AND module_id = ?',
        [userId, moduleId]
      )

      return { success: true, message: `Reset progress for ${result.changes} lessons` }
    } catch (error) {
      return { success: false, error: `Failed to reset progress: ${error}` }
    }
  }

  private async updateModuleCompletionStatus(userId: number, moduleId: number): Promise<void> {
    try {
      // Get the module to check total lessons and quizzes
      const module = await this.get<ModuleRow>('SELECT * FROM modules WHERE id = ?', [moduleId])
      if (!module) return

      const parsedContent = module.content
        ? JSON.parse(module.content)
        : { lessons: [], quizzes: [] }
      const totalLessons = parsedContent.lessons?.length || 0
      const totalQuizzes = parsedContent.quizzes?.length || 0
      const totalItems = totalLessons + totalQuizzes

      if (totalItems === 0) return

      // Get completed lessons count (lesson IDs like "lesson-1", "lesson-2", etc.)
      const completedLessonsResult = await this.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND module_id = ? AND completed = 1 AND lesson_id LIKE "lesson-%"',
        [userId, moduleId]
      )

      // Get completed quizzes count (quiz IDs like "quiz-1", "quiz-2", etc.)
      const completedQuizzesResult = await this.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND module_id = ? AND completed = 1 AND lesson_id LIKE "quiz-%" AND quiz_score IS NOT NULL',
        [userId, moduleId]
      )

      const completedLessons = completedLessonsResult[0]?.count || 0
      const completedQuizzes = completedQuizzesResult[0]?.count || 0
      const totalCompleted = completedLessons + completedQuizzes

      const progressPercentage = Math.round((totalCompleted / totalItems) * 100)
      const isCompleted = completedLessons >= totalLessons && completedQuizzes >= totalQuizzes

      // Get current module progress
      const currentProgress = await this.get<UserProgress>(
        'SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?',
        [userId, moduleId]
      )

      if (currentProgress) {
        // Update existing progress
        const wasAlreadyCompleted = currentProgress.completed
        const completionDate =
          isCompleted && !wasAlreadyCompleted
            ? new Date().toISOString()
            : currentProgress.completion_date

        await this.run(
          'UPDATE user_progress SET progress_percentage = ?, completed = ?, completion_date = ? WHERE user_id = ? AND module_id = ?',
          [progressPercentage, isCompleted, completionDate, userId, moduleId]
        )
      }
    } catch (error) {
      console.error('Failed to update module completion status:', error)
    }
  }

  async generateCertificate(userId: number, moduleId: number): Promise<ApiResponse<Certificate>> {
    try {
      // Check if user has completed the module
      const lessonProgress = await this.query<LessonProgress>(
        'SELECT * FROM lesson_progress WHERE user_id = ? AND module_id = ? AND completed = 1',
        [userId, moduleId]
      )

      const module = await this.get<ModuleRow>('SELECT * FROM modules WHERE id = ?', [moduleId])
      const user = await this.get<User>('SELECT * FROM users WHERE id = ?', [userId])

      if (!module || !user) {
        return { success: false, error: 'Module or user not found' }
      }

      // Parse module content to get lessons
      const parsedContent = module.content
        ? JSON.parse(module.content)
        : { lessons: [], quizzes: [] }
      const lessons = parsedContent.lessons || []

      if (lessonProgress.length < lessons.length * 0.8) {
        return { success: false, error: 'Module not sufficiently completed' }
      }

      // Generate certificate code
      const certificateCode = `CERT-${Date.now()}-${userId}-${moduleId}`

      // Create certificate data
      const certificateData = {
        user: user.username,
        module: module.title,
        completionDate: new Date().toISOString(),
        timeSpent: lessonProgress.reduce((total, p) => total + (p.time_spent || 0), 0)
      }

      const result = await this.run(
        'INSERT INTO certificates (user_id, module_id, certificate_code, certificate_data) VALUES (?, ?, ?, ?)',
        [userId, moduleId, certificateCode, JSON.stringify(certificateData)]
      )

      const newCertificate = await this.get<Certificate>(
        'SELECT * FROM certificates WHERE id = ?',
        [result.lastID]
      )

      if (newCertificate) {
        return { success: true, data: newCertificate }
      }

      return { success: false, error: 'Failed to retrieve generated certificate' }
    } catch (error) {
      return { success: false, error: `Failed to generate certificate: ${error}` }
    }
  }

  async getUserCertificates(userId: number): Promise<Certificate[]> {
    try {
      const certificates = await this.query<Certificate>(
        'SELECT * FROM certificates WHERE user_id = ?',
        [userId]
      )
      return certificates
    } catch (error) {
      console.error('Failed to get user certificates:', error)
      return []
    }
  }

  async verifyCertificate(code: string): Promise<Certificate | null> {
    try {
      const certificate = await this.get<Certificate>(
        'SELECT * FROM certificates WHERE certificate_code = ?',
        [code]
      )
      return certificate || null
    } catch (error) {
      console.error('Failed to verify certificate:', error)
      return null
    }
  }

  private async loadSampleModule(): Promise<void> {
    try {
      console.log('Attempting to load sample module...')

      // Try multiple possible paths for the sample module
      const appPath = app.getAppPath()
      const possiblePaths = [
        join(appPath, 'src/renderer/src/data/sample-module.json'),
        join(appPath, 'dist/renderer/src/data/sample-module.json'),
        join(__dirname, '../../renderer/src/data/sample-module.json'),
        join(__dirname, '../../../src/renderer/src/data/sample-module.json'),
        join(process.cwd(), 'src/renderer/src/data/sample-module.json')
      ]

      let sampleModuleData: string | null = null

      // Try each path until we find one that works
      for (const path of possiblePaths) {
        console.log(`Trying path: ${path}`)
        if (existsSync(path)) {
          console.log(`Found sample module at: ${path}`)
          try {
            sampleModuleData = readFileSync(path, 'utf8')
            break
          } catch (readError) {
            console.warn(`Could not read file at ${path}:`, readError)
            continue
          }
        }
      }

      if (!sampleModuleData) {
        console.warn('Could not find sample module file at any expected location')
        console.log('Expected locations:', possiblePaths)
        return
      }

      console.log('Successfully read sample module file')
      const sampleModule = JSON.parse(sampleModuleData)

      // Validate the module structure
      if (!sampleModule.title || !sampleModule.description || !sampleModule.content) {
        console.error('Invalid sample module structure - missing required fields')
        return
      }

      if (!sampleModule.content.lessons || !Array.isArray(sampleModule.content.lessons)) {
        console.error('Invalid sample module structure - missing or invalid lessons array')
        return
      }

      console.log(
        `Sample module contains ${sampleModule.content.lessons.length} lessons and ${sampleModule.content.quizzes?.length || 0} quizzes`
      )

      // Create the sample module in the database
      const result = await this.createModule({
        title: sampleModule.title,
        description: sampleModule.description,
        content: sampleModule.content,
        version: sampleModule.version || '1.0',
        author: sampleModule.author || 'OurAfrica University',
        difficulty_level: sampleModule.difficulty_level || 'beginner',
        tags: sampleModule.tags || ['computer-science', 'programming', 'algorithms']
      })

      if (result.success) {
        console.log('Sample module loaded successfully with ID:', result.data?.id)
      } else {
        console.error('Failed to create sample module in database:', result.error)
      }
    } catch (moduleError) {
      console.error('Failed to load sample module:', moduleError)
      if (moduleError instanceof SyntaxError) {
        console.error('Sample module JSON is malformed')
      }
    }
  }

  close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err)
        } else {
          console.log('Database connection closed')
        }
      })
    }
  }
}

export const database = new DatabaseManager()
