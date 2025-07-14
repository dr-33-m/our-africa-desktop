import { ElectronAPI } from '@electron-toolkit/preload'

// API types for the LMS functionality
interface LMSApi {
  auth: {
    register: (data: { username: string; email: string; password: string }) => Promise<unknown>
    login: (data: { email: string; password: string }) => Promise<unknown>
    logout: () => Promise<unknown>
    getCurrentUser: () => Promise<unknown>
  }
  users: {
    getAll: () => Promise<unknown>
    switch: (userId: number) => Promise<unknown>
  }
  modules: {
    getAll: () => Promise<unknown>
    getById: (id: number) => Promise<unknown>
    import: () => Promise<unknown>
    delete: (id: number) => Promise<unknown>
  }
  progress: {
    getUserProgress: (userId: number) => Promise<unknown>
    updateLesson: (data: {
      userId: number
      moduleId: number
      lessonId: string
      completed: boolean
      timeSpent: number
    }) => Promise<unknown>
    getModuleProgress: (userId: number, moduleId: number) => Promise<unknown>
    resetModule: (userId: number, moduleId: number) => Promise<unknown>
  }
  certificates: {
    generate: (userId: number, moduleId: number) => Promise<unknown>
    getUserCertificates: (userId: number) => Promise<unknown>
    export: (certificateId: number) => Promise<unknown>
    verify: (code: string) => Promise<unknown>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: LMSApi
  }
}
