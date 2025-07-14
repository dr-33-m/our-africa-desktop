import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { database } from './database/database'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Setup IPC handlers
function setupIpcHandlers(): void {
  // Auth handlers
  ipcMain.handle('auth:register', async (_, data) => {
    try {
      const result = await database.createUser({
        username: data.username,
        email: data.email,
        password_hash: data.password
      })

      if (result.success && result.data) {
        return {
          success: true,
          data: {
            user: result.data,
            token: 'local-session' // Simple token for offline app
          }
        }
      }
      return result
    } catch {
      return { success: false, error: 'Registration failed' }
    }
  })

  ipcMain.handle('auth:login', async (_, data) => {
    try {
      const result = await database.authenticateUser(data.email, data.password)

      if (result.success && result.data) {
        return {
          success: true,
          data: {
            user: result.data,
            token: 'local-session'
          }
        }
      }
      return result
    } catch {
      return { success: false, error: 'Login failed' }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    return { success: true, message: 'Logged out successfully' }
  })

  ipcMain.handle('auth:get-current-user', async () => {
    // In a real app, this would get from session storage
    return { success: false, error: 'No active session' }
  })

  // User handlers
  ipcMain.handle('user:get-all', async () => {
    try {
      const users = await database.getAllUsers()
      return { success: true, data: users }
    } catch {
      return { success: false, error: 'Failed to get users' }
    }
  })

  ipcMain.handle('user:switch', async (_, userId) => {
    try {
      const user = await database.getUserById(userId)
      if (user) {
        return {
          success: true,
          data: {
            user,
            token: 'local-session'
          }
        }
      }
      return { success: false, error: 'User not found' }
    } catch {
      return { success: false, error: 'Failed to switch user' }
    }
  })

  // Module handlers
  ipcMain.handle('modules:get-all', async () => {
    try {
      const modules = await database.getAllModules()
      return { success: true, data: modules }
    } catch {
      return { success: false, error: 'Failed to get modules' }
    }
  })

  ipcMain.handle('modules:get-by-id', async (_, id) => {
    try {
      const module = await database.getModuleById(id)
      if (module) {
        return { success: true, data: module }
      }
      return { success: false, error: 'Module not found' }
    } catch {
      return { success: false, error: 'Failed to get module' }
    }
  })

  ipcMain.handle('modules:import', async () => {
    // TODO: Implement module import from file
    return { success: false, error: 'Module import not implemented yet' }
  })

  ipcMain.handle('modules:delete', async (_, id) => {
    try {
      return await database.deleteModule(id)
    } catch {
      return { success: false, error: 'Failed to delete module' }
    }
  })

  ipcMain.handle('modules:create', async (_, moduleData) => {
    try {
      const result = await database.createModule(moduleData)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create module'
      return { success: false, error: message }
    }
  })

  // Progress handlers
  ipcMain.handle('progress:get-user-progress', async (_, userId) => {
    try {
      const progress = await database.getUserProgress(userId)
      return { success: true, data: progress }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user progress'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('progress:get-user-lesson-progress', async (_, userId) => {
    try {
      const lessonProgress = await database.getUserLessonProgress(userId)
      return { success: true, data: lessonProgress }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user lesson progress'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('progress:update-lesson', async (_, data) => {
    try {
      return await database.updateLessonProgress(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update lesson progress'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('progress:get-module-progress', async (_, userId, moduleId) => {
    try {
      const progress = await database.getModuleProgress(userId, moduleId)
      return { success: true, data: progress }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get module progress'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('progress:reset-module', async (_, userId, moduleId) => {
    try {
      return await database.resetModuleProgress(userId, moduleId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset module progress'
      return { success: false, error: message }
    }
  })

  // Certificate handlers
  ipcMain.handle('certificates:generate', async (_, userId, moduleId) => {
    try {
      return await database.generateCertificate(userId, moduleId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate certificate'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('certificates:get-user-certificates', async (_, userId) => {
    try {
      const certificates = await database.getUserCertificates(userId)
      return { success: true, data: certificates }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get certificates'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('certificates:export', async () => {
    // TODO: Implement PDF export
    return { success: false, error: 'Certificate export not implemented yet' }
  })

  ipcMain.handle('certificates:verify', async (_, code) => {
    try {
      const certificate = await database.verifyCertificate(code)
      if (certificate) {
        return { success: true, data: certificate }
      }
      return { success: false, error: 'Certificate not found' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify certificate'
      return { success: false, error: message }
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize database
  try {
    await database.initialize()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    app.quit()
    return
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.ourafrica.lms')

  // Setup IPC handlers
  setupIpcHandlers()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    database.close()
    app.quit()
  }
})

// Clean up database connection on app quit
app.on('before-quit', () => {
  database.close()
})
