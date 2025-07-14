// Electron IPC-based API client for desktop LMS
import type {
  User,
  Module,
  UserProgress,
  Certificate,
  LessonProgressData,
  IpcChannels
} from '../types'

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
  message?: string
}

class ElectronApiClient {
  private electronAPI: typeof window.electron.ipcRenderer

  constructor() {
    // Access the Electron API through the preload script
    this.electronAPI = window.electron.ipcRenderer

    if (!this.electronAPI) {
      console.error('Electron API not available!')
    }

    console.log('🔧 Electron API Client initialized for OFFLINE MODE')
  }

  private async invoke<T>(channel: keyof IpcChannels, ...args: unknown[]): Promise<ApiResponse<T>> {
    try {
      const result = await this.electronAPI.invoke(channel, ...args)
      return result as ApiResponse<T>
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IPC communication error'
      }
    }
  }

  private setToken(token: string): void {
    // Store auth token in localStorage for session management
    localStorage.setItem('auth-storage', JSON.stringify({ token }))
  }

  private removeToken(): void {
    localStorage.removeItem('auth-storage')
  }

  // Authentication methods
  async register(userData: {
    username: string
    email: string
    password: string
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.invoke<{ user: User; token: string }>('auth:register', userData)

    if (result.success && result.data?.token) {
      this.setToken(result.data.token)
    }

    return result
  }

  async login(credentials: {
    email: string
    password: string
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.invoke<{ user: User; token: string }>('auth:login', credentials)

    if (result.success && result.data?.token) {
      this.setToken(result.data.token)
    }

    return result
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.invoke<User>('auth:get-current-user')
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const result = await this.invoke<{ message: string }>('auth:logout')
    this.removeToken()
    return result
  }

  // User management methods
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.invoke<User[]>('user:get-all')
  }

  async switchUser(userId: number): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.invoke<{ user: User; token: string }>('user:switch', userId)

    if (result.success && result.data?.token) {
      this.setToken(result.data.token)
    }

    return result
  }

  // Module methods
  async getModules(): Promise<ApiResponse<Module[]>> {
    return this.invoke<Module[]>('modules:get-all')
  }

  async getModule(id: number): Promise<ApiResponse<Module>> {
    return this.invoke<Module>('modules:get-by-id', id)
  }

  async importModule(): Promise<ApiResponse<Module>> {
    return this.invoke<Module>('modules:import')
  }

  async deleteModule(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.invoke<{ message: string }>('modules:delete', id)
  }

  async createModule(
    moduleData: Omit<Module, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<Module>> {
    return this.invoke<Module>('modules:create', moduleData)
  }

  // Progress methods
  async getUserProgress(userId: number): Promise<ApiResponse<UserProgress[]>> {
    return this.invoke<UserProgress[]>('progress:get-user-progress', userId)
  }

  async getUserLessonProgress(userId: number): Promise<ApiResponse<LessonProgressData[]>> {
    return this.invoke<LessonProgressData[]>('progress:get-user-lesson-progress', userId)
  }

  async getModuleProgress(
    userId: number,
    moduleId: number
  ): Promise<
    ApiResponse<{ moduleProgress: UserProgress | null; lessonProgress: LessonProgressData[] }>
  > {
    return this.invoke('progress:get-module-progress', userId, moduleId)
  }

  async updateLessonProgress(data: {
    userId: number
    moduleId: number
    lessonId: string
    completed: boolean
    timeSpent: number
    quizScore?: number
  }): Promise<ApiResponse<LessonProgressData>> {
    return this.invoke<LessonProgressData>('progress:update-lesson', data)
  }

  async resetModuleProgress(
    userId: number,
    moduleId: number
  ): Promise<ApiResponse<{ message: string }>> {
    return this.invoke<{ message: string }>('progress:reset-module', userId, moduleId)
  }

  // Certificate methods
  async generateCertificate(userId: number, moduleId: number): Promise<ApiResponse<Certificate>> {
    return this.invoke<Certificate>('certificates:generate', userId, moduleId)
  }

  async getUserCertificates(userId: number): Promise<ApiResponse<Certificate[]>> {
    return this.invoke<Certificate[]>('certificates:get-user-certificates', userId)
  }

  async exportCertificate(certificateId: number): Promise<ApiResponse<{ filePath: string }>> {
    return this.invoke<{ filePath: string }>('certificates:export', certificateId)
  }

  async verifyCertificate(certificateCode: string): Promise<ApiResponse<Certificate>> {
    return this.invoke<Certificate>('certificates:verify', certificateCode)
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth-storage')
  }

  getEnvironment(): 'electron' {
    return 'electron'
  }

  // Health check for Electron environment
  async healthCheck(): Promise<
    ApiResponse<{
      status: string
      message: string
      timestamp: string
      environment: string
    }>
  > {
    return {
      success: true,
      data: {
        status: 'ok',
        message: 'Electron IPC communication working',
        timestamp: new Date().toISOString(),
        environment: 'electron-desktop'
      }
    }
  }
}

// Export singleton instance
export const apiClient = new ElectronApiClient()
export default apiClient
