export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
  },
  strategicMap: {
    tree: '/api/v1/strategic-map/tree',
  },
  perspectives: '/api/v1/strategic-perspectives',
  objectives: '/api/v1/strategic-objectives',
  initiatives: '/api/v1/initiatives',
  keyResults: '/api/v1/key-results',
  steps: '/api/v1/steps',
  justifications: '/api/v1/delay-justifications',
  imports: {
    preview: '/api/v1/import/preview',
    commit: '/api/v1/import/commit',
  }
} as const