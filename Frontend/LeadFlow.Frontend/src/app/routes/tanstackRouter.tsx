// Este archivo define las rutas principales de la aplicacion usando TanStack Router.
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from '@tanstack/react-router'

import { PublicLayout } from '../layouts/PublicLayout'
import { AppLayout } from '../layouts/AppLayout'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ───── Rutas públicas (landing, login, registro) ─────
const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: PublicLayout,
})

const landingRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/',
  component: lazyRouteComponent(
    () => import('../../features/landing/LandingPage'),
    'LandingPage',
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/login',
  component: lazyRouteComponent(
    () => import('../../features/auth/LoginPage'),
    'LoginPage',
  ),
})

const registerRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/register',
  component: lazyRouteComponent(
    () => import('../../features/auth/RegisterPage'),
    'RegisterPage',
  ),
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/forgot-password',
  component: lazyRouteComponent(
    () => import('../../features/auth/ForgotPasswordPage'),
    'ForgotPasswordPage',
  ),
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/reset-password',
  component: lazyRouteComponent(
    () => import('../../features/auth/ResetPasswordPage'),
    'ResetPasswordPage',
  ),
})

const verifyEmailRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/verify-email',
  validateSearch: (search: Record<string, unknown>): { email: string } => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: lazyRouteComponent(
    () => import('../../features/auth/VerifyEmailPage'),
    'VerifyEmailPage',
  ),
})

// ───── Rutas privadas (dentro del shell AppLayout, bajo /app) ─────
const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: AppLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/',
  component: lazyRouteComponent(
    () => import('../../features/dashboard/DashboardPage'),
    'DashboardPage',
  ),
})

const customersRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'customers',
  component: lazyRouteComponent(
    () => import('../../features/customers/CustomersPage'),
    'CustomersPage',
  ),
})

const leadsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'leads',
  component: lazyRouteComponent(
    () => import('../../features/leads/LeadsPage'),
    'LeadsPage',
  ),
})

const leadDetailRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'leads/$leadId',
  component: lazyRouteComponent(
    () => import('../../features/leads/LeadDetailPage'),
    'LeadDetailPage',
  ),
})

const tasksRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'tasks',
  component: lazyRouteComponent(
    () => import('../../features/tasks/TasksPage'),
    'TasksPage',
  ),
})

const interactionsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'interactions',
  component: lazyRouteComponent(
    () => import('../../features/interactions/InteractionsPage'),
    'InteractionsPage',
  ),
})

const servicesRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'services',
  component: lazyRouteComponent(
    () => import('../../features/services/ServicesPage'),
    'ServicesPage',
  ),
})

const quotesRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'quotes',
  component: lazyRouteComponent(
    () => import('../../features/quotes/QuotesPage'),
    'QuotesPage',
  ),
})

const reportsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'reports',
  component: lazyRouteComponent(
    () => import('../../features/reports/ReportsPage'),
    'ReportsPage',
  ),
})

const aiRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'ai',
  component: lazyRouteComponent(
    () => import('../../features/ai/AiAssistantPage'),
    'AiAssistantPage',
  ),
})

const usersRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'users',
  component: lazyRouteComponent(
    () => import('../../features/users/UsersPage'),
    'UsersPage',
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'settings',
  component: lazyRouteComponent(
    () => import('../../features/settings/SettingsPage'),
    'SettingsPage',
  ),
})

const auditRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'audit',
  component: lazyRouteComponent(
    () => import('../../features/audit/AuditPage'),
    'AuditPage',
  ),
})

const profileRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: 'profile',
  component: lazyRouteComponent(
    () => import('../../features/profile/ProfilePage'),
    'ProfilePage',
  ),
})

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([landingRoute, loginRoute, registerRoute, forgotPasswordRoute, resetPasswordRoute, verifyEmailRoute]),
  appShellRoute.addChildren([
    dashboardRoute,
    customersRoute,
    leadsRoute,
    leadDetailRoute,
    tasksRoute,
    interactionsRoute,
    servicesRoute,
    quotesRoute,
    reportsRoute,
    aiRoute,
    usersRoute,
    settingsRoute,
    auditRoute,
    profileRoute,
  ]),
])

export const tanstackRouter = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof tanstackRouter
  }
}