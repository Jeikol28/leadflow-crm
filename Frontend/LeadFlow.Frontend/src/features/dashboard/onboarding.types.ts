// Tipos que reflejan la respuesta de GET /api/onboarding/status.

export type OnboardingStep = {
  key: string
  title: string
  description: string
  module: string
  actionEndpoint: string
  sortOrder: number
  completedValue: number
  isCompleted: boolean
}

export type OnboardingStatus = {
  totalSteps: number
  completedSteps: number
  completionPercentage: number
  isComplete: boolean
  nextStepKey: string | null
  nextStepTitle: string | null
  steps: OnboardingStep[]
}
