// User types
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  created_at: string
}

export interface UserSession {
  user: User
  token: string
}

// Module types
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

// Progress types
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
  lessonId: string
  completed: boolean
  timeSpent: number
}

export interface LessonProgressData {
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
  moduleId: number
  lessonsCompleted: number
  totalLessons: number
  quizzesCompleted: number
  totalQuizzes: number
  totalTimeSpent: number
  percentComplete: number
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

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// Component prop types
export interface ModuleCardProps {
  module: Module
  progress?: ModuleProgress
  onClick: (moduleId: number) => void
}

export interface LessonProps {
  lesson: Lesson
  moduleId: number
  onComplete: () => void
  onNext: () => void
  onPrevious: () => void
  isCompleted: boolean
}

export interface QuizProps {
  quiz: Quiz
  moduleId: number
  onComplete: (score: number) => void
}

// Database types for main process
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

export interface DatabaseProgress {
  id?: number
  user_id: number
  module_id: number
  lesson_id: string
  completed: boolean
  score?: number
  time_spent: number
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseCertificate {
  id?: number
  user_id: number
  module_id: number
  certificate_code: string
  generated_at?: string
}

// IPC Channel types
export type IpcChannels = {
  // Auth channels
  'auth:register': (data: RegisterForm) => Promise<ApiResponse<UserSession>>
  'auth:login': (data: LoginForm) => Promise<ApiResponse<UserSession>>
  'auth:logout': () => Promise<ApiResponse>
  'auth:get-current-user': () => Promise<ApiResponse<User>>

  // User channels
  'user:get-all': () => Promise<ApiResponse<User[]>>
  'user:switch': (userId: number) => Promise<ApiResponse<UserSession>>

  // Module channels
  'modules:get-all': () => Promise<ApiResponse<Module[]>>
  'modules:get-by-id': (id: number) => Promise<ApiResponse<Module>>
  'modules:create': (
    moduleData: Omit<Module, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<ApiResponse<Module>>
  'modules:import': () => Promise<ApiResponse<Module>>
  'modules:delete': (id: number) => Promise<ApiResponse>

  // Progress channels
  'progress:get-user-progress': (userId: number) => Promise<ApiResponse<UserProgress[]>>
  'progress:get-user-lesson-progress': (
    userId: number
  ) => Promise<ApiResponse<LessonProgressData[]>>
  'progress:update-lesson': (data: {
    userId: number
    moduleId: number
    lessonId: string
    completed: boolean
    timeSpent: number
    quizScore?: number
  }) => Promise<ApiResponse<LessonProgressData>>
  'progress:get-module-progress': (
    userId: number,
    moduleId: number
  ) => Promise<
    ApiResponse<{ moduleProgress: UserProgress | null; lessonProgress: LessonProgressData[] }>
  >
  'progress:reset-module': (userId: number, moduleId: number) => Promise<ApiResponse>

  // Certificate channels
  'certificates:generate': (userId: number, moduleId: number) => Promise<ApiResponse<Certificate>>
  'certificates:get-user-certificates': (userId: number) => Promise<ApiResponse<Certificate[]>>
  'certificates:export': (certificateId: number) => Promise<ApiResponse<string>> // returns file path
  'certificates:verify': (code: string) => Promise<ApiResponse<Certificate>>
}

// Utility types
export type ModuleDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type QuestionType = Question['type']
export type ContentBlockType = ContentBlock['type']
