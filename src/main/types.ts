// Re-export types for main process use
export interface DatabaseUser {
  id?: number
  username: string
  email: string
  password_hash: string
  avatar?: string
  created_at?: string
}

export interface DatabaseModule {
  id?: number
  title: string
  description: string
  difficulty: string
  duration: number
  content: string // JSON stringified
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  avatar?: string
  created_at: string
}

export interface Module {
  id: number
  title: string
  description: string
  content: ModuleContent
  version: string
  author?: string
  difficulty_level?: string
  tags?: string[]
  estimated_duration?: number
  created_at: string
  updated_at: string
}

export interface ModuleContent {
  lessons: Lesson[]
  quizzes: Quiz[]
  estimatedTime: number
}

// Content block types for rich lessons
export interface ContentBlock {
  type: 'text' | 'image' | 'video' | 'code'
  content?: string
  src?: string
  alt?: string
  title?: string
  language?: string
}

export interface Lesson {
  id: string
  title: string
  content: ContentBlock[] // Rich content blocks
  order: number
  duration?: number // in minutes (optional)
}

export interface Quiz {
  id: string
  title: string
  description?: string
  afterLessonId?: string
  questions: Question[]
  passingScore: number // percentage
}

export interface Question {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'text'
  options?: string[]
  correctAnswer: string | number
  explanation?: string
}

export interface UserProgress {
  id: number
  user_id: number
  module_id: number
  progress_percentage: number
  completed: boolean
  started_at: string | null
  completion_date: string | null
  total_time_spent: number
  last_accessed: string
}

export interface LessonProgress {
  id: number
  user_id: number
  module_id: number
  lesson_id: string
  completed: boolean
  time_spent: number
  quiz_score: number | null
  quiz_attempts: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ModuleProgress {
  module_id: number
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
  total_time_spent: number
  last_accessed: string
  is_completed: boolean
  quiz_score?: number
}

export interface Certificate {
  id: number
  user_id: number
  module_id: number
  certificate_code: string
  generated_at: string
  module_title: string
  user_name: string
  completion_date: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Database result types
export interface DbQueryResult {
  lastInsertRowid: number
  changes: number
}

export interface DbProgressRow {
  module_id: number
  title: string
  content: string
  completed_lessons: number
  total_time_spent: number
  last_accessed: string
  avg_score?: number
}

export interface DbCertificateRow {
  id: number
  user_id: number
  module_id: number
  certificate_code: string
  generated_at: string
  username: string
  module_title: string
}
