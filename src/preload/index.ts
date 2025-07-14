import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Auth APIs
  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      ipcRenderer.invoke('auth:register', data),
    login: (data: { email: string; password: string }) => ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:get-current-user')
  },

  // User APIs
  users: {
    getAll: () => ipcRenderer.invoke('user:get-all'),
    switch: (userId: number) => ipcRenderer.invoke('user:switch', userId)
  },

  // Module APIs
  modules: {
    getAll: () => ipcRenderer.invoke('modules:get-all'),
    getById: (id: number) => ipcRenderer.invoke('modules:get-by-id', id),
    import: () => ipcRenderer.invoke('modules:import'),
    delete: (id: number) => ipcRenderer.invoke('modules:delete', id)
  },

  // Progress APIs
  progress: {
    getUserProgress: (userId: number) => ipcRenderer.invoke('progress:get-user-progress', userId),
    updateLesson: (data: {
      userId: number
      moduleId: number
      lessonId: string
      completed: boolean
      timeSpent: number
      quizScore?: number
    }) => ipcRenderer.invoke('progress:update-lesson', data),
    getModuleProgress: (userId: number, moduleId: number) =>
      ipcRenderer.invoke('progress:get-module-progress', userId, moduleId),
    resetModule: (userId: number, moduleId: number) =>
      ipcRenderer.invoke('progress:reset-module', userId, moduleId)
  },

  // Certificate APIs
  certificates: {
    generate: (userId: number, moduleId: number) =>
      ipcRenderer.invoke('certificates:generate', userId, moduleId),
    getUserCertificates: (userId: number) =>
      ipcRenderer.invoke('certificates:get-user-certificates', userId),
    export: (certificateId: number) => ipcRenderer.invoke('certificates:export', certificateId),
    verify: (code: string) => ipcRenderer.invoke('certificates:verify', code)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
