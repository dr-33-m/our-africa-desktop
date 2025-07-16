import { Module, ModuleContent, Lesson, Quiz, ContentBlock } from '../types'

export interface ModuleValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Type for raw module data that might come from external sources
export interface RawModuleData {
  title?: unknown
  description?: unknown
  content?: unknown
  version?: unknown
  [key: string]: unknown
}

export interface RawModuleContent {
  lessons?: unknown
  quizzes?: unknown
  estimatedTime?: unknown
  [key: string]: unknown
}

export interface RawLesson {
  id?: unknown
  title?: unknown
  order?: unknown
  content?: unknown
  [key: string]: unknown
}

export interface RawLessonContent {
  type?: unknown
  content?: unknown
  src?: unknown
  alt?: unknown
  title?: unknown
  language?: unknown
  [key: string]: unknown
}

export interface RawQuiz {
  id?: unknown
  title?: unknown
  description?: unknown
  passingScore?: unknown
  afterLessonId?: unknown
  questions?: unknown
  [key: string]: unknown
}

export interface RawQuestion {
  id?: unknown
  question?: unknown
  options?: unknown
  correctAnswer?: unknown
  [key: string]: unknown
}

export class ModuleValidator {
  static validate(data: RawModuleData | null | undefined): ModuleValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if data exists
    if (!data) {
      errors.push('Module data is required')
      return { isValid: false, errors, warnings }
    }

    // Validate required top-level fields
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Module title is required and must be a string')
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Module description is required and must be a string')
    }

    if (!data.content || typeof data.content !== 'object') {
      errors.push('Module content is required and must be an object')
      return { isValid: false, errors, warnings }
    }

    // Validate content structure
    this.validateContent(data.content as RawModuleContent, errors, warnings)

    // Validate version if provided
    if (data.version && typeof data.version !== 'string') {
      warnings.push('Module version should be a string')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static validateContent(
    content: RawModuleContent,
    errors: string[],
    warnings: string[]
  ): void {
    // Validate lessons
    if (!content.lessons || !Array.isArray(content.lessons)) {
      errors.push('Content must include a lessons array')
      return
    }

    if (content.lessons.length === 0) {
      errors.push('Module must contain at least one lesson')
    }

    content.lessons.forEach((lesson: unknown, index: number) => {
      this.validateLesson(lesson as RawLesson, index, errors, warnings)
    })

    // Validate quizzes
    if (!content.quizzes || !Array.isArray(content.quizzes)) {
      warnings.push('Content should include a quizzes array')
    } else {
      content.quizzes.forEach((quiz: unknown, index: number) => {
        this.validateQuiz(quiz as RawQuiz, index, errors, warnings)
      })
    }

    // Validate estimated time
    if (content.estimatedTime && typeof content.estimatedTime !== 'number') {
      warnings.push('Estimated time should be a number (minutes)')
    }
  }

  private static validateLesson(
    lesson: RawLesson,
    index: number,
    errors: string[],
    warnings: string[]
  ): void {
    const prefix = `Lesson ${index + 1}`

    if (!lesson.id || typeof lesson.id !== 'string') {
      errors.push(`${prefix}: ID is required and must be a string`)
    }

    if (!lesson.title || typeof lesson.title !== 'string') {
      errors.push(`${prefix}: Title is required and must be a string`)
    }

    if (typeof lesson.order !== 'number') {
      errors.push(`${prefix}: Order is required and must be a number`)
    }

    if (!lesson.content || !Array.isArray(lesson.content)) {
      errors.push(`${prefix}: Content is required and must be an array`)
      return
    }

    if (lesson.content.length === 0) {
      warnings.push(`${prefix}: Has no content items`)
    }

    lesson.content.forEach((item: unknown, itemIndex: number) => {
      this.validateLessonContent(item as RawLessonContent, index, itemIndex, errors, warnings)
    })
  }

  private static validateLessonContent(
    item: RawLessonContent,
    lessonIndex: number,
    itemIndex: number,
    errors: string[],
    warnings: string[]
  ): void {
    const prefix = `Lesson ${lessonIndex + 1}, Content ${itemIndex + 1}`

    if (!item.type || typeof item.type !== 'string') {
      errors.push(`${prefix}: Type is required and must be a string`)
      return
    }

    const validTypes = ['text', 'image', 'video', 'code']
    if (!validTypes.includes(item.type)) {
      errors.push(`${prefix}: Type must be one of: ${validTypes.join(', ')}`)
      return
    }

    switch (item.type) {
      case 'text':
        if (!item.content || typeof item.content !== 'string') {
          errors.push(`${prefix}: Text content is required and must be a string`)
        }
        break

      case 'image':
        if (!item.src || typeof item.src !== 'string') {
          errors.push(`${prefix}: Image src is required and must be a string`)
        }
        if (!item.alt || typeof item.alt !== 'string') {
          warnings.push(`${prefix}: Image alt text is recommended for accessibility`)
        }
        break

      case 'video':
        if (!item.src || typeof item.src !== 'string') {
          errors.push(`${prefix}: Video src is required and must be a string`)
        }
        if (!item.title || typeof item.title !== 'string') {
          warnings.push(`${prefix}: Video title is recommended`)
        }
        break

      case 'code':
        if (!item.content || typeof item.content !== 'string') {
          errors.push(`${prefix}: Code content is required and must be a string`)
        }
        if (!item.language || typeof item.language !== 'string') {
          warnings.push(`${prefix}: Code language is recommended for syntax highlighting`)
        }
        break
    }
  }

  private static validateQuiz(
    quiz: RawQuiz,
    index: number,
    errors: string[],
    warnings: string[]
  ): void {
    const prefix = `Quiz ${index + 1}`

    if (!quiz.id || typeof quiz.id !== 'string') {
      errors.push(`${prefix}: ID is required and must be a string`)
    }

    if (!quiz.title || typeof quiz.title !== 'string') {
      errors.push(`${prefix}: Title is required and must be a string`)
    }

    if (!quiz.description || typeof quiz.description !== 'string') {
      warnings.push(`${prefix}: Description is recommended`)
    }

    if (typeof quiz.passingScore !== 'number' || quiz.passingScore < 0 || quiz.passingScore > 100) {
      errors.push(`${prefix}: Passing score must be a number between 0 and 100`)
    }

    if (!quiz.afterLessonId || typeof quiz.afterLessonId !== 'string') {
      warnings.push(`${prefix}: afterLessonId is recommended to specify when quiz appears`)
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      errors.push(`${prefix}: Questions array is required`)
      return
    }

    if (quiz.questions.length === 0) {
      errors.push(`${prefix}: Must contain at least one question`)
    }

    quiz.questions.forEach((question: unknown, qIndex: number) => {
      this.validateQuestion(question as RawQuestion, index, qIndex, errors)
    })
  }

  private static validateQuestion(
    question: RawQuestion,
    quizIndex: number,
    questionIndex: number,
    errors: string[]
  ): void {
    const prefix = `Quiz ${quizIndex + 1}, Question ${questionIndex + 1}`

    if (!question.id || typeof question.id !== 'string') {
      errors.push(`${prefix}: ID is required and must be a string`)
    }

    if (!question.question || typeof question.question !== 'string') {
      errors.push(`${prefix}: Question text is required and must be a string`)
    }

    if (!question.options || !Array.isArray(question.options)) {
      errors.push(`${prefix}: Options array is required`)
      return
    }

    if (question.options.length < 2) {
      errors.push(`${prefix}: Must have at least 2 options`)
    }

    if (question.options.some((option: unknown) => typeof option !== 'string')) {
      errors.push(`${prefix}: All options must be strings`)
    }

    if (typeof question.correctAnswer !== 'number') {
      errors.push(`${prefix}: Correct answer must be a number (option index)`)
    } else if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
      errors.push(`${prefix}: Correct answer index is out of range`)
    }
  }

  static sanitizeModule(data: RawModuleData): Module {
    // Create a new module with sanitized content
    const sanitizedModule: Module = {
      id: typeof data.id === 'number' ? data.id : Date.now(), // Use provided ID or generate new one
      title: this.sanitizeString(data.title as string),
      description: this.sanitizeString(data.description as string),
      content: this.sanitizeContent(data.content as RawModuleContent),
      version: (data.version as string) || '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return sanitizedModule
  }

  private static sanitizeString(str: unknown): string {
    if (typeof str !== 'string') return ''

    // Basic HTML/script tag removal
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  private static sanitizeContent(content: RawModuleContent): ModuleContent {
    const lessons = Array.isArray(content.lessons) ? content.lessons : []
    const quizzes = Array.isArray(content.quizzes) ? content.quizzes : []

    return {
      lessons: lessons.map((lesson: unknown) => this.sanitizeLesson(lesson as RawLesson)),
      quizzes: quizzes.map((quiz: unknown) => this.sanitizeQuiz(quiz as RawQuiz)),
      estimatedTime: typeof content.estimatedTime === 'number' ? content.estimatedTime : 60
    }
  }

  private static sanitizeLesson(lesson: RawLesson): Lesson {
    const content = Array.isArray(lesson.content) ? lesson.content : []

    return {
      id: lesson.id as string,
      title: this.sanitizeString(lesson.title),
      order: lesson.order as number,
      content: content.map((item: unknown) => this.sanitizeLessonContent(item as RawLessonContent))
    }
  }

  private static sanitizeLessonContent(item: RawLessonContent): ContentBlock {
    const type = item.type as string

    switch (type) {
      case 'text':
        return {
          type: 'text',
          content: this.sanitizeString(item.content)
        }

      case 'image':
        return {
          type: 'image',
          src: this.sanitizeString(item.src),
          alt: this.sanitizeString(item.alt)
        }

      case 'video':
        return {
          type: 'video',
          src: this.sanitizeString(item.src),
          title: this.sanitizeString(item.title)
        }

      case 'code':
        return {
          type: 'code',
          language: this.sanitizeString(item.language),
          content: this.sanitizeString(item.content)
        }

      default:
        // Fallback to text type for unknown types
        return {
          type: 'text',
          content: this.sanitizeString(item.content) || 'Invalid content type'
        }
    }
  }

  private static sanitizeQuiz(quiz: RawQuiz): Quiz {
    const questions = Array.isArray(quiz.questions) ? quiz.questions : []

    return {
      id: quiz.id as string,
      title: this.sanitizeString(quiz.title),
      description: this.sanitizeString(quiz.description) || '',
      passingScore: quiz.passingScore as number,
      afterLessonId: quiz.afterLessonId as string,
      questions: questions.map((q: unknown) => {
        const question = q as RawQuestion
        const options = Array.isArray(question.options) ? question.options : []

        return {
          id: question.id as string,
          question: this.sanitizeString(question.question),
          type: 'multiple-choice', // Default to multiple-choice since we have options
          options: options.map((opt: unknown) => this.sanitizeString(opt)),
          correctAnswer:
            typeof question.correctAnswer === 'number'
              ? question.correctAnswer
              : parseInt(question.correctAnswer as string) || 0
        }
      })
    }
  }
}
