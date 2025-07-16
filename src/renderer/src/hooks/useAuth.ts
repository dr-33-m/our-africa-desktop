import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser } from '../types'
import { apiClient } from '../lib/apiClient'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  getAuthHeaders: () => Record<string, string>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const result = await apiClient.login({ email, password })

          if (!result.success) {
            throw new Error(result.error || 'Login failed')
          }

          const authUser: AuthUser = {
            id: result.data!.user.id,
            username: result.data!.user.username,
            email: result.data!.user.email,
            created_at: result.data!.user.created_at,
            token: result.data!.token
          }

          set({ user: authUser, isAuthenticated: true, isLoading: false })
          return true
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred during login',
            isLoading: false
          })
          return false
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const result = await apiClient.register({ username, email, password })

          if (!result.success) {
            throw new Error(result.error || 'Registration failed')
          }

          const authUser: AuthUser = {
            id: result.data!.user.id,
            username: result.data!.user.username,
            email: result.data!.user.email,
            created_at: result.data!.user.created_at,
            token: result.data!.token
          }

          set({ user: authUser, isAuthenticated: true, isLoading: false })
          return true
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred during registration',
            isLoading: false
          })
          return false
        }
      },

      logout: () => {
        apiClient.logout()
        set({ user: null, isAuthenticated: false })
      },

      clearError: () => {
        set({ error: null })
      },

      getAuthHeaders: () => {
        const user = get().user
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`
        }

        return headers
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
