import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useModules } from '../../hooks/useModules'
import { useProgress } from '../../hooks/useProgress'
import Button from '../../components/ui/Button'
import Progress from '../../components/ui/Progress'
import { ContentBlock, UserProgress } from '../../types'
import ModuleCompletionModal from '../../components/modules/ModuleCompletionModal'
import { apiClient } from '../../lib/apiClient'

const LessonPage: React.FC = () => {
  const { moduleId, lessonId } = useParams({
    from: '/modules/$moduleId/learn/$lessonId'
  })
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentModule, loadModuleById, isLoading: moduleLoading } = useModules()
  const { updateLessonProgress, isModuleCompleted } = useProgress()

  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [moduleProgressData, setModuleProgressData] = useState<UserProgress | null>(null)

  useEffect(() => {
    if (moduleId) {
      loadModuleById(parseInt(moduleId))
    }
  }, [moduleId, loadModuleById])

  const handleComplete = async (): Promise<void> => {
    setSaving(true)

    if (currentModule && user) {
      try {
        // Mark lesson as completed
        await updateLessonProgress(user.id, currentModule.id, lessonId, {
          completed: true,
          timeSpent: 0 // Simplified - no detailed time tracking
        })

        setSaving(false)

        // Check if there's a quiz that should appear after this lesson
        const quizAfterThisLesson = currentModule.content.quizzes?.find(
          (quiz) => quiz.afterLessonId === lessonId
        )

        if (quizAfterThisLesson) {
          // Navigate to the quiz that should appear after this lesson
          navigate({ to: `/modules/${moduleId}/quiz/${quizAfterThisLesson.id}` })
        } else {
          // No quiz after this lesson, find the next lesson
          const currentIndex = currentModule.content.lessons.findIndex((l) => l.id === lessonId)
          const nextLesson = currentModule.content.lessons[currentIndex + 1]

          if (nextLesson) {
            // Navigate to next lesson
            navigate({ to: `/modules/${moduleId}/learn/${nextLesson.id}` })
          } else {
            // This is the last lesson - check if module is completed
            const moduleIsCompleted = isModuleCompleted(
              user.id,
              parseInt(moduleId),
              currentModule.content.lessons.length,
              currentModule.content.quizzes?.length || 0
            )

            if (moduleIsCompleted) {
              // All lessons and quizzes completed - get progress data and show completion modal
              try {
                const progressResponse = await apiClient.getModuleProgress(
                  user.id,
                  parseInt(moduleId)
                )
                if (progressResponse.success && progressResponse.data) {
                  setModuleProgressData(progressResponse.data.moduleProgress)
                }
              } catch (error) {
                console.error('Failed to fetch progress data for completion modal:', error)
              }
              setShowCompletionModal(true)
            } else {
              // Not all requirements met - go back to module details
              navigate({ to: `/modules/${moduleId}` })
            }
          }
        }
      } catch (error) {
        setSaving(false)
        console.error('Failed to save lesson progress:', error)
        // Still allow navigation even if progress save fails
        navigate({ to: `/modules/${moduleId}` })
      }
    } else {
      setSaving(false)
    }
  }

  if (moduleLoading || !currentModule) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-dark/50 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-surface-dark/50 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-surface-dark/50 rounded mb-6"></div>
        </div>
      </div>
    )
  }

  const lesson = currentModule.content.lessons.find((l) => l.id === lessonId)

  if (!lesson) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
          <p className="text-text-secondary mb-4">
            The lesson you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => navigate({ to: `/modules/${moduleId}` })}>Back to Module</Button>
        </div>
      </div>
    )
  }

  const currentIndex = currentModule.content.lessons.findIndex((l) => l.id === lessonId)
  const totalLessons = currentModule.content.lessons.length
  const progress = ((currentIndex + 1) / totalLessons) * 100

  const prevLesson = currentIndex > 0 ? currentModule.content.lessons[currentIndex - 1] : null

  const nextLesson =
    currentIndex < totalLessons - 1 ? currentModule.content.lessons[currentIndex + 1] : null

  // Check if there's a quiz after this lesson
  const quizAfterThisLesson = currentModule.content.quizzes?.find(
    (quiz) => quiz.afterLessonId === lessonId
  )

  // Determine if this is the last lesson and there are quizzes
  const finalQuizForModule = !nextLesson && (currentModule.content.quizzes?.length || 0) > 0

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark pb-16">
      {/* Top navigation bar */}
      <header className="sticky top-0 bg-surface dark:bg-surface-dark shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate({ to: `/modules/${moduleId}` })}
                className="text-text-secondary hover:text-text dark:text-text-secondary-dark dark:hover:text-text-dark"
              >
                <ChevronLeft size={20} />
                <span className="sr-only">Back to Module</span>
              </button>

              <div className="text-center">
                <h1 className="text-sm font-medium text-text dark:text-text-dark">
                  {currentModule.title}
                </h1>
                <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
                  Lesson {currentIndex + 1} of {totalLessons}
                </p>
              </div>

              <button
                onClick={() => {}}
                className="text-text-secondary hover:text-text dark:text-text-secondary-dark dark:hover:text-text-dark"
              >
                <MoreHorizontal size={20} />
                <span className="sr-only">More Options</span>
              </button>
            </div>

            <div className="mt-2">
              <Progress value={progress} size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Lesson content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-text dark:text-text-dark">
              {lesson.title}
            </h2>

            <div className="prose dark:prose-invert max-w-none text-text dark:text-text-dark">
              {lesson.content.map((item, index) => (
                <LessonContentRenderer key={index} content={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {prevLesson ? (
            <Button
              variant="outline"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => navigate({ to: `/modules/${moduleId}/learn/${prevLesson.id}` })}
            >
              Previous Lesson
            </Button>
          ) : (
            <div></div>
          )}

          <Button onClick={handleComplete} disabled={saving}>
            {saving
              ? 'Saving...'
              : quizAfterThisLesson
                ? `Take ${quizAfterThisLesson.title}`
                : nextLesson
                  ? 'Next Lesson'
                  : finalQuizForModule
                    ? 'Complete Module'
                    : 'Complete Lesson'}
            {(nextLesson || quizAfterThisLesson) && <ChevronRight size={16} className="ml-2" />}
          </Button>
        </div>
      </main>

      {/* Module Completion Modal */}
      {currentModule && (
        <ModuleCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          module={currentModule}
          progress={moduleProgressData}
          onContinue={() => navigate({ to: '/modules/browse' })}
        />
      )}
    </div>
  )
}

interface LessonContentRendererProps {
  content: ContentBlock
}

const LessonContentRenderer: React.FC<LessonContentRendererProps> = ({ content }) => {
  switch (content.type) {
    case 'text':
      return (
        <div className="mb-6">
          {content.content?.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      )

    case 'image':
      return (
        <div className="mb-6">
          <img src={content.src} alt={content.alt} className="w-full h-auto rounded-lg" />
          {content.alt && (
            <p className="text-sm text-text-secondary mt-2 text-center">{content.alt}</p>
          )}
        </div>
      )

    case 'video':
      return (
        <div className="mb-6">
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
            <iframe
              src={content.src}
              title={content.title}
              className="w-full h-96 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          {content.title && (
            <p className="text-sm text-text-secondary mt-2 text-center">{content.title}</p>
          )}
        </div>
      )

    case 'code':
      return (
        <div className="mb-6">
          <div className="bg-surface-dark rounded-lg overflow-hidden">
            <pre className="p-4 text-text-dark overflow-x-auto">
              <code>{content.content || ''}</code>
            </pre>
          </div>
        </div>
      )

    default:
      return null
  }
}

export default LessonPage
