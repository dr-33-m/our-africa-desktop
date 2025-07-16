import React, { useState } from 'react'
import { Upload, AlertCircle, CheckCircle, Clock, BookOpen, Lock } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import FileUpload from '../ui/FileUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { ModuleLoaderService, ModuleLoadResult } from '../../services/moduleLoader'
import { Module } from '../../types'
import { formatTime } from '../../lib/utils'

interface ModuleLoaderProps {
  isOpen: boolean
  onClose: () => void
  onModuleLoaded: (module: Module) => void
  existingModules: Module[]
}

type LoadingState = 'idle' | 'loading' | 'validating' | 'success' | 'error'
type LoadMethod = 'url' | 'file'

const ModuleLoader: React.FC<ModuleLoaderProps> = ({
  isOpen,
  onClose,
  onModuleLoaded,
  existingModules
}) => {
  const [activeTab, setActiveTab] = useState<LoadMethod>('file')
  const [url, setUrl] = useState('')
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [loadResult, setLoadResult] = useState<ModuleLoadResult | null>(null)
  const [loadedModule, setLoadedModule] = useState<Module | null>(null)

  const resetState = () => {
    setUrl('')
    setLoadingState('idle')
    setLoadResult(null)
    setLoadedModule(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleLoadFromUrl = async () => {
    if (!url.trim()) return

    setLoadingState('loading')
    try {
      const result = await ModuleLoaderService.loadFromUrl(url.trim())
      setLoadResult(result)

      if (result.success && result.module) {
        setLoadedModule(result.module)
        setLoadingState('success')
      } else {
        setLoadingState('error')
      }
    } catch (error) {
      setLoadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load module'
      })
      setLoadingState('error')
    }
  }

  const handleLoadFromFile = async (file: File) => {
    setLoadingState('loading')

    try {
      const result = await ModuleLoaderService.loadFromFile(file)
      setLoadResult(result)

      if (result.success && result.module) {
        setLoadedModule(result.module)
        setLoadingState('success')
      } else {
        setLoadingState('error')
      }
    } catch (error) {
      setLoadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load module'
      })
      setLoadingState('error')
    }
  }

  const handleConfirmLoad = () => {
    if (loadedModule) {
      // Check for duplicates
      const duplicateCheck = ModuleLoaderService.checkForDuplicates(loadedModule, existingModules)

      if (duplicateCheck.isDuplicate) {
        const confirmMessage = `A module with the same ${duplicateCheck.duplicateType} already exists: "${duplicateCheck.existingModule?.title}". Do you want to replace it?`

        if (!confirm(confirmMessage)) {
          return
        }
      }

      onModuleLoaded(loadedModule)
      handleClose()
    }
  }

  const renderValidationResults = () => {
    if (!loadResult?.validationResult) return null

    const { errors, warnings } = loadResult.validationResult

    return (
      <div className="space-y-3">
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-red-500 mr-2" size={16} />
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Validation Errors
              </h4>
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-yellow-500 mr-2" size={16} />
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Validation Warnings
              </h4>
            </div>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderModulePreview = () => {
    if (!loadedModule) return null

    const preview = ModuleLoaderService.generateModulePreview(loadedModule)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={20} />
            Module Preview
          </CardTitle>
          <CardDescription>
            Review the module details before adding it to your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{preview.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{preview.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Version:</span> {preview.version}
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{formatTime(preview.estimatedTime)}</span>
            </div>
            <div>
              <span className="font-medium">Lessons:</span> {preview.lessonsCount}
            </div>
            <div>
              <span className="font-medium">Quizzes:</span> {preview.quizzesCount}
            </div>
          </div>

          {preview.lessonTitles.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <BookOpen size={16} className="mr-1" />
                Lessons
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {preview.lessonTitles.map((title, index) => (
                  <li key={index}>
                    {index + 1}. {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Load Module" size="lg">
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
          <button
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-not-allowed opacity-50 text-gray-500 dark:text-gray-500"
            disabled
            title="This feature is not available"
          >
            <Lock size={16} className="inline mr-2" />
            Download from URL
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('file')}
          >
            <Upload size={16} className="inline mr-2" />
            Upload File
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'url' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Module URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/module.json"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loadingState === 'loading'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter a direct link to a JSON module file
                </p>
              </div>
              <Button
                onClick={handleLoadFromUrl}
                disabled={!url.trim() || loadingState === 'loading'}
                isLoading={loadingState === 'loading'}
                className="w-full"
              >
                {loadingState === 'loading' ? 'Loading...' : 'Load Module'}
              </Button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Module File
              </label>
              <FileUpload onFileSelect={handleLoadFromFile} disabled={loadingState === 'loading'} />
            </div>
          )}

          {/* Loading State */}
          {loadingState === 'loading' && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading and validating module...
              </p>
            </div>
          )}

          {/* Error State */}
          {loadingState === 'error' && loadResult && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertCircle className="text-red-500 mr-2" size={16} />
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Failed to Load Module
                  </h4>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">{loadResult.error}</p>
              </div>
              {renderValidationResults()}
            </div>
          )}

          {/* Success State */}
          {loadingState === 'success' && loadedModule && (
            <div className="space-y-4">
              {renderValidationResults()}
              {renderModulePreview()}

              <div className="flex space-x-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmLoad} className="flex-1">
                  Add Module
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ModuleLoader
