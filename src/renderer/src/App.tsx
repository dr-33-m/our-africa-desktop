import React from 'react'
import { RootRoute, Route, Router, RouterProvider, redirect } from '@tanstack/react-router'

import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ModuleBrowsePage from './pages/dashboard/ModuleBrowsePage'
import ModuleDetailsPage from './pages/modules/ModuleDetailsPage'
import LessonPage from './pages/modules/LessonPage'
import QuizPage from './pages/modules/QuizPage'
import { useDataRefresher } from './hooks/useDataRefresher'

// Create root route
const rootRoute = new RootRoute({
  component: Layout
})

// Create routes for the application
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
  beforeLoad: async ({ location }) => {
    // This is a client-side only implementation for demo purposes
    const isAuthenticated = localStorage.getItem('auth-storage') !== null

    if (!isAuthenticated) {
      throw redirect({
        to: '/auth/login',
        search: {
          redirect: location.href
        }
      })
    }
  }
})

// Auth routes
const authRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'auth'
})

const loginRoute = new Route({
  getParentRoute: () => authRoute,
  path: 'login',
  component: LoginPage
})

const registerRoute = new Route({
  getParentRoute: () => authRoute,
  path: 'register',
  component: RegisterPage
})

// Module routes
const modulesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'modules',
  beforeLoad: async ({ location }) => {
    // This is a client-side only implementation for demo purposes
    const isAuthenticated = localStorage.getItem('auth-storage') !== null

    if (!isAuthenticated) {
      throw redirect({
        to: '/auth/login',
        search: {
          redirect: location.href
        }
      })
    }
  }
})

const modulesBrowseRoute = new Route({
  getParentRoute: () => modulesRoute,
  path: 'browse',
  component: ModuleBrowsePage
})

const moduleDetailsRoute = new Route({
  getParentRoute: () => modulesRoute,
  path: '$moduleId',
  component: ModuleDetailsPage
})

const moduleLessonRoute = new Route({
  getParentRoute: () => modulesRoute,
  path: '$moduleId/learn/$lessonId',
  component: LessonPage
})

const moduleQuizRoute = new Route({
  getParentRoute: () => modulesRoute,
  path: '$moduleId/quiz/$quizId',
  component: QuizPage
})

// Create the route tree using the routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute.addChildren([loginRoute, registerRoute]),
  modulesRoute.addChildren([
    modulesBrowseRoute,
    moduleDetailsRoute,
    moduleLessonRoute,
    moduleQuizRoute
  ])
])

// Create the router
const router = new Router({ routeTree })

// Register the router for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  useDataRefresher()
  return <RouterProvider router={router} />
}

export default App
