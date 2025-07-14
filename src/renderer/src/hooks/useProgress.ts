import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  LessonProgress,
  ModuleProgress,
  UserProgress,
  Certificate,
  LessonProgressData
} from '../types'
import { calculateProgress } from '../lib/utils'
import { apiClient } from '../lib/apiClient'

interface ProgressState {
  progress: UserProgress[]
  lessonProgress: LessonProgressData[]
  certificates: Certificate[]
  isLoading: boolean
  error: string | null
  loadProgress: (userId: number) => Promise<void>
  getModuleProgress: (
    userId: number,
    moduleId: number,
    totalLessons: number,
    totalQuizzes: number
  ) => ModuleProgress | null
  getLessonProgress: (userId: number, moduleId: number, lessonId: string) => LessonProgress | null
  updateLessonProgress: (
    userId: number,
    moduleId: number,
    lessonId: string,
    progressData: {
      completed?: boolean
      timeSpent?: number
      quizScore?: number
    }
  ) => Promise<void>
  saveQuizScore: (
    userId: number,
    moduleId: number,
    lessonId: string,
    score: number
  ) => Promise<void>
  isModuleCompleted: (
    userId: number,
    moduleId: number,
    totalLessons: number,
    totalQuizzes: number
  ) => boolean
  getCertificate: (userId: number, moduleId: number) => Certificate | null
  getCertificateCount: (userId: number) => number
  generateCertificate: (userId: number, moduleId: number) => Promise<void>
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: [],
      lessonProgress: [],
      certificates: [],
      isLoading: false,
      error: null,

      loadProgress: async (userId: number) => {
        set({ isLoading: true, error: null })
        try {
          // Load user progress for all modules
          const progressResult = await apiClient.getUserProgress(userId)

          // Load lesson progress for all modules
          const lessonProgressResult = await apiClient.getUserLessonProgress(userId)

          // Load certificates
          const certificatesResult = await apiClient.getUserCertificates(userId)

          if (
            !progressResult.success ||
            !lessonProgressResult.success ||
            !certificatesResult.success
          ) {
            throw new Error('Failed to fetch progress')
          }

          set({
            progress: Array.isArray(progressResult.data) ? progressResult.data : [],
            lessonProgress: Array.isArray(lessonProgressResult.data)
              ? lessonProgressResult.data
              : [],
            certificates: Array.isArray(certificatesResult.data) ? certificatesResult.data : [],
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load progress',
            isLoading: false
          })
        }
      },

      getModuleProgress: (
        userId: number,
        moduleId: number,
        totalLessons: number,
        totalQuizzes: number
      ) => {
        // Get module-level progress
        const moduleProgress = get().progress.find(
          (p) => p && p.user_id === userId && p.module_id === moduleId
        )

        // Get lesson-level progress for this module
        const lessonProgressData = get().lessonProgress.filter(
          (lp) => lp && lp.user_id === userId && lp.module_id === moduleId
        )

        const lessonsCompleted = lessonProgressData.filter(
          (lp) => lp && lp.completed && lp.quiz_score === null
        ).length

        const quizzesCompleted = lessonProgressData.filter(
          (lp) => lp && lp.completed && lp.quiz_score !== null
        ).length

        const totalTimeSpent = lessonProgressData.reduce(
          (acc, lp) => acc + (lp ? lp.time_spent : 0),
          0
        )

        const percentComplete =
          moduleProgress?.progress_percentage ||
          calculateProgress(lessonsCompleted + quizzesCompleted, totalLessons + totalQuizzes)

        return {
          moduleId,
          lessonsCompleted,
          totalLessons,
          quizzesCompleted,
          totalQuizzes,
          totalTimeSpent,
          percentComplete
        }
      },

      getLessonProgress: (userId: number, moduleId: number, lessonId: string) => {
        const lessonProgressData = get().lessonProgress.find(
          (lp) => lp.user_id === userId && lp.module_id === moduleId && lp.lesson_id === lessonId
        )

        if (!lessonProgressData) {
          return null
        }

        return {
          lessonId,
          completed: lessonProgressData.completed,
          timeSpent: lessonProgressData.time_spent
        }
      },

      updateLessonProgress: async (
        userId: number,
        moduleId: number,
        lessonId: string,
        progressData: {
          completed?: boolean
          timeSpent?: number
          quizScore?: number
        }
      ) => {
        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.updateLessonProgress({
            userId,
            moduleId,
            lessonId,
            completed: progressData.completed || false,
            timeSpent: progressData.timeSpent || 0,
            quizScore: progressData.quizScore
          })

          if (!result.success) {
            throw new Error(result.error || 'Failed to update lesson progress')
          }

          const updatedProgress = result.data!

          set((state) => {
            const existingIndex = state.lessonProgress.findIndex(
              (lp) =>
                lp.user_id === userId && lp.module_id === moduleId && lp.lesson_id === lessonId
            )

            if (existingIndex >= 0) {
              const updatedLessonProgress = [...state.lessonProgress]
              updatedLessonProgress[existingIndex] = updatedProgress
              return {
                lessonProgress: updatedLessonProgress,
                isLoading: false
              }
            } else {
              return {
                lessonProgress: [...state.lessonProgress, updatedProgress],
                isLoading: false
              }
            }
          })

          // Reload all progress to get updated module-level progress
          await get().loadProgress(userId)
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update progress',
            isLoading: false
          })
          throw error // Re-throw to allow calling code to handle the error
        }
      },

      saveQuizScore: async (userId: number, moduleId: number, lessonId: string, score: number) => {
        await get().updateLessonProgress(userId, moduleId, lessonId, {
          completed: true,
          quizScore: score
        })
      },

      isModuleCompleted: (
        userId: number,
        moduleId: number,
        totalLessons: number,
        totalQuizzes: number
      ) => {
        // Get lesson-level progress for this module
        const lessonProgressData = get().lessonProgress.filter(
          (lp) => lp.user_id === userId && lp.module_id === moduleId
        )

        // Count completed lessons (entries with lesson IDs like "lesson-1", "lesson-2", etc.)
        const completedLessons = lessonProgressData.filter(
          (lp) => lp.completed && lp.lesson_id.startsWith('lesson-')
        ).length

        // Count completed quizzes (entries with quiz IDs like "quiz-1", "quiz-2", etc.)
        const completedQuizzes = lessonProgressData.filter(
          (lp) => lp.completed && lp.lesson_id.startsWith('quiz-') && lp.quiz_score !== null
        ).length

        // Module is completed when all lessons and all quizzes are completed
        return completedLessons === totalLessons && completedQuizzes === totalQuizzes
      },

      getCertificate: (userId: number, moduleId: number) => {
        return (
          get().certificates.find(
            (cert) => cert.user_id === userId && cert.module_id === moduleId
          ) || null
        )
      },

      getCertificateCount: (userId: number) => {
        return get().certificates.filter((cert) => cert.user_id === userId).length
      },

      generateCertificate: async (userId: number, moduleId: number) => {
        set({ isLoading: true, error: null })
        try {
          const result = await apiClient.generateCertificate(userId, moduleId)

          if (!result.success) {
            throw new Error(result.error || 'Failed to generate certificate')
          }

          // Reload certificates to get the new one
          const certificatesResult = await apiClient.getUserCertificates(userId)

          if (certificatesResult.success) {
            set(() => ({
              certificates: certificatesResult.data || [],
              isLoading: false
            }))
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate certificate',
            isLoading: false
          })
          throw error // Re-throw to allow calling code to handle the error
        }
      }
    }),
    {
      name: 'progress-storage'
    }
  )
)
