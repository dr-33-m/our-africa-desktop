/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { useModules } from './useModules'
import { useProgress } from './useProgress'

export const useDataRefresher = () => {
  const { user } = useAuth()
  const { loadModules } = useModules()
  const { loadProgress } = useProgress()

  useEffect(() => {
    if (user) {
      loadModules()
      loadProgress(user.id)
    }
  }, [user, loadModules, loadProgress])
}
