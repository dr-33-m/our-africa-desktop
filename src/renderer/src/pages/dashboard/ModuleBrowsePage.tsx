import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Clock, CheckCircle, Info, Plus } from 'lucide-react'
import { useModules } from '../../hooks/useModules'
import { useAuth } from '../../hooks/useAuth'
import { useProgress } from '../../hooks/useProgress'
import Button from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/Card'
import { formatTime } from '../../lib/utils'
import ModuleLoader from '../../components/modules/ModuleLoader'
import { Module } from '../../types'

const ModuleBrowsePage: React.FC = () => {
  const navigate = useNavigate()
  const { modules, loadModules, saveModule } = useModules()
  const { user } = useAuth()
  const { getModuleProgress, isLoading: isProgressLoading } = useProgress()
  const [isModuleLoaderOpen, setIsModuleLoaderOpen] = useState(false)

  // Load modules when component mounts
  useEffect(() => {
    loadModules()
  }, [loadModules])

  const handleModuleLoaded = async (module: Module): Promise<void> => {
    try {
      await saveModule(module)
      setIsModuleLoaderOpen(false)
    } catch (error) {
      console.error('Failed to save module:', error)
      // The error will be handled by the useModules hook
    }
  }

  if (isProgressLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <p>Loading modules...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text dark:text-text-dark">Browse Modules</h1>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            Discover and download new learning modules to expand your knowledge.
          </p>
        </div>
        <Button onClick={() => setIsModuleLoaderOpen(true)} leftIcon={<Plus size={16} />}>
          Load Module
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {modules.map((module: Module) => {
          const progress = user
            ? getModuleProgress(
                user.id,
                module.id,
                module.content.lessons.length,
                module.content.quizzes?.length || 0
              )
            : null
          const isCompleted = progress?.percentComplete === 100
          // All modules in the store are already downloaded/loaded
          const isDownloaded = true

          return (
            <Card
              key={module.id}
              className="overflow-hidden group hover:shadow-md transition-shadow duration-300"
            >
              <CardHeader className="p-6 pb-0">
                <CardTitle className="text-xl">
                  {module.title}
                  {isDownloaded && (
                    <CheckCircle
                      className="inline-block ml-2 text-success dark:text-success-dark"
                      size={16}
                    />
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-text-secondary">
                    <Clock size={16} className="mr-1" />
                    <span>
                      {formatTime(module.content.estimatedTime || module.estimated_duration || 0)}{' '}
                      estimated
                    </span>
                  </div>

                  <div className="flex items-start space-x-2 text-sm">
                    <Info size={16} className="text-text-secondary mt-0.5 shrink-0" />
                    <p className="text-text-secondary">
                      This module includes {module.content.lessons?.length || 0} lessons and{' '}
                      {module.content.quizzes?.length || 0} quiz
                      {module.content.quizzes?.length === 1 ? '' : 'zes'}.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ to: `/modules/${module.id}` })}
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (isCompleted) {
                      navigate({ to: `/modules/${module.id}` })
                    } else if (module.content.lessons && module.content.lessons.length > 0) {
                      // Navigate to the first lesson or the next incomplete lesson
                      const firstLesson = module.content.lessons[0]
                      navigate({
                        to: `/modules/${module.id}/learn/${firstLesson.id}`
                      })
                    } else {
                      navigate({ to: `/modules/${module.id}` })
                    }
                  }}
                >
                  {isCompleted
                    ? 'Review'
                    : progress && progress.lessonsCompleted > 0
                      ? 'Continue'
                      : 'Start Learning'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <ModuleLoader
        isOpen={isModuleLoaderOpen}
        onClose={() => setIsModuleLoaderOpen(false)}
        onModuleLoaded={handleModuleLoaded}
        existingModules={modules}
      />
    </div>
  )
}

export default ModuleBrowsePage
